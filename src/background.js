function setupAnonymousAccount() {
    chrome.storage.local.get("searchgit_user_id", ({ searchgit_user_id }) => {
        if (searchgit_user_id) return;
        fetch("https://api.searchgit.dev/user/anonymous/account", { method: "POST" })
            .then(r => r.json())
            .then(({ user_id }) => {
                chrome.storage.local.set({ searchgit_user_id: user_id });
            })
            .catch(console.error);
    });
}

chrome.runtime.onInstalled.addListener(setupAnonymousAccount);
chrome.runtime.onStartup.addListener(setupAnonymousAccount);
