const humanizer = humanizeDuration.humanizer({
    // only show the largest unit (e.g. “5 days” not “5 days, 3 hours”)
    largest: 1,
    // round to an integer
    round: true,
    // you can tweak units if you don’t want weeks, months, etc:
    // units: ["y","mo","d","h","m","s"],
});


function isRepoSearch() {
    const url = new URL(window.location.href);
    if (url.hostname !== 'github.com') return false;
    if (!url.pathname.startsWith('/search')) return false;
    return url.searchParams.get('type') === 'repositories';
}

function readQuery() {
    const u = new URL(location.href);
    return {
        query: u.searchParams.get('q') || '',
        page: parseInt(u.searchParams.get('p') || u.searchParams.get('page') || '1', 10),
    };
}

async function fetchRepos({ query, page }) {
    const token = await getJwt();
    const resp = await fetch('https://api.searchgit.dev/search/repo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            query,
            page,
            use_did_you_mean: true,
            created_at: 'all_times',
        }),
    });
    if (!resp.ok) throw new Error(`API error ${resp.status}`);
    return resp.json();
}

function renderCards(repos) {
    const container = document.createElement('div');
    container.id = 'sg-custom-results';
    container.className = 'sg-grid';   // 1-column grid per CSS you already set

    repos.forEach(repo => {
        const {
            owner_avatar_url,
            owner_login,
            name,
            description,
            github_url,
            stargazers_count,
            updated_at,
            programming_language,
            linguistic_language,
            readme_filename,
            readme_normalized,
            topics,
        } = repo;

        // build a short snippet from the normalized README
        const readmeSnippet = readme_normalized
            ? readme_normalized
                .trim()
                .split(/\r?\n/)
                .filter(Boolean)
                .slice(0, 5)
                .join('\n')
            : '';

        const card = document.createElement('div');
        card.className = 'sg-card';
        const updated_ago = Date.now() - (new Date(updated_at));
        const firstFiveTopics = topics.slice(0, 5);
        const topicsHtml = firstFiveTopics
            .map(topic => `<span class="sg-topic-badge"># ${topic}</span>`)
            .join("");

        card.innerHTML = /* html */ `
      <a href="${github_url}" target="_blank" class="sg-card-link">
        <section class="sg-card-header">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px">
            <time class="sg-updated-ago" datetime="${updated_at}">
              Updated ${humanizer(updated_ago)} ago
            </time>
            <span class="sg-programming-lang">${programming_language || ''}</span>
          </div>
          <div style="display: flex; justify-content: start; align-items: center">
             <img src="${owner_avatar_url}"  class="sg-card-avatar" alt="${owner_login} avatar">
             <div class="sg-card-title"><h3>${owner_login}/${name}</h3></div>
            </div>
        </section>

        <section class="sg-card-body">
          ${description ? `<p class="sg-card-desc">${description}</p>` : ''}

         <div style="display: flex; justify-content: start; gap: 8px; align-items: center">
             <span class="sg-stars-count" style="margin-right:8px">★ ${formatCount(stargazers_count)}</span>
             ${topicsHtml}
         </div>

        </section>
      </a>
    `;

        container.appendChild(card);
    });

    return container;
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

function getGithubRepoContainer() {
    return document.querySelector('div[data-testid="results-list"]');
}

function getGithubPagination() {
    return document.querySelector('nav[aria-label="Pagination"]')
}

function getGithubSortButton() {
    return document.querySelector('button[data-testid="sort-button"]');
}

function hideSidebarGroups() {
    // 1) Find the overall facets container
    const pane = document.querySelector('[data-testid="facets-pane"]');
    if (!pane) return;

    // 2) Look at each direct <li> under the filter-groups list
    pane
        .querySelectorAll('[data-testid="filter-groups"] > li')
        .forEach(group => {
            // 3) Find an <h3> inside the group
            const heading = group.querySelector('h3');
            if (!heading) return;

            const txt = heading.textContent.trim();
            if (txt === 'Languages' || txt === 'Advanced') {
                group.style.display = 'none';
            }
        });
}

function expandTypeNavMore() {
    const navButtons = document.querySelectorAll('[data-testid="filter-groups"] button');
    const moreBtn = Array.from(navButtons).find(b => b.textContent.trim() === 'More');
    if (moreBtn) {
        moreBtn.click();
    }
}


async function overrideRepoResults() {
    if (!isRepoSearch()) return;

    const githubReposContainer = getGithubRepoContainer();
    if (githubReposContainer) {
        githubReposContainer.style.display = 'none';
        if (getGithubPagination()) {
            getGithubPagination().style.display = 'none';
        }
        if (getGithubSortButton()) {
            getGithubSortButton().style.display = 'none';
        }
        hideSidebarGroups()
        expandTypeNavMore()
    } else {
        return
    }

    let searchgitReposContainer = document.getElementById('searchgit-repo-results');
    if (searchgitReposContainer != null) {
        return
    }
    if (!searchgitReposContainer) {
        searchgitReposContainer = document.createElement('div');
        searchgitReposContainer.id = 'searchgit-repo-results';
    }
    githubReposContainer.replaceWith(searchgitReposContainer);

    const skeletonList = document.createElement('div');
    skeletonList.className = 'sg-skeleton-list';
    for (let i = 0; i < 6; i++) {
        const card = document.createElement('div');
        card.className = 'sg-skeleton-card';
        skeletonList.appendChild(card);
    }

    searchgitReposContainer.appendChild(skeletonList);

    try {
        const { query, page } = readQuery();
        const data = await fetchRepos({ query, page });
        const cards = renderCards(data.repos);
        searchgitReposContainer.replaceWith(cards)

    } catch (err) {
        skeletonList.remove();
    }
}

const search_results_observer = new MutationObserver(function(mutationsList, observer) {
    overrideRepoResults()
});
search_results_observer.observe(document.body, { childList: true, subtree: true });

overrideRepoResults()
