document.addEventListener('DOMContentLoaded', async function() {
  const form = document.querySelector('form');
  const urlInput = document.getElementById('hoarderUrl');
  const apiTokenInput = document.getElementById('apiToken');
  const notificationsCheckbox = document.getElementById('showNotifications');
  const hoardOnOpenCheckbox = document.getElementById('hoardOnOpen');

  // Load saved values when popup opens
  const stored = await browser.storage.local.get(['hoarderUrl', 'apiToken', 'showNotifications', 'hoardOnOpen']);
  if (stored.hoarderUrl) {
    urlInput.value = stored.hoarderUrl;
  }
  if (stored.apiToken) {
    apiTokenInput.value = stored.apiToken;
  }
  if (stored.showNotifications !== undefined) {
    notificationsCheckbox.checked = stored.showNotifications;
  }
  if (stored.hoardOnOpen !== undefined) {
    hoardOnOpenCheckbox.checked = stored.hoardOnOpen;
  }

  // Add checkbox change listeners
  notificationsCheckbox.addEventListener('change', saveValues);
  hoardOnOpenCheckbox.addEventListener('change', saveValues);

  async function saveValues() {
    const formData = {
      hoarderUrl: urlInput.value,
      apiToken: apiTokenInput.value,
      showNotifications: notificationsCheckbox.checked,
      hoardOnOpen: hoardOnOpenCheckbox.checked
    };
    await browser.storage.local.set(formData);
  }

  // Add input change listeners for instant saving
  urlInput.addEventListener('input', saveValues);
  apiTokenInput.addEventListener('input', saveValues);

  async function saveValues() {
    const formData = {
      hoarderUrl: urlInput.value,
      apiToken: apiTokenInput.value
    };
    await browser.storage.local.set(formData);
  }

  // Add notification div to the body
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = 'Hoarded!';
  document.body.appendChild(notification);

  // If we have both values, get current tab URL and make API call
  // Extract bookmark creation into a function
  async function createBookmark() {
    const stored = await browser.storage.local.get(['hoarderUrl', 'apiToken']);
    
    if (stored.hoarderUrl && stored.apiToken) {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0].url;
      
      try {
        const response = await fetch(`${stored.hoarderUrl}/api/trpc/bookmarks.createBookmark?batch=1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${stored.apiToken}`
          },
          body: JSON.stringify({
            "0": {
              "json": {
                "type": "link",
                "url": currentUrl
              }
            }
          })
        });

        if (response.ok) {
          notification.classList.add('show');
          setTimeout(() => {
            notification.classList.remove('show');
          }, 2000);
        } else {
          throw new Error('API call failed');
        }
      } catch (error) {
        console.error('Failed to create bookmark:', error);
      }
    }
  }

  // Call createBookmark when popup opens
  // Update the createBookmark call to check the setting
  if (stored.hoarderUrl && stored.apiToken && stored.hoardOnOpen) {
    await createBookmark();
  }

  // Update form submission to include new setting
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button');
    const originalText = button.textContent;

    const formData = {
      hoarderUrl: urlInput.value,
      apiToken: apiTokenInput.value,
      showNotifications: notificationsCheckbox.checked,
      hoardOnOpen: hoardOnOpenCheckbox.checked
    };

    try {
      await browser.storage.local.set(formData);
      
      button.textContent = 'Saved!';
      button.style.backgroundColor = '#2e7d32';
    } catch (error) {
      showError(button, 'Save Failed');
      return;
    }
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
    }, 2000);
  });

  function showError(button, message) {
    button.textContent = message;
    button.style.backgroundColor = '#d32f2f';
    setTimeout(() => {
      button.textContent = 'Save';
      button.style.backgroundColor = '';
    }, 2000);
  }

  // Add import button handler
  const importButton = document.querySelector('.import-button');
  importButton.addEventListener('click', async () => {
    const stored = await browser.storage.local.get(['hoarderUrl', 'apiToken']);
    
    if (stored.hoarderUrl && stored.apiToken) {
      try {
        const bookmarks = await browser.bookmarks.getTree();
        const allBookmarks = extractBookmarks(bookmarks);
        
        importButton.textContent = `Importing ${allBookmarks.length} bookmarks...`;
        importButton.disabled = true;

        for (const bookmark of allBookmarks) {
          try {
            await fetch(`${stored.hoarderUrl}/api/trpc/bookmarks.createBookmark?batch=1`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${stored.apiToken}`
              },
              body: JSON.stringify({
                "0": {
                  "json": {
                    "type": "link",
                    "url": bookmark.url
                  }
                }
              })
            });
          } catch (error) {
            console.error('Failed to import bookmark:', bookmark.url);
          }
        }

        importButton.textContent = 'Import Complete!';
        setTimeout(() => {
          importButton.textContent = 'Import All Bookmarks';
          importButton.disabled = false;
        }, 2000);

      } catch (error) {
        console.error('Failed to get bookmarks:', error);
        importButton.textContent = 'Import Failed';
        setTimeout(() => {
          importButton.textContent = 'Import All Bookmarks';
          importButton.disabled = false;
        }, 2000);
      }
    }
  });

  function extractBookmarks(nodes) {
    let bookmarks = [];
    for (const node of nodes) {
      if (node.url) {
        bookmarks.push(node);
      }
      if (node.children) {
        bookmarks = bookmarks.concat(extractBookmarks(node.children));
      }
    }
    return bookmarks;
  }

});