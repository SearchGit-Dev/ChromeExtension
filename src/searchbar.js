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
                const response = await fetch(searchgit_typeahead_api_url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3MzQzODAzNDgzMDU4ODY4MjI0LCJzZXNzaW9uX2lkIjo3MzQ5MjMwNzg4MjMzMTM4MTc2LCJleHAiOjE3NTIxOTY3NjIsImF1ZCI6IlNlYXJjaEdpdCJ9.rDHh3GBJaqsO-PDvFnpQCWNPmpxl3GXZa9SVql5apmo`
                    },
                    body: JSON.stringify({ query })
                });
                const data = await response.json();
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
        element: (item, data) => {
            item.style = "display: flex; justify-content: space-between;";
            item.innerHTML = data;
            return;
            if (data.value.type === "original") {
                item.innerHTML = `<span class="text-secondary" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                            ${data.value.query}
                        </span>
                        <i class="bi bi-arrow-right"></i>`;
            } else if (data.value.type === "corrected") {
                item.innerHTML = `<span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                            <span class="text-secondary">Did you mean</span>
                            <span class="fw-bold text-warning">${data.value.corrected_highlight}</span>
                            <span class="text-secondary">?</span>
                        </span>
                        <span></span>`
            } else if (data.value.type === "major") {
                item.innerHTML = `<span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                            <span class="fw-bold navy">${data.value.acronym}</span>
                            <span class="text-secondary ms-1">${data.value.name}</span>
                        </span>
                        <span class="text-secondary" style="display: flex; align-items: center; font-size: 13px; font-weight: 100">
                            ${data.value.courses_cnt} courses
                        </span>`
            } else if (data.value.type === "course") {
                item.innerHTML = `<span>
                            ${data.value.acronym}
                        </span>
                        <span class="text-secondary ms-4" style="text-overflow: ellipsis; margin-top:3px; white-space: nowrap; overflow: hidden; font-size: 13px; font-weight: 100">
                            ${data.value.name}
                        </span>`
            } else if (data.value.type === "professor") {
                var starClass = ''
                if (data.value.stars >= 4) {
                    starClass = 'bi-star-fill'
                } else if (data.value.stars >= 2) {
                    starClass = 'bi-star-half'
                } else {
                    starClass = 'bi-star'
                }
                item.innerHTML = `<span class="d-flex align-items-center">
                            <img src="${data.value.img_url}" style="max-width:32px;max-height:32px;object-fit: contain" class="rounded me-2">
                            <span>${data.value.name}</span>
                            <span class="ms-1 font-sm text-secondary mb-0">${data.value.department}</span>
                        </span>
                        <span style="display: flex; align-items: center; font-size: 13px; font-weight: 100">
                            <span class="text-warning fw-bold">
                                <i class="bi ${starClass} me-1"></i> ${data.value.stars.toFixed(1)}
                            </span>
                            <span class="ms-2 text-secondary">${data.value.reviews_cnt} reviews</span>
                        </span>`
            }
        }
    },
}

const autoCompleteJS = new autoComplete(autocomplete_config);
