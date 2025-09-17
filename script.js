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
        setupEventListeners();
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback: If CSV files aren't found, you could use sample data here
        console.log('Using sample data...');
        loadSampleData();
        populateDropdowns();
        setupEventListeners();
    }
}

function loadSampleData() {
    // Sample data fallback
    const sampleSearchData = `App/Modal,Search,Allows Wildcards?
Add contacts modal,Add contacts modal search,TRUE
Add Donors Modal,Add Donors Modal: Code,FALSE
Add Donors Modal,Add Donors Modal: Name,TRUE
Add interfaces modal,Add interfaces modal search,TRUE
Agreements,Agreements Lines Search,TRUE
Agreements,Agreements Search,TRUE
Check in,Scan or enter barcode to check in item,TRUE
Check Out,Scan or enter item barcode,FALSE
Check Out,Scan or enter patron barcode,FALSE
Circulation log,Description,FALSE
Circulation log,Item Barcode,FALSE
Circulation log,User Barcode,FALSE`;

    const sampleStandardsData = `Standard,Definition,Search Field,App/Modal,Compliant
Allows wildcards,Wildcards should be allowed,Add contacts modal search,Add contacts modal,TRUE
Allows wildcards,Wildcards should be allowed,Add Donors Modal: Name,Add Donors Modal,TRUE
Allows wildcards,Wildcards should be allowed,Add interfaces modal search,Add interfaces modal,TRUE
Allows wildcards,Wildcards should be allowed,Agreements Lines Search,Agreements,TRUE
Allows wildcards,Wildcards should be allowed,Agreements Search,Agreements,TRUE
Allows wildcards,Wildcards should be allowed,Scan or enter barcode to check in item,Check in,TRUE
Allows wildcards,Wildcards should be allowed,Add Donors Modal: Code,Add Donors Modal,FALSE
Allows wildcards,Wildcards should be allowed,Scan or enter item barcode,Check Out,FALSE
Allows wildcards,Wildcards should be allowed,Scan or enter patron barcode,Check Out,FALSE
Allows wildcards,Wildcards should be allowed,Description,Circulation log,FALSE
Allows wildcards,Wildcards should be allowed,Item Barcode,Circulation log,FALSE
Allows wildcards,Wildcards should be allowed,User Barcode,Circulation log,FALSE
Searching is case insensitive,Searching should be case insensitive,Add contacts modal search,Add contacts modal,TRUE
Searching is case insensitive,Searching should be case insensitive,Add Donors Modal: Name,Add Donors Modal,TRUE
Searching is case insensitive,Searching should be case insensitive,Agreements Search,Agreements,TRUE
Searching is case insensitive,Searching should be case insensitive,Description,Circulation log,FALSE`;

    searchData = Papa.parse(sampleSearchData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
    }).data;

    standardsData = Papa.parse(sampleStandardsData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
    }).data;
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Search inputs
    const appSearch = document.getElementById('app-search');
    const fieldSearch = document.getElementById('field-search');
    const standardSelect = document.getElementById('standard-select');

    if (appSearch) {
        appSearch.addEventListener('input', filterAppDropdown);
        appSearch.addEventListener('focus', showAppDropdown);
        appSearch.addEventListener('blur', hideAppDropdown);
    }

    if (fieldSearch) {
        fieldSearch.addEventListener('input', filterFieldDropdown);
        fieldSearch.addEventListener('focus', showFieldDropdown);
        fieldSearch.addEventListener('blur', hideFieldDropdown);
    }

    if (standardSelect) {
        standardSelect.addEventListener('change', filterByStandard);
    }
}

function populateDropdowns() {
    // Get unique fields and apps
    allFields = [...new Set(searchData.map(item => item.Search))].sort();
    allApps = [...new Set(searchData.map(item => item['App/Modal']))].sort();

    // Populate standards dropdown with unique standards
    const standardSelect = document.getElementById('standard-select');
    if (standardSelect) {
        const uniqueStandards = [...new Set(standardsData.map(item => item.Standard))];
        
        standardSelect.innerHTML = '<option value="">Choose a standard...</option>';
        uniqueStandards.forEach(standard => {
            const option = document.createElement('option');
            option.value = standard;
            option.textContent = standard;
            standardSelect.appendChild(option);
        });
    }
}

// Field dropdown functions
function filterFieldDropdown() {
    const input = document.getElementById('field-search');
    const dropdown = document.getElementById('field-dropdown');
    
    if (!input || !dropdown) return;
    
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
        div.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevent blur
            selectField(field);
        });
        dropdown.appendChild(div);
    });

    dropdown.style.display = filteredFields.length > 0 && query.length > 0 ? 'block' : 'none';
}

function showFieldDropdown() {
    clearTimeout(hideDropdownTimeout);
    if (document.getElementById('field-search').value.length > 0) {
        filterFieldDropdown();
    }
}

function hideFieldDropdown() {
    hideDropdownTimeout = setTimeout(() => {
        const dropdown = document.getElementById('field-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
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
    
    if (!input || !dropdown) return;
    
    const query = input.value.toLowerCase();

    const filteredApps = allApps.filter(app => 
        app.toLowerCase().includes(query)
    );

    dropdown.innerHTML = '';
    filteredApps.slice(0, 10).forEach(app => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.textContent = app;
        div.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevent blur
            selectApp(app);
        });
        dropdown.appendChild(div);
    });

    dropdown.style.display = filteredApps.length > 0 && query.length > 0 ? 'block' : 'none';
}

function showAppDropdown() {
    clearTimeout(hideDropdownTimeout);
    if (document.getElementById('app-search').value.length > 0) {
        filterAppDropdown();
    }
}

function hideAppDropdown() {
    hideDropdownTimeout = setTimeout(() => {
        const dropdown = document.getElementById('app-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }, 200);
}

function selectApp(app) {
    selectedApp = app; // Store the selected app
    document.getElementById('app-search').value = app;
    document.getElementById('app-dropdown').style.display = 'none';
    
    // Clear the field search when app changes
    const fieldSearch = document.getElementById('field-search');
    if (fieldSearch) {
        fieldSearch.value = '';
        fieldSearch.placeholder = `Type to search fields in ${app}...`;
    }
    
    displayAppResults(app);
}

function displayFieldResults(selectedField) {
    const resultsContainer = document.getElementById('field-results');
    if (!resultsContainer) return;
    
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
    if (!resultsContainer) return;
    
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
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    // Clear results when switching tabs
    const fieldResults = document.getElementById('field-results');
    const standardResults = document.getElementById('standard-results');
    
    if (fieldResults) {
        fieldResults.innerHTML = '<div class="no-results">Search for a field or app/modal to view details</div>';
    }
    if (standardResults) {
        standardResults.innerHTML = '<div class="no-results">Select a standard to view compliant fields</div>';
    }
    
    // Clear form inputs
    const fieldSearch = document.getElementById('field-search');
    const appSearch = document.getElementById('app-search');
    const standardSelect = document.getElementById('standard-select');
    
    if (fieldSearch) fieldSearch.value = '';
    if (appSearch) appSearch.value = '';
    if (standardSelect) standardSelect.value = '';
    
    // Reset app selection and placeholder
    selectedApp = null;
    if (fieldSearch) {
        fieldSearch.placeholder = 'Type to search fields...';
    }
}

function filterByStandard() {
    const selectedStandard = document.getElementById('standard-select').value;
    const resultsContainer = document.getElementById('standard-results');

    if (!resultsContainer) return;

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
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});
