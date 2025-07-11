const native_searchbar = document.getElementsByClassName("AppHeader-search")[0]

const searchgit_searchbar = document.createElement("input")
searchgit_searchbar.id = "searchgit-searchbar"

const searchgit_searchbar_div = document.createElement("div")
searchgit_searchbar_div.style.paddingRight = "28px"
searchgit_searchbar_div.style.marginTop = "-4px"
searchgit_searchbar_div.appendChild(searchgit_searchbar)

native_searchbar.replaceWith(searchgit_searchbar_div)

const searchgit_typeahead_api_url = "https://api.searchgit.dev/search/typeahead";
const autocomplete_config = {
    placeHolder: 'Search Github',
    selector: "#searchgit-searchbar",
    debounce: 0,
    searchEngine: "loose",
    data: {
        src: async (query) => {
            try {
                const http_call = await fetch(searchgit_typeahead_api_url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // todo: get actual JWT
                        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3MzQzODAzNDgzMDU4ODY4MjI0LCJzZXNzaW9uX2lkIjo3MzQ5MjMwNzg4MjMzMTM4MTc2LCJleHAiOjE3NTIxOTY3NjIsImF1ZCI6IlNlYXJjaEdpdCJ9.rDHh3GBJaqsO-PDvFnpQCWNPmpxl3GXZa9SVql5apmo`
                    },
                    body: JSON.stringify({ query })
                });
                const response = await http_call.json();
                const data = response['secondary'];
                for (let i = 0; i < data.length; i++) {
                    data[i]['query'] = query;       // placeholder for autocomplete to match everything
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
                if (autoCompleteJS.input.value.length) autoCompleteJS.start();
            }
        }
    },
    resultsList: {
        element: (list, data) => {
            if (data.results.length === 0) {
                const info = document.createElement("p");
                info.classList.add('pt-2', 'px-3', 'text-secondary', 'text-sm');
                info.innerHTML = `Nothing found`;
                list.prepend(info);
            }
        },
        noResults: true,
        maxResults: 20,
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
                img.style.marginRight   = "0.5rem";
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
                    right.textContent = `${payload.stargazers_count} ⭐`;

                    item.append(left, right);
                }
                    break;

                case "user":
                {
                    const left = document.createElement("div");
                    left.style.display = "flex";
                    left.style.alignItems = "center";
                    left.appendChild(
                        renderAvatar(payload.avatar_url, payload.login)
                    );
                    left.appendChild(document.createTextNode(payload.login));

                    const right = document.createElement("span");
                    right.textContent = `${payload.followers_count} followers`;

                    item.append(left, right);
                }
                    break;

                case "organization":
                {
                    const left = document.createElement("div");
                    left.style.display = "flex";
                    left.style.alignItems = "center";
                    left.appendChild(
                        renderAvatar(payload.avatar_url, payload.login)
                    );
                    left.appendChild(document.createTextNode(payload.login));

                    item.append(left);
                }
                    break;

                default:
                    item.textContent = JSON.stringify(suggestion.payload);
            }

            item.style.cursor = "pointer";
            item.addEventListener('click', e => {
                e.preventDefault();
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

function selectSuggestion(event){
    let suggestion = event.detail.selection.value;
    let payload = suggestion.payload;
    var displayVal = '';
    if (suggestion.type === 'query') {
        displayVal = payload.query;
    } else if (suggestion.type === 'repo') {
        displayVal = payload.name;
    } else if (suggestion.type === 'user') {
        displayVal = payload.login;
    } else if (suggestion.type === 'organization') {
        displayVal = payload.login;
    }
    document.getElementById('searchgit-searchbar').value = displayVal;
}

document.querySelector("#searchgit-searchbar").addEventListener("navigate", function (event) {
    selectSuggestion(event);
});
document.querySelector("#searchgit-searchbar").addEventListener("selection", function (event) {
    selectSuggestion(event);
    document.getElementById('searchgit-searchbar').form.submit();
});
