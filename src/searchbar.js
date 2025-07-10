const color_mode = document.documentElement.getAttribute("data-color-mode");

const native_searchbar = document.getElementsByClassName("AppHeader-search")[0]
const searchgit_searchbar = document.createElement("input")
searchgit_searchbar.id = "searchgit-searchbar"
native_searchbar.replaceWith(searchgit_searchbar)

new autoComplete({
    selector: "#searchgit-searchbar",
    placeHolder: "Search for Food..." + color_mode,
    data: {
        src: ["Sauce - Thousand Island", "Wild Boar - Tenderloin", "Goat - Whole Cut"]
    },
    resultItem: {
        highlight: true,
    }
});
