async function trackClick(referrer, entity_type, entity_id) {
    try {
        const jwt = await getJwt();
        const body = {
            referrer: referrer,
            entity: {
                type: entity_type,
                id: entity_id
            }
        };
        console.log("trackClick")
        console.log(body)
        const resp = await fetch("https://api.searchgit.dev/tracking/click", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${jwt}`
            },
            body: JSON.stringify(body)
        });
        console.log(resp)
    } catch (err) {
        console.log(err)
    }
}

function getReferrerFromURL() {
    const params = new URLSearchParams(window.location.search);
    const channel = params.get('referrer_channel');
    const query   = params.get('referrer_query');
    if (!channel || !query) return null;
    return { channel, query };
}

function trackPageURLVisit() {
    const referrer = getReferrerFromURL();
    const repoMeta = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');
    if (repoMeta) {
        trackClick(referrer, 'repo', repoMeta.content);
        return;
    }
    const orgMeta = document.querySelector('meta[name="octolytics-dimension-organization_login"]');
    if (orgMeta) {
        trackClick(referrer, 'organization', orgMeta.content);
        return;
    }
    const userMeta = document.querySelector('meta[name="octolytics-dimension-user_login"]');
    if (userMeta) {
        trackClick(referrer, 'user', userMeta.content);
        return;
    }
}

trackPageURLVisit();

const page_url_observer = new MutationObserver(() => {
    setTimeout(trackPageURLVisit, 500);
});

const titleElement = document.querySelector('title');
if (titleElement) {
    page_url_observer.observe(titleElement, { childList: true });
}
