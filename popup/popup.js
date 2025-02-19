document.addEventListener('DOMContentLoaded', async function() {
  const form = document.querySelector('form');
  const urlInput = document.getElementById('hoarderUrl');
  const apiTokenInput = document.getElementById('apiToken');

  // Load saved values when popup opens
  const stored = await browser.storage.local.get(['hoarderUrl', 'apiToken']);
  if (stored.hoarderUrl) {
    urlInput.value = stored.hoarderUrl;
  }
  if (stored.apiToken) {
    apiTokenInput.value = stored.apiToken;
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

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button');
    const originalText = button.textContent;

    const formData = {
      hoarderUrl: urlInput.value,
      apiToken: apiTokenInput.value
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

});