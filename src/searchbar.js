let lastSelection = null;
let lastQueryRequested = "";
const searchgit_typeahead_api_url = "https://api.searchgit.dev/search/typeahead";

function getCurrentQuery() {
    const url = new URL(window.location.href)
    if (url.searchParams.get('type') === 'repositories') {
        return url.searchParams.get('q')
    }
    return ""
}

async function getTypeaheads(query) {
    lastQueryRequested = query;
    const jwt = await getJwt();
    return await fetch(searchgit_typeahead_api_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({ query })
    });
}

function collapseNotLoggedinNav() {
    // 1. Find the global nav
    const nav = document.querySelector('nav.HeaderMenu-nav');
    if (!nav) return;

    // 2. Skip if user *is* logged in (profile menu present)
    if (document.querySelector('summary[aria-label="View profile and more"]')) return;

    // 3. Grab the <ul> of menu items
    const menuList = nav.querySelector('ul');
    if (!menuList) return;

    // 4. Build a <details> wrapper
    const details = document.createElement('details');
    details.style.cssText = 'position: relative; display: inline-block;';

    // 5. Build the toggle <summary>
    const summary = document.createElement('summary');
    // Use innerHTML so we can mix text + an inline SVG arrow
    summary.innerHTML = `
  Menu
  <svg aria-hidden="true" height="12" viewBox="0 0 16 16" width="12" fill="currentColor" style="margin-left:4px;">
    <path d="M2 5l6 6 6-6z"></path>
  </svg>
`;

// Flex layout & styling
    summary.style.cssText = [
        'cursor: pointer',
        'display: inline-flex',
        'align-items: center',
        'padding: 6px 10px',
        'background: var(--color-btn-primary-bg)',
        'color: var(--color-btn-primary-text)',
        'border-radius: 4px',
        'font-weight: 600',
    ].join('; ');

    details.appendChild(summary);

    // 6. Clone in the existing list (so events/sub‐menus still work)
    const listClone = menuList.cloneNode(true);
    listClone.style.cssText = [
        'position: absolute',
        'top: 100%',
        'left: 0',
        'background: var(--color-canvas-default)',
        'box-shadow: 0 4px 12px rgba(0,0,0,0.15)',
        'border-radius: 4px',
        'padding: 8px 0',
        'margin: 4px 0 0',
        'list-style: none',
        'z-index: 1000',
    ].join('; ');
    details.appendChild(listClone);

    // 7. Swap the old nav for our dropdown
    nav.replaceWith(details);
}

