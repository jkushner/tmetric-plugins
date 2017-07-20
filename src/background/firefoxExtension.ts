//import ch = require('chrome');

//var promptService = ch.Cc['@mozilla.org/embedcomp/prompt-service;1'].getService(ch.Ci.nsIPromptService);

class FirefoxExtension extends ExtensionBase {

    constructor() {
        super(backgroundPort);

        // Inject content scripts in all already opened pages
        var contentScripts = chrome.runtime.getManifest().content_scripts[0];
        var jsFiles = contentScripts.js;
        var cssFiles = contentScripts.css;
        var runAt = contentScripts.run_at;
        chrome.tabs.query({}, tabs =>
            tabs.forEach(tab => {
                if (tab.url.indexOf('http') == 0
                    && tab.url.indexOf('https://chrome.google.com/webstore/') != 0 // https://github.com/GoogleChrome/lighthouse/issues/1023
                    && tab.url.indexOf('https://addons.opera.com/') != 0
                ) {
                    jsFiles.forEach(file => chrome.tabs.executeScript(tab.id, { file, runAt }));
                    cssFiles.forEach(file => chrome.tabs.insertCSS(tab.id, { file }));
                }
            }));

        chrome.runtime.onMessageExternal.addListener((request: any, sender: any, sendResponse: Function) => {
            if (request.message == "version") {
                sendResponse({ version: "2.1.0" });
            }
        });
    }

    /**
     * @override
     * @param message
     */
    showError(message: string) {
        this.getActiveTabId().then(id => {

            this.sendToTabs({
                action: 'error',
                data: { message: message }
            }, id);
        });
    }

    /**
     * @override
     * @param sender
     */
    isPopupRequest(sender: chrome.runtime.MessageSender) {
        return !!(sender.url && sender.url.match(/^moz-extension:\/\/.+popup.html/));
    }

    /**
     * Create popup window
     * @override
     * @param width
     * @param height
     * @param left
     * @param top
     */
    createPopupWindow(width: number, height: number, left: number, top: number) {
        chrome.windows.create(<chrome.windows.CreateData>{
            left,
            top,
            width,
            height,
            url: this.getLoginUrl(),
            type: 'popup'
        }, popupWindow => {

            var popupTab = popupWindow.tabs[0];

            this.loginWinId = popupWindow.id;
            this.loginTabId = popupTab.id;
            this.loginWindowPending = false;

            var deltaWidth = width - popupTab.width;
            var deltaHeight = height - popupTab.height;

            chrome.windows.update(popupWindow.id, <chrome.windows.UpdateInfo>{
                left: left - Math.round(deltaWidth / 2),
                top: top - Math.round(deltaHeight / 2),
                width: width + deltaWidth,
                height: height + deltaHeight
            });
        });
    }
}

new FirefoxExtension();