// Background page -- background.js
chrome.runtime.onConnect.addListener(devToolsConnection => {
    // assign the listener function to a variable so we can remove it later
    console.log("Hi from the background");

    // add the listener
    const devToolsListener = devToolsConnection.onMessage.addListener((message, sender, sendResponse) => {
        // Inject a content script into the identified tab
        console.log(message);
        chrome.tabs.executeScript(message.tabId,
            { file: message.scriptToInject });
    })

    devToolsConnection.onDisconnect.addListener(() => {
        devToolsConnection.onMessage.removeListener(devToolsListener);
    });
});

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    console.log(request.command, request.command === "startProfiling");
    if (request.command === "startProfiling") {
        chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabArray) {
                var activeTab = tabArray[0];
                console.log("tabid: " + activeTab.id)
                chrome.debugger.attach({ tabId: activeTab.id }, "1.2", function () {
                    console.log("attached");
                    chrome.debugger.sendCommand({ tabId: activeTab.id }, "Profiler.enable", undefined, function (result) {
                        chrome.debugger.sendCommand({ tabId: activeTab.id }, "Profiler.start", undefined, function (result) {
                            console.log("ProfilerStarted:", result);
                            chrome.debugger.sendCommand({ tabId: activeTab.id }, "Profiler.startPreciseCoverage", { callCount: true, detailed: true }, function (result) {
                                console.log("coverageStarted:", result);

                            });
                        });
                    });
                });
            }
        );
    }
    if (request.command === "endProfiling") {
        chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabArray) {
                var activeTab = tabArray[0];
                chrome.debugger.sendCommand({ tabId: activeTab.id }, "Profiler.takePreciseCoverage", undefined, function (response) {
                    // send result to devtools script
                    console.log(response.result);
                    methods = [];
                    for (var obj of response.result) {
                        if (obj.url.includes("main.chunk.js")) {
                            for (var func of obj.functions) {
                                if (func.isBlockCoverage && func.functionName !== "") {
                                    methods.push(func.functionName);
                                }
                            }
                        }
                    }
                    console.log(methods);
                    chrome.runtime.sendMessage({ type: "profiling", msg: methods, tags:request.tag }, (response) => console.log(response));
                    chrome.debugger.sendCommand({ tabId: activeTab.id }, "Profiler.stopPreciseCoverage", undefined, function (result) {
                        chrome.debugger.sendCommand({ tabId: activeTab.id }, "Profiler.stop", undefined, function (result) {
                            chrome.debugger.sendCommand({ tabId: activeTab.id }, "Profiler.disable", undefined, function (result) {

                            });
                        });
                    });

                });
            }
        );
    }
});