function inject_searchgit_searchbar() {
    let native_searchbar = document.getElementsByClassName("AppHeader-search")[0]
    if (native_searchbar == null) {
        // User is not logged in. In this case, let's try overriding the default navbar!
        collapseNotLoggedinNav()
        native_searchbar = document.getElementsByClassName("search-input")[0]
        if (native_searchbar == null) {
            return  // give up
        }
    }
    if (document.getElementById("searchgit-searchbar") != null) {
        return
    }
    const searchgit_searchbar = document.createElement("input")
    searchgit_searchbar.id = "searchgit-searchbar"
    searchgit_searchbar.name = "q"        // THIS is the key GitHub looks for
    searchgit_searchbar.autocomplete = "off"
    searchgit_searchbar.value = getCurrentQuery()

    const form = document.createElement("form")
    form.action = "https://github.com/search"
    form.method = "GET"
    form.style.display = "flex"           // preserve your flex styling
    form.style.alignItems = "center"
    form.style.paddingRight = "28px"
    form.style.marginTop = "-4px"
    form.appendChild(searchgit_searchbar)

    form.style.position = "relative";
    const credit = document.createElement("span");
    credit.textContent = "Jiaming Liu @ UCSB";
    credit.style.position = "absolute";
    credit.style.fontSize = "0.5em";         // super small
    credit.style.opacity  = "0.05";           // almost invisible
    credit.style.pointerEvents = "none";     // don’t get in the way of clicks
    credit.style.right = "36px";
    form.appendChild(credit);

    native_searchbar.replaceWith(form)

    const input = document.querySelector('#searchgit-searchbar');
    input.addEventListener('selection', e => {
        lastSelection = e.detail.selection.value;
    });
    form.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(form);
        const queryInSearchbar = (searchgit_searchbar?.value || '').trim();
        if (lastSelection) {
            trackTypeaheadClick(lastSelection.type, lastSelection.payload);
        } else {
            trackClick(null, 'query', queryInSearchbar);
        }
        if (lastSelection && lastSelection.type !== 'query') {
            window.location.href = lastSelection.payload.github_url;
        } else {
            // do full page load so that search_results.js can be executed properly
            const params = new URLSearchParams(formData).toString();
            window.location.href = `${form.action}?${params}`;
        }
    });

    const autocomplete_config = {
        placeHolder: 'Search Github',
        selector: "#searchgit-searchbar",
        debounce: 0,
        threshold: 0, // allow empty-string triggering
        trigger: (query) => {
            return true
        },
        searchEngine: "loose",
        data: {
            src: async (query) => {
                try {
                    const http_call = await getTypeaheads(query);
                    const response = await http_call.json();
                    const data = response['secondary'];
                    for (let i = 0; i < data.length; i++) {
                        data[i]['query'] = query;       // placeholder for autocomplete to match everything
                        if (data[i]['payload']['github_url']) {
                            const url = new URL(data[i]['payload']['github_url']);
                            url.searchParams.set('referrer_channel', 'typeahead');
                            url.searchParams.set('referrer_query', query);
                            data[i]['payload']['github_url'] = url.toString();
                        }
                    }
                    return data;
                } catch (error) {
                    return error;
                }
            },
            cache: false,
            keys: ['query']
        },
        submit: true,
        events: {
            input: {
                focus: () => {
                    autoCompleteJS.start(" ");
                }
            }
        },
        resultsList: {
            noResults: false,
            maxResults: undefined,
            tabSelect: true
        },
        resultItem: {
            highlight: true,
            element: (item, suggestion) => {
                const typeahead_item = suggestion.value;
                const type = typeahead_item.type;
                const payload = typeahead_item.payload;

                // layout
                item.style.display         = "flex";
                item.style.justifyContent  = "space-between";
                item.style.alignItems      = "center";
                item.style.padding         = "0.25rem 0.5rem";

                // helper to render an avatar + text
                const renderAvatar = (url, label) => {
                    const img = document.createElement("img");
                    img.src          = url;
                    img.alt          = label;
                    img.width        = 20;
                    img.height       = 20;
                    img.style.borderRadius = "50%";
                    img.style.marginRight   = "8px";
                    return img;
                };

                // clear out any previous content
                item.textContent = "";

                switch (type) {
                    case "query": {

                        const left = document.createElement("div");
                        left.style.display = "flex";
                        left.style.alignItems = "center";

                        // clear any existing content
                        item.textContent = "";

                        // 1) create an inline SVG search icon
                        const search_icon = document.createElement("span");
                        search_icon.innerHTML = `
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16" height="16"
      fill="currentColor"
      style="margin-right: 0.5rem; flex-shrink: 0;"
    >
      <path fill-rule="evenodd"
        d="M15.7 14.3l-4-4a6.5 6.5 0 1 0-1.4 1.4l4 4a1 1 0 0 0 1.4-1.4zM6.5 12a5.5 
           5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"
      />
    </svg>
  `;
                        search_icon.style.marginLeft = '3.5px'
                        search_icon.style.marginRight = '0.5px'

                        // 2) set the item’s text
                        const label = document.createElement("span");
                        label.textContent = payload.query;
                        label.style.marginBottom = "4px";


                        // little avatar of the owner
                        left.appendChild(
                            search_icon
                        );
                        left.appendChild(
                            label
                        );

                        const right = document.createElement("span");
                        right.textContent = ``;     // empty for now

                        item.append(left, right);
                    }
                        break;

                    case "repo":
                    {
                        const left = document.createElement("div");
                        left.style.display = "flex";
                        left.style.alignItems = "center";

                        // little avatar of the owner
                        left.appendChild(
                            renderAvatar(payload.owner_avatar_url, payload.owner_login)
                        );
                        left.appendChild(
                            document.createTextNode(`${payload.owner_login}/${payload.name}`)
                        );

                        const right = document.createElement("span");

                        right.innerHTML = `☆ <small>${formatCount(payload.stargazers_count)}</small>`;

                        right.style.fontSize   = "0.9em";     // optional: match GitHub's smaller text
                        right.style.verticalAlign = "middle"; // optional: to line up nicely
                        right.style.color = 'var(--color-prettylights-syntax-comment)'

                        item.appendChild(right);

                        item.append(left, right);
                    }
                        break;

                    case "user":
                    {
                        const left = document.createElement("div");
                        left.style.display = "flex";
                        left.style.alignItems = "center";
                        left.appendChild(renderAvatar(payload.avatar_url, payload.login));
                        left.appendChild(document.createTextNode(payload.login));

                        left.appendChild(createBadge("user"));

                        const right = document.createElement("span");
                        right.innerHTML = `<small>${formatCount(payload.followers_count)} followers</small>`;
                        right.style.color = 'var(--color-prettylights-syntax-comment)'

                        item.append(left, right);
                    }
                        break;

                    case "organization":
                    {
                        const left = document.createElement("div");
                        left.style.display = "flex";
                        left.style.alignItems = "center";
                        left.appendChild(renderAvatar(payload.avatar_url, payload.login));
                        left.appendChild(document.createTextNode(payload.login));

                        left.appendChild(createBadge("organization"))

                        item.appendChild(left);
                    }
                        break;

                    default:
                        item.textContent = JSON.stringify(suggestion.payload);
                }

                item.style.cursor = "pointer";
                item.addEventListener('click', e => {
                    e.preventDefault();
                    trackTypeaheadClick(type, payload);
                    if (type === 'query') {
                        const q = encodeURIComponent(payload.query);
                        window.location.href = `https://github.com/search?q=${q}`;
                    } else {
                        window.location.href = payload.github_url;
                    }
                });
                return item;
            }
        },
    }
    const autoCompleteJS = new autoComplete(autocomplete_config);

    // keep arrow-key behavior unchanged
    document
        .querySelector('#searchgit-searchbar')
        .addEventListener('navigate', selectSuggestion);

    getTypeaheads("")        // warm up typeahead request

    // Slash to activate searching
    document.addEventListener('keydown', (e) => {
        // only trigger on plain slash, no modifiers
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const active = document.activeElement;
            const tag = active && active.tagName && active.tagName.toLowerCase();

            // ignore if user is already typing in an input, textarea or a contentEditable
            if (tag !== 'input' && tag !== 'textarea' && !active.isContentEditable) {
                const input = document.getElementById('searchgit-searchbar');
                if (input) {
                    e.preventDefault();     // stop the `/` from getting inserted anywhere
                    input.focus();
                    // optionally select the text so new typing replaces the old query:
                    // input.select();
                }
            }
        }
    });
}

