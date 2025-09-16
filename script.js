// Global application state
let appState = {
    startDate: new Date().toISOString().split('T')[0],
    initialIncrement: 7,
    incrementStep: 2,
    dayOffset: 0,
    currentViewMonth: new Date(),
    speedDialDates: [],
    dateSequence: []
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initApp();
    setupEventListeners();
});

// Initialize the application
function initApp() {
    console.log('Initializing app with state:', appState);
    
    // Set initial form values
    document.getElementById('startDate').value = appState.startDate;
    document.getElementById('initialIncrement').value = appState.initialIncrement;
    document.getElementById('incrementStep').value = appState.incrementStep;
    
    // Calculate and display everything
    updateCurrentViewMonth();
    calculateDateSequence();
    updateAllDisplays();
    updateIncrementPreview();
    updateFormula();
    
    console.log('App initialized successfully');
}

// Event listeners setup
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    document.getElementById('startDate').addEventListener('change', function(e) {
        console.log('Start date changed to:', e.target.value);
        appState.startDate = e.target.value;
        calculateDateSequence();
        updateAllDisplays();
    });

    document.getElementById('initialIncrement').addEventListener('input', function(e) {
        console.log('Initial increment changed to:', e.target.value);
        appState.initialIncrement = parseInt(e.target.value) || 7;
        calculateDateSequence();
        updateAllDisplays();
        updateIncrementPreview();
        updateFormula();
    });

    document.getElementById('incrementStep').addEventListener('input', function(e) {
        console.log('Increment step changed to:', e.target.value);
        appState.incrementStep = parseInt(e.target.value) || 0;
        calculateDateSequence();
        updateAllDisplays();
        updateIncrementPreview();
        updateFormula();
    });

    document.getElementById('speedDialLabel').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveSpeedDial();
        }
    });
    
    console.log('Event listeners setup complete');
}

function calculateDateSequence() {
    console.log('Calculating date sequence with:', {
        startDate: appState.startDate,
        initialIncrement: appState.initialIncrement,
        incrementStep: appState.incrementStep
    });
    
    const dates = [];
    const dateParts = appState.startDate.split('-').map(Number);
    let currentDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    dates.push(new Date(currentDate));
    
    let increment = appState.initialIncrement;
    
    for (let i = 0; i < 50; i++) {
        currentDate = new Date(currentDate.getTime() + increment * 24 * 60 * 60 * 1000);
        dates.push(new Date(currentDate));
        increment += appState.incrementStep;
    }
    
    appState.dateSequence = dates;
    console.log('Date sequence calculated. First 5 dates:', 
        dates.slice(0, 5).map(d => d.toDateString()));
}

function updateCurrentViewMonth() {
    const today = new Date();
    const targetDate = new Date(today.getTime() + (appState.dayOffset * 24 * 60 * 60 * 1000));
    appState.currentViewMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    console.log('Current view month updated to:', appState.currentViewMonth.toDateString());
}

function changeMonth(direction) {
    console.log('Changing month, direction:', direction);
    const daysToMove = direction * 30;
    appState.dayOffset += daysToMove;
    console.log('New day offset:', appState.dayOffset);
    updateCurrentViewMonth();
    updateCalendar();
}

function updateAllDisplays() {
    console.log('Updating all displays...');
    updateTodayInfo();
    updateCalendar();
    updateSpeedDialList();
}

function updateTodayInfo() {
    const today = new Date();
    document.getElementById('todayDate').textContent = today.toDateString();
    
    const aroundToday = findDatesAroundToday();
    
    // Recent dates
    const recentEl = document.getElementById('recentDates');
    if (aroundToday.past.length > 0) {
        recentEl.innerHTML = aroundToday.past.map(date => 
            '<div class="text-sm">' + formatDate(date) + '</div>'
        ).join('');
    } else {
        recentEl.innerHTML = '<div class="text-sm">No recent dates</div>';
    }
    
    // Closest date
    document.getElementById('closestDate').textContent = formatDate(aroundToday.closest);
    
    // Upcoming dates
    const upcomingEl = document.getElementById('upcomingDates');
    if (aroundToday.future.length > 0) {
        upcomingEl.innerHTML = aroundToday.future.map(date => 
            '<div class="text-sm">' + formatDate(date) + '</div>'
        ).join('');
    } else {
        upcomingEl.innerHTML = '<div class="text-sm">No upcoming dates</div>';
    }
}

