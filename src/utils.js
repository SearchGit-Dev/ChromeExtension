// Helpers to turn chrome.storage into Promise-based calls
function storageGet(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, items => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(items);
            }
        });
    });
}

function storageSet(items) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

async function getJwt() {
    // 1) pull the user_id out of storage
    const { searchgit_user_id } = await storageGet(["searchgit_user_id"]);
    if (!searchgit_user_id) {
        throw new Error("No anonymous user_id in storage");
    }

    // 2) check cached token
    const { searchgit_access } = await storageGet(["searchgit_access"]);
    if (searchgit_access) {
        const { token, expiresAt } = searchgit_access;
        if (Date.now() < expiresAt) {
            return token;
        }
    }

    // 3) fetch a new one
    const form = new URLSearchParams();
    form.append("grant_type", "password");
    form.append("username", searchgit_user_id);
    form.append("password", "anonymous");

    const resp = await fetch(
        "https://api.searchgit.dev/user/anonymous/login",
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: form.toString(),
        }
    );
    if (!resp.ok) {
        throw new Error(`Login failed: ${resp.status}`);
    }
    const { access_token } = await resp.json();

    // 4) hard-code a 30-minute expiration
    const expiresAt = Date.now() + 30 * 60 * 1000;
    await storageSet({
        searchgit_access: { token: access_token, expiresAt },
    });

    return access_token;
}
