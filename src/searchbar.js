const native_searchbar = document.getElementsByClassName("AppHeader-search")[0]

const searchgit_searchbar = document.createElement("input")
searchgit_searchbar.id = "searchgit-searchbar"

const searchgit_searchbar_div = document.createElement("div")
searchgit_searchbar_div.style.paddingRight = "28px"
searchgit_searchbar_div.style.marginTop = "-4px"
searchgit_searchbar_div.appendChild(searchgit_searchbar)

native_searchbar.replaceWith(searchgit_searchbar_div)

new autoComplete({
    selector: "#searchgit-searchbar",
    placeHolder: "Search for Food...",
    data: {
        src: ["Sauce - Thousand Island", "Wild Boar - Tenderloin", "Goat - Whole Cut"]
    },
    resultItem: {
        highlight: true,
    }
});