function selectSuggestion(event){
    let suggestion = event.detail.selection.value;
    document.getElementById('searchgit-searchbar').value = formatDisplay(suggestion);
}

function createBadge(label) {
    const badge = document.createElement("span");
    badge.textContent = label;

    // common styling
    badge.style.marginLeft     = "0.5rem";
    badge.style.marginTop = "2px";
    badge.style.display        = "inline-flex";
    badge.style.alignItems     = "center";
    badge.style.fontSize       = "0.65em";
    badge.style.lineHeight     = "1";
    badge.style.padding        = "0.05em 0.3em";
    badge.style.height         = "1.2em";
    badge.style.backgroundColor= "#e1e4e8";
    badge.style.color          = "#24292e";
    badge.style.borderRadius   = "0.6rem";
    badge.style.fontWeight     = "600";

    return badge;
}

function formatDisplay(s) {
    switch (s.type) {
        case 'query':        return s.payload.query;
        case 'repo':         return s.payload.name;
        case 'user':
        case 'organization': return s.payload.login + '/';
    }
}

async function trackTypeaheadClick(type, payload) {
    // Only tracks query click! Other types are NOT tracked, as they are tracked after a repo/user/org page is clicked
    if (type === 'query') {
        const referrer = {
            channel: 'typeahead',
            query: lastQueryRequested
        }
        trackClick(referrer, 'query', payload.query)
    }
}

function formatCount(count) {
    if (count >= 1_000_000) {
        return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (count >= 1_000) {
        return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return count.toString();
}

const searchbar_observer = new MutationObserver(function(mutationsList, observer) {
    inject_searchgit_searchbar()
});
searchbar_observer.observe(document.body, { childList: true, subtree: true });

inject_searchgit_searchbar()
