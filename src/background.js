function setupAnonymousAccount() {
    chrome.storage.local.get("searchgit_user_id", ({ searchgit_user_id }) => {
        if (searchgit_user_id) return;
        fetch("https://api.searchgit.dev/user/anonymous/account", { method: "POST" })
            .then(r => r.json())
            .then(({ id }) => {
                chrome.storage.local.set({ searchgit_user_id: id });
            })
            .catch(console.error);
    });
}

chrome.runtime.onInstalled.addListener(setupAnonymousAccount);