function findDatesAroundToday() {
    const todayTime = new Date().getTime();
    let closestIndex = 0;
    let minDiff = Math.abs(appState.dateSequence[0].getTime() - todayTime);

    appState.dateSequence.forEach(function(date, index) {
        const diff = Math.abs(date.getTime() - todayTime);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
        }
    });

    return {
        past: appState.dateSequence.slice(Math.max(0, closestIndex - 3), closestIndex),
        closest: appState.dateSequence[closestIndex],
        future: appState.dateSequence.slice(closestIndex + 1, closestIndex + 6)
    };
}

function updateCalendar() {
    const year = appState.currentViewMonth.getFullYear();
    const month = appState.currentViewMonth.getMonth();
    
    document.getElementById('calendarTitle').textContent = 
        appState.currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    document.getElementById('debugInfo').textContent = 
        'Day offset: ' + appState.dayOffset + ' | Viewing: ' + year + '-' + (month + 1);
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        grid.appendChild(emptyDiv);
    }
    
    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        if (isDateInSequence(date)) {
            dayEl.className += ' highlighted';
        }
        
        if (isToday(date, today)) {
            dayEl.className += ' today';
        }
        
        grid.appendChild(dayEl);
    }
    
    console.log('Calendar updated for:', year + '-' + (month + 1));
}

function isDateInSequence(date) {
    return appState.dateSequence.some(function(seqDate) {
        return seqDate.toDateString() === date.toDateString();
    });
}

function isToday(date, today) {
    return date.toDateString() === today.toDateString();
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const toggle = document.getElementById('settingsToggle');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        toggle.textContent = '(Hide)';
    } else {
        panel.classList.add('hidden');
        toggle.textContent = '(Show)';
    }
}

function toggleFormula() {
    const panel = document.getElementById('formulaPanel');
    const toggle = document.getElementById('formulaToggle');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        toggle.textContent = '(Hide)';
    } else {
        panel.classList.add('hidden');
        toggle.textContent = '(Show)';
    }
}

function updateIncrementPreview() {
    console.log('Updating increment preview');
    const increments = [];
    for (let i = 0; i < 8; i++) {
        increments.push(appState.initialIncrement + (appState.incrementStep * i));
    }
    const previewText = increments.join(' → ') + ' days...';
    document.getElementById('incrementPreview').textContent = previewText;
    console.log('Increment preview:', previewText);
}

function updateFormula() {
    console.log('Updating formula');
    const seq5 = getIncrementSequence(5);
    const content = 
        '<div style="margin-bottom: 16px;">' +
            '<strong>Current Pattern Explanation:</strong>' +
            '<ul style="margin-left: 20px; margin-top: 8px; line-height: 1.6;">' +
                '<li>Start with your chosen date</li>' +
                '<li>First increment: Add ' + appState.initialIncrement + ' days</li>' +
                '<li>Second increment: Add ' + (appState.initialIncrement + appState.incrementStep) + ' days (' + appState.initialIncrement + ' + ' + appState.incrementStep + ')</li>' +
                '<li>Third increment: Add ' + (appState.initialIncrement + (appState.incrementStep * 2)) + ' days (' + (appState.initialIncrement + appState.incrementStep) + ' + ' + appState.incrementStep + ')</li>' +
                '<li>Continue adding ' + appState.incrementStep + ' more days to each increment</li>' +
            '</ul>' +
        '</div>' +
        '<div style="margin-bottom: 12px;"><strong>Custom Formula:</strong></div>' +
        '<div class="increment-preview">' +
            '<p>For increment n (where n starts at 1):</p>' +
            '<p>Increment = ' + appState.initialIncrement + ' + ' + appState.incrementStep + ' × (n - 1)</p>' +
            '<p>So: ' + seq5.join(', ') + ', ...</p>' +
            '<br>' +
            '<p>To find the nth date from start:</p>' +
            '<p>Total days = Σ(' + appState.initialIncrement + ' + ' + appState.incrementStep + ' × (i - 1)) for i = 1 to n</p>';
            
    if (appState.incrementStep !== 0) {
        content += '<p>Simplified: Total days = ' + (appState.initialIncrement - appState.incrementStep) + 'n + ' + appState.incrementStep + 'n²/2</p>';
    } else {
        content += '<p>Simplified: Total days = ' + appState.initialIncrement + 'n (constant increment)</p>';
    }
    
    content += '</div>';
    
    document.getElementById('formulaContent').innerHTML = content;
}

