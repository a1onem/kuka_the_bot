chrome.browserAction.onClicked.addListener(() => {

    let w = 1190, h = 846;

    let left = (screen.width / 2) - (w / 2);
    let top = (screen.height / 2) - (h / 2);

    chrome.windows.create({
        url: "/kuka.html",
        type: "popup",
        width: w,
        height: h,
        left: left,
        top: top
    });
});