document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const resultsCount = document.getElementById('resultsCount');

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            searchButton.disabled = true;
            searchButton.innerHTML = `
                <div class="spinner"></div>
                Searching...
            `;
        } else {
            searchButton.disabled = false;
            searchButton.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                </svg>
                Search
            `;
        }
    }

    function showMessage(icon, message, className = '') {
        return `
            <div class="message ${className}">
                <div class="message-icon">${icon}</div>
                <p>${message}</p>
            </div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function performSearch() {
        const searchValue = searchInput.value.trim();
        if (!searchValue) {
            resultsDiv.innerHTML = showMessage('⚠️', 'Please enter a search term');
            resultsCount.textContent = '0 found';
            return;
        }

        setLoading(true);
        resultsDiv.innerHTML = showMessage('⏳', 'Searching...');

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const currentTab = tabs[0];
            
            if (!currentTab || !currentTab.id) {
                setLoading(false);
                resultsDiv.innerHTML = showMessage('❌', 'No active tab found', 'error');
                resultsCount.textContent = '0 found';
                return;
            }

            chrome.scripting.executeScript({
                target: {tabId: currentTab.id},
                world: 'MAIN',
                func: (searchValue) => {
                    if (window.maestroStrings && typeof window.maestroStrings === 'object') {
                        const results = [];
                        for (const [key, value] of Object.entries(window.maestroStrings)) {
                            if (String(value).toLowerCase().includes(searchValue.toLowerCase())) {
                                results.push({key, value: String(value)});
                            }
                        }
                        return {
                            found: true,
                            data: results,
                            total: Object.keys(window.maestroStrings).length
                        };
                    }
                    return {
                        found: false,
                        data: [],
                        total: 0
                    };
                },
                args: [searchValue]
            }, (injectionResults) => {
                setLoading(false);
                
                if (chrome.runtime.lastError) {
                    resultsDiv.innerHTML = showMessage('❌', chrome.runtime.lastError.message, 'error');
                    resultsCount.textContent = '0 found';
                    return;
                }

                const result = injectionResults[0]?.result;
                
                if (!result || !result.found) {
                    resultsDiv.innerHTML = showMessage('📭', 'window.maestroStrings not found on this page', 'error');
                    resultsCount.textContent = '0 found';
                    return;
                }

                const results = result.data;
                resultsCount.textContent = `${results.length} found (of ${result.total} total)`;

                if (results.length === 0) {
                    resultsDiv.innerHTML = showMessage('🔎', `No matches found for "${escapeHtml(searchValue)}"`);
                    return;
                }

                let html = '';
                results.forEach((item, index) => {
                    const highlightedValue = escapeHtml(item.value).replace(
                        new RegExp(escapeHtml(searchValue), 'gi'),
                        match => `<mark>${match}</mark>`
                    );
                    
                    html += `
                        <div class="result-item fade-in" style="animation-delay: ${index * 50}ms">
                            <div class="result-key">${escapeHtml(item.key)}</div>
                            <div class="result-value">${highlightedValue}</div>
                        </div>
                    `;
                });
                
                resultsDiv.innerHTML = html;
            });
        });
    }
});
