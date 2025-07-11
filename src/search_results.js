function isRepoSearch() {
    return new URL(window.location.href).searchParams.get('type') === 'repositories';
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
        card.innerHTML = /* html */ `
      <a href="${github_url}" target="_blank" class="sg-card-link">
        <header class="sg-card-header">
          <img 
            src="${owner_avatar_url}" 
            class="sg-card-avatar" 
            alt="${owner_login} avatar"
          >
          <div class="sg-card-title">
            <h3>${owner_login}/${name}</h3>
          </div>
        </header>

        <section class="sg-card-body" style="margin-top: 8px">
          ${description ? `<p class="sg-card-desc">${description}</p>` : ''}

          <p class="sg-langs">
            <span>${programming_language || '—'}</span>
            <span>⭐ ${stargazers_count.toLocaleString()}</span>
            <time 
              class="sg-updated-at" 
              datetime="${updated_at}"
            >
              Updated ${new Date(updated_at).toLocaleDateString()}
            </time>
          </p>

          ${
            readmeSnippet
                ? `<small>${readme_filename}</small><pre class="sg-readme-snippet">${readmeSnippet}</pre>`
                : ''
            }
        </section>
      </a>
    `;

        container.appendChild(card);
    });

    return container;
}

function getGithubRepoContainer() {
    let container = document.querySelector('ul.repo-list');
    if (container) return container;

    container = document.querySelector('.search-results-page');
    if (container) return container;

    const item = document.querySelector('.repo-list-item');
    return item && item.closest('ul, div');
}

async function overrideRepoResults() {
    if (!isRepoSearch()) return;

    const githubReposContainer = getGithubRepoContainer();
    if (githubReposContainer) {
        githubReposContainer.style.display = 'none';
    }

    let searchgitReposContainer = document.getElementById('searchgit-repo-results');
    if (!searchgitReposContainer) {
        searchgitReposContainer = document.createElement('div');
        searchgitReposContainer.id = 'searchgit-repo-results';
    }
    searchgitReposContainer.innerHTML = '<p>Loading enhanced repos…</p>';
    githubReposContainer.replaceWith(searchgitReposContainer);

    const loading = document.createElement('p');
    loading.id = 'sg-loading';
    loading.textContent = 'Loading enhanced results…';

    try {
        const { query, page } = readQuery();
        const data = await fetchRepos({ query, page });
        loading.remove();
        const cards = renderCards(data.repos);
        searchgitReposContainer.replaceWith(cards)

    } catch (err) {
        loading.textContent = `Error loading results: ${err.message}`;
    }
}

overrideRepoResults()
