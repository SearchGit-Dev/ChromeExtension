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
        await fetch("https://api.searchgit.dev/tracking/click", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${jwt}`
            },
            body: JSON.stringify(body)
        });
    } catch (err) {
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
    const repoMeta = document.querySelector('meta[name="octolytics-dimension-repository_id"]');
    if (repoMeta) {
        trackClick(referrer, 'repo', repoMeta.content);
        return;
    }
    const userMeta = document.querySelector('meta[name="octolytics-dimension-user_id"]');
    if (userMeta) {
        trackClick(referrer, 'user', userMeta.content);
        return;
    }
    const maybeOrgMeta = document.querySelector('meta[name="hovercard-subject-tag"]');
    if (maybeOrgMeta && maybeOrgMeta.content.startsWith("organization:")) {
        const orgId = maybeOrgMeta.content.slice("organization:".length);
        trackClick(referrer, 'organization', orgId);
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
