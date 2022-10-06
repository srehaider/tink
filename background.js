const ACTIVE_ICON = './active.png';
const DISABLED_ICON = './disabled.png';

const DOMAIN_RULES = {
  'app.asana.com': [
    {
      pattern: /^https:\/\/app\.asana\.com\/\d+(\/search)?\/\d+\/\d+(\/f)?$/,
      titleCssSelector: '[aria-label="Task Name"]',
      titleElementProperty: 'value',
      transformURL: (URL) => URL.endsWith('/f') ? URL : URL + '/f',
    }
  ],
  'docs.google.com': [
    {
      pattern: /^https:\/\/docs\.google\.com\/spreadsheets\/\w+\/\w+/,
      titleCssSelector: 'input.docs-title-input',
      titleElementProperty: 'value',
    }
  ],
  'github.com': [
    {
      pattern: /^https:\/\/github\.com\/\S+\/\S+\/\S+\/\d+$/,
      titleCssSelector: '.gh-header-title',
      titleElementProperty: 'innerText',
    }
  ],
};

const getMatchedRule = (url) => {
  if (!url) return;

  const domain = new URL(url).host;
  const rules = DOMAIN_RULES[domain];

  if (!rules) return;

  for (let i = 0; i < rules.length; ++i) {
    if (rules[i].pattern.test(url)) {
      return rules[i];
    }
  }
};

const copyTitleWithLink = (url, titleCssSelector, titleElementProperty) => {
  const link = document.createElement('a');
  link.innerHTML = document.querySelector(titleCssSelector)[titleElementProperty];
  link.href = url;
  document.body.appendChild(link);

  const range = document.createRange();
  range.selectNode(link);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand('copy');
  document.body.removeChild(link);
};

const updateLogo = (url, tabId) => {
  if (getMatchedRule(url)) {
    // chrome.pageAction.show(tabId);
    chrome.action.setIcon({ tabId, path: ACTIVE_ICON });
  } else {
    // chrome.pageAction.hide(tabId);
    chrome.action.setIcon({ tabId, path: DISABLED_ICON });
  }
};

const showNotification = () => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: ACTIVE_ICON,
    title: 'Tink',
    message: 'Title copied with link',
  });
};

const onClickedCallback = async (tab) => {
  const url = tab.url;
  const rule = getMatchedRule(url);

  if (!rule) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: copyTitleWithLink,
    args: [rule.transformURL ? rule.transformURL(url) : url, rule.titleCssSelector, rule.titleElementProperty],
  }, showNotification);
};

const onUpdatedCallback = (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url)
    updateLogo(tab.url, tabId);
};

chrome.action.onClicked.addListener(onClickedCallback);
chrome.tabs.onUpdated.addListener(onUpdatedCallback);
