function isRepoSearch() {
    return new URL(window.location.href).searchParams.get('type') === 'repositories';
}

function getGithubRepoContainer() {
    let container = document.querySelector('ul.repo-list');
    if (container) return container;

    container = document.querySelector('.search-results-page');
    if (container) return container;

    const item = document.querySelector('.repo-list-item');
    return item && item.closest('ul, div');
}

function overrideRepoResults() {
    if (!isRepoSearch()) return;

    const githubReposContainer = getGithubRepoContainer();
    console.log(githubReposContainer);
    if (githubReposContainer) {
        githubReposContainer.style.display = 'none';
    }

    let searchgitReposContainer = document.getElementById('searchgit-repo-results');
    if (!searchgitReposContainer) {
        searchgitReposContainer = document.createElement('div');
        searchgitReposContainer.id = 'searchgit-repo-results';
    }
    searchgitReposContainer.innerHTML = '<p>Loading enhanced repos…</p>';
    // e.g. call your API, then populate customContainer.innerHTML with cards, etc.
}

overrideRepoResults()
