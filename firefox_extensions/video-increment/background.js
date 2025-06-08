chrome.browserAction.onClicked.addListener(function(tab) {
    if (!tab || !tab.url) return;
  
    const currentUrl = tab.url;
    const match = currentUrl.match(/(.*?)(\d+)([^\/]*)$/);
  
    if (match) {
      const prefix = match[1];
      const number = match[2];
      const suffix = match[3];
      const numberLength = number.length;
      const nextNumber = (parseInt(number, 10) + 1).toString().padStart(numberLength, '0');
  
      const newUrl = `${prefix}${nextNumber}${suffix}`;
      chrome.tabs.create({ url: newUrl });
    } else {
      console.log("No number found at the end of the URL.");
    }
  });
  