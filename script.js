let searchData = [];
let standardsData = [];
let allFields = [];
let allApps = [];
let hideDropdownTimeout;
let selectedApp = null;

// Initialize the application
async function initializeApp() {
    try {
        // Load the CSV files
        const searchResponse = await fetch('search-data.csv');
        const searchText = await searchResponse.text();
        searchData = Papa.parse(searchText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;

        const standardsResponse = await fetch('standards-data.csv');
        const standardsText = await standardsResponse.text();
        standardsData = Papa.parse(standardsText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;

        populateDropdowns();
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback: If CSV files aren't found, you could use sample data here
    }
}

function populateDropdowns() {
    // Get unique fields and apps
    allFields = [...new Set(searchData.map(item => item.Search))].sort();
    allApps = [...new Set(searchData.map(item => item['App/Modal']))].sort();

    // Populate standards dropdown with unique standards
    const standardSelect = document.getElementById('standard-select');
    const uniqueStandards = [...new Set(standardsData.map(item => item.Standard))];
    
    standardSelect.innerHTML = '<option value="">Choose a standard...</option>';
    uniqueStandards.forEach(standard => {
        const option = document.createElement('option');
        option.value = standard;
        option.textContent = standard;
        standardSelect.appendChild(option);
    });
}

// Field dropdown functions
function filterFieldDropdown() {
    const input = document.getElementById('field-search');
    const dropdown = document.getElementById('field-dropdown');
    const query = input.value.toLowerCase();

    // Filter fields based on selected app (if any)
    let fieldsToSearch = allFields;
    if (selectedApp) {
        fieldsToSearch = searchData
            .filter(item => item['App/Modal'] === selectedApp)
            .map(item => item.Search);
    }

    const filteredFields = fieldsToSearch.filter(field => 
        field.toLowerCase().includes(query)
    );

    dropdown.innerHTML = '';
    filteredFields.slice(0, 10).forEach(field => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.textContent = field;
        div.onmousedown = () => selectField(field); // Use mousedown to prevent blur
        dropdown.appendChild(div);
    });

    dropdown.style.display = filteredFields.length > 0 ? 'block' : 'none';
}

function showFieldDropdown() {
    clearTimeout(hideDropdownTimeout);
    filterFieldDropdown();
}

function hideFieldDropdown() {
    hideDropdownTimeout = setTimeout(() => {
        document.getElementById('field-dropdown').style.display = 'none';
    }, 200);
}

function selectField(field) {
    document.getElementById('field-search').value = field;
    document.getElementById('field-dropdown').style.display = 'none';
    displayFieldResults(field);
}

// App dropdown functions
function filterAppDropdown() {
    const input = document.getElementById('app-search');
    const dropdown = document.getElementById('app-dropdown');
    const query = input.value.toLowerCase();

    const filteredApps = allApps.filter(app => 
        app.toLowerCase().includes(query)
    );

    dropdown.innerHTML = '';
    filteredApps.slice(0, 10).forEach(app => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.textContent = app;
        div.onmousedown = () => selectApp(app);
        dropdown.appendChild(div);
    });

    dropdown.style.display = filteredApps.length > 0 ? 'block' : 'none';
}

function showAppDropdown() {
    clearTimeout(hideDropdownTimeout);
    filterAppDropdown();
}

function hideAppDropdown() {
    hideDropdownTimeout = setTimeout(() => {
        document.getElementById('app-dropdown').style.display = 'none';
    }, 200);
}

function selectApp(app) {
    selectedApp = app; // Store the selected app
    document.getElementById('app-search').value = app;
    document.getElementById('app-dropdown').style.display = 'none';
    
    // Clear the field search when app changes
    document.getElementById('field-search').value = '';
    document.getElementById('field-search').placeholder = `Type to search fields in ${app}...`;
    
    displayAppResults(app);
}

