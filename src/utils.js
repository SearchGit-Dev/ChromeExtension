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

async function ensureUserId() {
    const { searchgit_user_id } = await storageGet(["searchgit_user_id"]);
    if (searchgit_user_id) {
        return searchgit_user_id;
    }

    // missing—create one now
    const res = await fetch("https://api.searchgit.dev/user/anonymous/account", {
        method: "POST"
    });
    const data = await res.json();
    const { id } = data;
    await storageSet({ searchgit_user_id: id });
    return id;
}

async function getJwt() {
    // 1) guarantee we have a user_id
    const searchgit_user_id = await ensureUserId();

    // 2) now the rest of your token‐caching logic…
    const { searchgit_access } = await storageGet(["searchgit_access"]);
    if (searchgit_access) {
        const { token, expiresAt } = searchgit_access;
        if (Date.now() < expiresAt) {
            return token;
        }
    }

    // 3) form‐URL encode & call login…
    const form = new URLSearchParams({
        grant_type: "password",
        username: searchgit_user_id,
        password: "anonymous"
    });
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
