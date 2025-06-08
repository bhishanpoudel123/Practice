function parseUrlAndModify(tabUrl, newNumber = null, change = 0) {
    const match = tabUrl.match(/(.*?)(\d+)([^\/]*)$/);
  
    if (!match) return null;
  
    const prefix = match[1];
    const number = match[2];
    const suffix = match[3];
    const numberLength = number.length;
  
    let finalNumber;
    if (newNumber !== null) {
      finalNumber = parseInt(newNumber, 10);
    } else {
      finalNumber = parseInt(number, 10) + change;
    }
  
    const padded = finalNumber.toString().padStart(numberLength, '0');
    return `${prefix}${padded}${suffix}`;
  }
  
  function modifyUrl(change = 0, custom = null) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      const newUrl = parseUrlAndModify(tab.url, custom, change);
  
      const status = document.getElementById("status");
  
      if (newUrl) {
        chrome.tabs.create({ url: newUrl });
        status.textContent = `Opening: ${newUrl}`;
      } else {
        status.textContent = "Could not find number in URL.";
      }
    });
  }
  
  document.getElementById("increment").addEventListener("click", () => modifyUrl(1));
  document.getElementById("decrement").addEventListener("click", () => modifyUrl(-1));
  document.getElementById("go-to-number").addEventListener("click", () => {
    const val = document.getElementById("custom-number").value.trim();
    if (!isNaN(val) && val !== "") {
      modifyUrl(0, val);
    }
  });
  