function getIncrementSequence(count) {
    const increments = [];
    for (let i = 0; i < count; i++) {
        increments.push(appState.initialIncrement + (appState.incrementStep * i));
    }
    return increments;
}

function saveSpeedDial() {
    const label = document.getElementById('speedDialLabel').value.trim();
    console.log('Saving speed dial:', label);
    if (label) {
        const newSpeedDial = {
            id: Date.now(),
            label: label,
            date: appState.startDate,
            initialIncrement: appState.initialIncrement,
            incrementStep: appState.incrementStep
        };
        appState.speedDialDates.push(newSpeedDial);
        console.log('Speed dial saved:', newSpeedDial);
        document.getElementById('speedDialLabel').value = '';
        updateSpeedDialList();
    } else {
        console.log('No label provided');
    }
}

function selectSpeedDial(id) {
    console.log('Selecting speed dial:', id);
    const item = appState.speedDialDates.find(function(dial) {
        return dial.id === id;
    });
    
    if (item) {
        appState.startDate = item.date;
        appState.initialIncrement = item.initialIncrement;
        appState.incrementStep = item.incrementStep;
        
        document.getElementById('startDate').value = appState.startDate;
        document.getElementById('initialIncrement').value = appState.initialIncrement;
        document.getElementById('incrementStep').value = appState.incrementStep;
        
        calculateDateSequence();
        updateAllDisplays();
        updateIncrementPreview();
        updateFormula();
        
        console.log('Speed dial applied:', item);
    }
}

function deleteSpeedDial(id) {
    console.log('Deleting speed dial:', id);
    appState.speedDialDates = appState.speedDialDates.filter(function(item) {
        return item.id !== id;
    });
    updateSpeedDialList();
}

function updateSpeedDialList() {
    const listEl = document.getElementById('speedDialList');
    
    if (appState.speedDialDates.length === 0) {
        listEl.innerHTML = '<p class="text-sm" style="color: #6b7280; font-style: italic;">No saved configurations yet. Enter a label above to save the current date and increment settings.</p>';
        return;
    }
    
    let html = '<div style="margin-bottom: 8px;"><h4 class="font-medium">Saved Configurations:</h4></div>';
    
    appState.speedDialDates.forEach(function(item) {
        const dateStr = new Date(item.date + 'T00:00:00').toLocaleDateString();
        html += '<div class="speed-dial-item">' +
            '<div class="flex-1">' +
                '<div class="font-medium">' + item.label + '</div>' +
                '<div class="text-xs">Date: ' + dateStr + ' | Pattern: ' + item.initialIncrement + '+' + item.incrementStep + ' days</div>' +
            '</div>' +
            '<div class="flex">' +
                '<button type="button" onclick="selectSpeedDial(' + item.id + ')" style="margin-right: 8px;">Use</button>' +
                '<button type="button" onclick="deleteSpeedDial(' + item.id + ')" class="btn-red">Delete</button>' +
            '</div>' +
        '</div>';
    });
    
    listEl.innerHTML = html;
    console.log('Speed dial list updated, count:', appState.speedDialDates.length);
}