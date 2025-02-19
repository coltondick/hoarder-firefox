async function createBookmark() {
  const stored = await browser.storage.local.get(['hoarderUrl', 'apiToken', 'showNotifications']);
  
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

      if (response.ok && stored.showNotifications) {
        browser.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Hoarder',
          message: 'Hoarded!'
        });
      } else if (!response.ok) {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      if (stored.showNotifications) {
        browser.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Hoarder',
          message: 'Failed to hoard!'
        });
      }
    }
  }
}

browser.commands.onCommand.addListener((command) => {
  if (command === "hoard") {
    createBookmark();
  }
});