function displayFieldResults(selectedField) {
    const resultsContainer = document.getElementById('field-results');
    const fieldData = searchData.find(item => item.Search === selectedField);
    
    if (fieldData) {
        const wildcardClass = fieldData['Allows Wildcards?'] ? 'wildcard-yes' : 'wildcard-no';
        const wildcardText = fieldData['Allows Wildcards?'] ? 'Yes' : 'No';

        resultsContainer.innerHTML = `
            <div class="result-card">
                <div class="result-header">${fieldData.Search}</div>
                <div class="result-detail"><strong>App/Modal:</strong> ${fieldData['App/Modal']}</div>
                <div class="result-detail">
                    <strong>Allows Wildcards:</strong> 
                    <span class="wildcard-badge ${wildcardClass}">${wildcardText}</span>
                </div>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = '<div class="no-results">No data found for selected field</div>';
    }
}

function displayAppResults(selectedApp) {
    const resultsContainer = document.getElementById('field-results');
    const appData = searchData.filter(item => item['App/Modal'] === selectedApp);
    
    if (appData.length > 0) {
        let resultsHTML = appData.map(field => {
            const wildcardClass = field['Allows Wildcards?'] ? 'wildcard-yes' : 'wildcard-no';
            const wildcardText = field['Allows Wildcards?'] ? 'Yes' : 'No';
            
            return `
                <div class="result-card">
                    <div class="result-header">${field.Search}</div>
                    <div class="result-detail"><strong>App/Modal:</strong> ${field['App/Modal']}</div>
                    <div class="result-detail">
                        <strong>Allows Wildcards:</strong> 
                        <span class="wildcard-badge ${wildcardClass}">${wildcardText}</span>
                    </div>
                </div>
            `;
        }).join('');

        resultsContainer.innerHTML = resultsHTML;
    } else {
        resultsContainer.innerHTML = '<div class="no-results">No data found for selected app/modal</div>';
    }
}

function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Clear results when switching tabs
    document.getElementById('field-results').innerHTML = '<div class="no-results">Search for a field or app/modal to view details</div>';
    document.getElementById('standard-results').innerHTML = '<div class="no-results">Select a standard to view compliant fields</div>';
    document.getElementById('field-search').value = '';
    document.getElementById('app-search').value = '';
    document.getElementById('standard-select').value = '';
    
    // Reset app selection and placeholder
    selectedApp = null;
    document.getElementById('field-search').placeholder = 'Type to search fields...';
}

function filterByField() {
    // This function is no longer needed as we use displayFieldResults directly
}

function filterByStandard() {
    const selectedStandard = document.getElementById('standard-select').value;
    const resultsContainer = document.getElementById('standard-results');

    if (!selectedStandard) {
        resultsContainer.innerHTML = '<div class="no-results">Select a standard to view compliant fields</div>';
        return;
    }

    // Get all entries for this standard
    const standardEntries = standardsData.filter(item => item.Standard === selectedStandard);
    
    if (standardEntries.length > 0) {
        // Get the definition from the first entry (should be the same for all)
        const standardDefinition = standardEntries[0].Definition;
        
        // Create a map of field compliance for this standard
        const complianceMap = {};
        standardEntries.forEach(entry => {
            const key = `${entry['Search Field']}-${entry['App/Modal']}`;
            complianceMap[key] = entry.Compliant;
        });

        let tableHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
                <strong>Standard:</strong> ${selectedStandard}<br>
                <strong>Definition:</strong> ${standardDefinition}
            </div>
            <div class="table-container">
                <table class="standards-table">
                    <thead>
                        <tr>
                            <th>Search Field</th>
                            <th>App/Modal</th>
                            <th>Compliant</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Show ALL search fields from the main search data
        searchData.forEach(field => {
            const key = `${field.Search}-${field['App/Modal']}`;
            const compliance = complianceMap[key];
            
            let complianceSymbol;
            if (compliance === true || compliance === 'TRUE') {
                complianceSymbol = '✅'; // Compliant
            } else if (compliance === false || compliance === 'FALSE') {
                complianceSymbol = '❌'; // Not compliant
            } else {
                complianceSymbol = '❓'; // Unknown/not evaluated
            }
            
            tableHTML += `
                <tr>
                    <td><strong>${field.Search}</strong></td>
                    <td>${field['App/Modal']}</td>
                    <td style="text-align: center; font-size: 16px;">${complianceSymbol}</td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        resultsContainer.innerHTML = tableHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);
