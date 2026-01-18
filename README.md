# SSRN Quick Jump

English | [简体中文](README.zh-CN.md)

A Chrome browser extension that automatically adds SSRN links next to article titles on academic journal websites, making it easy to quickly access working paper versions on SSRN.

## Problem It Solves

Top-tier journals in economics, finance, and accounting (such as AER, JF, TAR, etc.) typically require paid subscriptions to access. However, many universities have limited budgets and haven't purchased access to these journals, creating significant barriers to academic research.

The good news is that most papers published in top journals are uploaded to SSRN (Social Science Research Network) as working papers before formal publication, and these papers are usually available for free download.

**What this extension does**: When browsing top journal websites, it automatically adds SSRN links next to article titles, allowing one-click access to SSRN to find and download free versions of papers, enabling researchers without journal access to easily obtain the literature they need.

## Installation

### Download the Extension

**Method 1 (Recommended)**: Download the latest zip file from the [Releases](https://github.com/BlueDayDreeaming/ssrn-quick-jump/releases) page and extract it

**Method 2**: Click Code → Download ZIP, then extract and **navigate into the inner folder** (the one containing manifest.json)

### Step 1: Open Chrome Extensions Management Page

In Chrome browser, click the three-dot menu in the top-right corner, select "Extensions" → "Manage Extensions", or visit `chrome://extensions/` directly

![步骤1](images/step1.png)

### Step 2: Enable Developer Mode


On the extensions management page, toggle on "Developer mode" in the top-right corner
![Step 2](images/step2.png)

### Step 3: Load Unpacked Extension

Click the "Load unpacked" button in the top-left corner (you need to enable "Developer mode" first)

![Step 3](images/step3.png)

### Step 4: Select the Extension Folder

After extracting the downloaded zip file, **please select the correct folder**:

📁 After extraction, you'll typically see a folder (like `ssrn-quick-jump-main`). **You need to open this folder**, find the folder that directly contains `manifest.json`, `content.js`, etc., and select it.

✅ **The correct folder should directly contain the following files:**
- manifest.json
- content.js  
- ssrn-redirect.js
- icons folder
- popup.html and other files

⚠️ **If you see "Manifest file is missing or unreadable"**: This means you've selected the wrong folder level. You need to go one level deeper to find the folder that actually contains these files.

## Features

## Features

- **Automatic Title Recognition**: Automatically identifies article titles on academic journal websites
- **Smart Linking**: Adds SSRN icon links next to article titles
- **Intelligent Matching**: Automatically matches and redirects to the most relevant paper on SSRN search results pages
- **Seamless Integration**: Lightweight design that doesn't interfere with the original browsing experience

## How to Use

After installing the extension:

1. Visit supported academic journal websites
2. SSRN icons will automatically appear next to article titles
3. Click the icon to jump to SSRN and search for the article
4. The extension will automatically match and redirect to the most relevant paper

## Supported Websites

This extension supports most academic journal websites, including but not limited to:

**Top 5 Economics Journals:**
- American Economic Review (AER)
- Econometrica
- Journal of Political Economy (JPE)
- Quarterly Journal of Economics (QJE)
- Review of Economic Studies (RES)

**Top Finance Journals:**
- Journal of Finance (JF)
- Journal of Financial Economics (JFE)
- Review of Financial Studies (RFS)

**Top Accounting Journals:**
- The Accounting Review (TAR)
- Journal of Accounting Research (JAR)
- Journal of Accounting and Economics (JAE)

**Others:**
- Other academic websites using common title selectors

## Technical Implementation

## Technical Implementation

- **Manifest Version**: 3
- **Core Features**:
  - `content.js` - Main content script, responsible for detecting article titles and inserting SSRN links
  - `ssrn-redirect.js` - Intelligent matching and automatic redirection on SSRN search results pages
  - Uses MutationObserver to monitor dynamic page changes

## Project Structure

```
SSRN-plugin/
├── manifest.json          # Extension configuration file
├── content.js            # Main content script
├── ssrn-redirect.js      # SSRN redirect script
├── icons/
│   └── ssrn.svg         # SSRN icon
└── README.md            # Project documentation
```

## Development

### Modifying Code

1. Edit the relevant files
2. Click the "Reload" button on the Chrome extensions management page
3. Refresh the test page to see the changes

### Core Configuration

- **Match Threshold**: `MATCH_THRESHOLD = 0.62` (in ssrn-redirect.js)
- **Max Retry Attempts**: `MAX_ATTEMPTS = 4`
- **Retry Delay**: `RETRY_DELAY_MS = 400ms`

## Changelog

### v0.1.0
- Initial release
- Support for automatically adding SSRN links
- Implemented intelligent matching and automatic redirection

## Contributing

Issues and Pull Requests are welcome!
