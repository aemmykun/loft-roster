// Loft Roster Management System
class RosterManager {
  constructor() {
    this.staff = this.loadData('staff') || [];
    this.tasks = this.loadData('tasks') || [
      { id: 1, name: 'Clean Room', minutes: 30, type: 'room' },
      { id: 2, name: 'Vacuum Common Area', minutes: 45, type: 'common' },
      { id: 3, name: 'Restock Supplies', minutes: 15, type: 'maintenance' }
    ];
    this.availability = this.loadData('availability') || {};
    this.settings = this.loadData('settings') || {
      minutesPerRoom: 30,
      supervisorThreshold: 60,
      maxStaffPerDay: 15,
      workStart: '08:00',
      workEnd: '17:00'
    };
    this.roster = this.loadData('roster') || {};
    this.currentSection = 'staff';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderStaff();
    this.renderTasks();
    this.renderSettings();
    this.generateAvailabilityGrid();
    this.updateStaffSelector();
  }

  setupEventListeners() {
    // Staff management
    document.getElementById('staff-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addStaff();
    });

    // Task management
    document.getElementById('task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Availability management
    document.getElementById('availability-staff').addEventListener('change', (e) => {
      this.showStaffAvailability(e.target.value);
    });

    document.getElementById('save-availability').addEventListener('click', () => {
      this.saveAvailability();
    });

    // Roster generation
    document.getElementById('generate-roster').addEventListener('click', () => {
      this.generateRoster();
    });

    document.getElementById('clear-roster').addEventListener('click', () => {
      this.clearRoster();
    });

    // Settings
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });
  }

  // Navigation
  showSection(section) {
    // Hide all sections
    const sections = document.querySelectorAll('main section');
    sections.forEach(s => s.style.display = 'none');

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`${section}-section`).style.display = 'block';

    // Add active class to clicked nav link
    event.target.classList.add('active');

    this.currentSection = section;
  }

  // Staff Management
  addStaff() {
    const name = document.getElementById('staff-name').value.trim();
    const role = document.getElementById('staff-role').value;
    const maxHours = parseInt(document.getElementById('staff-hours').value);

    if (name) {
      const newStaff = {
        id: Date.now(),
        name,
        role,
        maxHours
      };
      
      this.staff.push(newStaff);
      this.saveData('staff', this.staff);
      this.renderStaff();
      this.updateStaffSelector();
      document.getElementById('staff-form').reset();
      document.getElementById('staff-hours').value = 40;
    }
  }

  renderStaff() {
    const list = document.getElementById('staff-list');
    list.innerHTML = this.staff.map(member => `
      <li class="staff-item">
        <div class="task-info">
          <strong>${member.name}</strong> – ${member.role} (Max: ${member.maxHours}h/week)
        </div>
        <button class="delete-btn" onclick="rosterManager.removeStaff(${member.id})">Remove</button>
      </li>
    `).join('');
  }

  removeStaff(id) {
    this.staff = this.staff.filter(member => member.id !== id);
    delete this.availability[id];
    this.saveData('staff', this.staff);
    this.saveData('availability', this.availability);
    this.renderStaff();
    this.updateStaffSelector();
  }

  updateStaffSelector() {
    const selector = document.getElementById('availability-staff');
    selector.innerHTML = '<option value="">Select Staff Member</option>' +
      this.staff.map(member => `<option value="${member.id}">${member.name}</option>`).join('');
  }

  // Task Management
  addTask() {
    const name = document.getElementById('task-name').value.trim();
    const minutes = parseInt(document.getElementById('task-minutes').value);
    const type = document.getElementById('task-type').value;

    if (name && minutes > 0) {
      const newTask = {
        id: Date.now(),
        name,
        minutes,
        type
      };
      
      this.tasks.push(newTask);
      this.saveData('tasks', this.tasks);
      this.renderTasks();
      document.getElementById('task-form').reset();
    }
  }

  renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = this.tasks.map(task => `
      <li class="task-item">
        <div class="task-info">
          <strong>${task.name}</strong> (${task.type})
        </div>
        <span class="task-minutes">${task.minutes}min</span>
        <button class="delete-btn" onclick="rosterManager.removeTask(${task.id})">Remove</button>
      </li>
    `).join('');
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.saveData('tasks', this.tasks);
    this.renderTasks();
  }

  // Availability Management
  generateAvailabilityGrid() {
    const grid = document.getElementById('availability-grid');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = [];
    
    // Generate time slots from work start to work end
    const startHour = parseInt(this.settings.workStart.split(':')[0]);
    const endHour = parseInt(this.settings.workEnd.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    // Clear existing grid content except headers
    const headers = grid.querySelector('.day-headers');
    grid.innerHTML = '';
    grid.appendChild(headers);

    // Generate time slots and availability cells
    timeSlots.forEach(time => {
      // Time slot label
      const timeDiv = document.createElement('div');
      timeDiv.className = 'time-slot';
      timeDiv.textContent = time;
      grid.appendChild(timeDiv);

      // Availability cells for each day
      days.forEach((day, dayIndex) => {
        const cell = document.createElement('button');
        cell.className = 'availability-cell';
        cell.dataset.time = time;
        cell.dataset.day = dayIndex;
        cell.addEventListener('click', () => {
          cell.classList.toggle('available');
          cell.classList.toggle('unavailable');
        });
        grid.appendChild(cell);
      });
    });
  }

  showStaffAvailability(staffId) {
    const cells = document.querySelectorAll('.availability-cell');
    
    // Reset all cells
    cells.forEach(cell => {
      cell.classList.remove('available', 'unavailable');
    });

    if (staffId && this.availability[staffId]) {
      const staffAvailability = this.availability[staffId];
      
      cells.forEach(cell => {
        const time = cell.dataset.time;
        const day = cell.dataset.day;
        const key = `${day}-${time}`;
        
        if (staffAvailability[key]) {
          cell.classList.add('available');
        } else {
          cell.classList.add('unavailable');
        }
      });
    }
  }

  saveAvailability() {
    const staffId = document.getElementById('availability-staff').value;
    if (!staffId) {
      alert('Please select a staff member first.');
      return;
    }

    const cells = document.querySelectorAll('.availability-cell');
    const staffAvailability = {};

    cells.forEach(cell => {
      const time = cell.dataset.time;
      const day = cell.dataset.day;
      const key = `${day}-${time}`;
      staffAvailability[key] = cell.classList.contains('available');
    });

    this.availability[staffId] = staffAvailability;
    this.saveData('availability', this.availability);
    alert('Availability saved successfully!');
  }

  // Roster Generation
  generateRoster() {
    if (this.staff.length === 0) {
      alert('Please add staff members first.');
      return;
    }

    if (this.tasks.length === 0) {
      alert('Please add tasks first.');
      return;
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const newRoster = {};

    days.forEach((day, dayIndex) => {
      newRoster[day] = this.generateDayRoster(dayIndex);
    });

    this.roster = newRoster;
    this.saveData('roster', this.roster);
    this.renderRoster();
  }

  generateDayRoster(dayIndex) {
    const availableStaff = this.getAvailableStaff(dayIndex);
    const dailyTasks = [...this.tasks]; // Copy tasks
    const assignments = {};

    // Initialize assignments for all available staff
    availableStaff.forEach(staff => {
      assignments[staff.id] = {
        name: staff.name,
        role: staff.role,
        tasks: [],
        totalMinutes: 0
      };
    });

    // Distribute tasks based on staff availability and limits
    dailyTasks.forEach(task => {
      const suitableStaff = this.findSuitableStaff(availableStaff, task, assignments);
      if (suitableStaff) {
        assignments[suitableStaff.id].tasks.push(task);
        assignments[suitableStaff.id].totalMinutes += task.minutes;
      }
    });

    return assignments;
  }

  getAvailableStaff(dayIndex) {
    return this.staff.filter(staff => {
      const availability = this.availability[staff.id];
      if (!availability) return false;

      // Check if staff is available for any time slot on this day
      const startHour = parseInt(this.settings.workStart.split(':')[0]);
      const endHour = parseInt(this.settings.workEnd.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const key = `${dayIndex}-${time}`;
        if (availability[key]) {
          return true;
        }
      }
      return false;
    });
  }

  findSuitableStaff(availableStaff, task, assignments) {
    // Find staff member with least assigned time who can handle this task
    const maxMinutesPerDay = (8 * 60); // 8 hours max per day
    
    const suitable = availableStaff.filter(staff => {
      const currentMinutes = assignments[staff.id].totalMinutes;
      return (currentMinutes + task.minutes) <= maxMinutesPerDay;
    });

    if (suitable.length === 0) return null;

    // Sort by current workload (ascending)
    suitable.sort((a, b) => assignments[a.id].totalMinutes - assignments[b.id].totalMinutes);
    
    return suitable[0];
  }

  renderRoster() {
    const display = document.getElementById('roster-display');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    if (Object.keys(this.roster).length === 0) {
      display.innerHTML = '<p>No roster generated yet. Click "Generate Roster" to create one.</p>';
      return;
    }

    display.innerHTML = days.map(day => {
      const dayAssignments = this.roster[day] || {};
      const staffWithTasks = Object.values(dayAssignments).filter(staff => staff.tasks.length > 0);

      return `
        <div class="day-roster">
          <div class="day-header">${day}</div>
          <div class="staff-assignments">
            ${staffWithTasks.length > 0 ? 
              staffWithTasks.map(staff => `
                <div class="staff-assignment">
                  <div>
                    <div class="staff-name">${staff.name} (${staff.role})</div>
                    <div class="assigned-tasks">${staff.tasks.map(t => t.name).join(', ')}</div>
                  </div>
                  <div class="total-hours">${Math.round(staff.totalMinutes / 60 * 10) / 10}h</div>
                </div>
              `).join('') :
              '<div class="staff-assignment">No assignments for this day</div>'
            }
          </div>
        </div>
      `;
    }).join('');
  }

  clearRoster() {
    this.roster = {};
    this.saveData('roster', this.roster);
    this.renderRoster();
  }

  // Settings Management
  renderSettings() {
    document.getElementById('minutes-per-room').value = this.settings.minutesPerRoom;
    document.getElementById('supervisor-threshold').value = this.settings.supervisorThreshold;
    document.getElementById('max-staff-per-day').value = this.settings.maxStaffPerDay;
    document.getElementById('work-start').value = this.settings.workStart;
    document.getElementById('work-end').value = this.settings.workEnd;
  }

  saveSettings() {
    this.settings = {
      minutesPerRoom: parseInt(document.getElementById('minutes-per-room').value),
      supervisorThreshold: parseInt(document.getElementById('supervisor-threshold').value),
      maxStaffPerDay: parseInt(document.getElementById('max-staff-per-day').value),
      workStart: document.getElementById('work-start').value,
      workEnd: document.getElementById('work-end').value
    };
    
    this.saveData('settings', this.settings);
    this.generateAvailabilityGrid(); // Regenerate grid with new work hours
    alert('Settings saved successfully!');
  }

  // Data Persistence
  saveData(key, data) {
    localStorage.setItem(`loft-roster-${key}`, JSON.stringify(data));
  }

  loadData(key) {
    const data = localStorage.getItem(`loft-roster-${key}`);
    return data ? JSON.parse(data) : null;
  }
}

// Navigation function (global scope for onclick handlers)
function showSection(section) {
  rosterManager.showSection(section);
}

// Initialize the roster manager when page loads
let rosterManager;
document.addEventListener('DOMContentLoaded', () => {
  rosterManager = new RosterManager();
});
