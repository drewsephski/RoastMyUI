// Configuration
// CHANGE THIS TO YOUR PRODUCTION URL WHEN DEPLOYING
const CONFIG = {
    API_URL: 'https://roast-my-ui.vercel.app/api/roast',
};

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('roastBtn');
    const btnText = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.loader');
    const resultDiv = document.getElementById('result');
    const contentDiv = document.getElementById('content');

    btn.addEventListener('click', async () => {
        // Reset state
        btn.disabled = true;
        btnText.textContent = 'Cooking...';
        loader.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        contentDiv.innerHTML = '';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.url) {
                throw new Error("Cannot access current tab URL.");
            }

            // Capture visible tab
            const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 });

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: tab.url,
                    screenshot: screenshot
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Render result
            renderResult(data);
            resultDiv.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            renderError(error);
            resultDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btnText.textContent = 'Roast Again';
            loader.classList.add('hidden');
        }
    });

    function renderResult(data) {
        contentDiv.innerHTML = `
      <div class="score-container">
        <span class="score">${data.score}</span>
        <span class="score-max">/10</span>
      </div>
      <div class="tagline">"${data.tagline}"</div>
      <p class="roast-text">${data.roast}</p>
      
      <div style="margin-top: 24px;">
        <span class="section-title" style="color: #4ade80;">Strengths</span>
        <ul class="strengths-list">
          ${data.strengths.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      
      <div style="margin-top: 16px;">
        <span class="section-title" style="color: #ff4d4d;">Weaknesses</span>
        <ul class="weaknesses-list">
          ${data.weaknesses.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>
    `;
    }

    function renderError(error) {
        contentDiv.innerHTML = `
      <div style="color: #ff4d4d; text-align: center;">
        <h3 style="margin: 0 0 8px 0;">Oof, something broke 💀</h3>
        <p style="margin: 0; font-size: 13px;">${error.message}</p>
        ${error.message.includes('Failed to fetch') ?
                `<p style="font-size: 11px; color: #666; margin-top: 12px; background: #222; padding: 8px; border-radius: 6px;">
            Is the server running? Check if <code>${CONFIG.API_URL}</code> is accessible.
           </p>` : ''}
      </div>
    `;
    }
});
