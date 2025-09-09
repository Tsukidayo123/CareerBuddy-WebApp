const API_BASE = localStorage.getItem('api_base') || 'http://127.0.0.1:8000';

const state = {
  token: localStorage.getItem('token') || null,
  email: localStorage.getItem('email') || null,
  jobs: [],
  applications: [],
  stats: {
    totalJobs: 0,
    activeApplications: 0,
    completedApplications: 0,
    successRate: 0,
    statusCounts: {
      SAVED: 0,
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0
    }
  }
};

function setAuthUI() {
  const userInfo = document.getElementById('user-info');
  const loginPrompt = document.getElementById('login-prompt');
  const main = document.querySelector('main');
  
  if (state.token) {
    userInfo.classList.remove('hidden');
    loginPrompt.classList.add('hidden');
    main.classList.remove('hidden');
    document.getElementById('user-email').textContent = state.email;
  } else {
    userInfo.classList.add('hidden');
    loginPrompt.classList.remove('hidden');
    main.classList.add('hidden');
  }
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  headers['Content-Type'] = 'application/json';
  
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  
  return res.status === 204 ? null : res.json();
}

function calculateStats() {
  // Calculate total jobs
  state.stats.totalJobs = state.jobs.length;
  
  // Calculate application stats
  state.stats.activeApplications = state.applications.filter(app => 
    ['APPLIED', 'INTERVIEW'].includes(app.status)
  ).length;
  
  state.stats.completedApplications = state.applications.filter(app => 
    ['OFFER', 'REJECTED'].includes(app.status)
  ).length;
  
  // Calculate success rate (interviews + offers / total applications)
  const totalApplications = state.applications.length;
  const successfulApplications = state.applications.filter(app => 
    ['INTERVIEW', 'OFFER'].includes(app.status)
  ).length;
  
  state.stats.successRate = totalApplications > 0 
    ? Math.round((successfulApplications / totalApplications) * 100) 
    : 0;
  
  // Count by status
  state.stats.statusCounts = {
    SAVED: 0,
    APPLIED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0
  };
  
  state.applications.forEach(app => {
    state.stats.statusCounts[app.status]++;
  });
}

function updateStatsDisplay() {
  // Update overview cards
  document.getElementById('total-jobs').textContent = state.stats.totalJobs;
  document.getElementById('active-applications').textContent = state.stats.activeApplications;
  document.getElementById('completed-applications').textContent = state.stats.completedApplications;
  document.getElementById('success-rate').textContent = `${state.stats.successRate}%`;
  
  // Update status counts
  document.getElementById('count-saved').textContent = state.stats.statusCounts.SAVED;
  document.getElementById('count-applied').textContent = state.stats.statusCounts.APPLIED;
  document.getElementById('count-interview').textContent = state.stats.statusCounts.INTERVIEW;
  document.getElementById('count-offer').textContent = state.stats.statusCounts.OFFER;
  document.getElementById('count-rejected').textContent = state.stats.statusCounts.REJECTED;
}

function generateUpcomingDeadlines() {
  const deadlineList = document.getElementById('upcoming-deadlines');
  deadlineList.innerHTML = '';
  
  // Get jobs with deadlines
  const jobsWithDeadlines = state.jobs.filter(job => job.deadline);
  
  if (jobsWithDeadlines.length === 0) {
    deadlineList.innerHTML = `
      <div class="deadline-item">
        <div class="deadline-icon">📅</div>
        <div class="deadline-content">
          <p>No upcoming deadlines</p>
          <span class="deadline-time">Add deadlines to your jobs to see them here</span>
        </div>
      </div>
    `;
    return;
  }
  
  // Sort by deadline (soonest first)
  jobsWithDeadlines.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  
  // Show next 5 deadlines
  jobsWithDeadlines.slice(0, 5).forEach(job => {
    const deadline = new Date(job.deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    let urgencyClass = '';
    let urgencyText = '';
    
    if (daysUntil < 0) {
      urgencyClass = 'urgent';
      urgencyText = 'Overdue!';
    } else if (daysUntil <= 1) {
      urgencyClass = 'urgent';
      urgencyText = 'Due today!';
    } else if (daysUntil <= 3) {
      urgencyClass = 'urgent';
      urgencyText = `${daysUntil} days left`;
    } else if (daysUntil <= 7) {
      urgencyClass = 'warning';
      urgencyText = `${daysUntil} days left`;
    } else {
      urgencyText = `${daysUntil} days left`;
    }
    
    const deadlineItem = document.createElement('div');
    deadlineItem.className = `deadline-item ${urgencyClass}`;
    deadlineItem.innerHTML = `
      <div class="deadline-icon">${daysUntil <= 1 ? '🚨' : '📅'}</div>
      <div class="deadline-content">
        <p>${job.title} at ${job.company}</p>
        <span class="deadline-time">${urgencyText} • Due ${deadline.toLocaleDateString()}</span>
        <div class="deadline-actions">
          <button class="deadline-btn" onclick="generateCalendarEvent(${JSON.stringify(job).replace(/"/g, '&quot;')})">
            📅 Add to Calendar
          </button>
          <button class="deadline-btn secondary" onclick="window.location.href='index.html'">
            View Job
          </button>
        </div>
      </div>
    `;
    deadlineList.appendChild(deadlineItem);
  });
}

function generateRecentActivity() {
  const activityList = document.getElementById('recent-activity');
  activityList.innerHTML = '';
  
  if (state.jobs.length === 0 && state.applications.length === 0) {
    activityList.innerHTML = `
      <div class="activity-item">
        <div class="activity-icon">🎉</div>
        <div class="activity-content">
          <p>Welcome to CareerBuddy! Start by adding your first job.</p>
          <span class="activity-time">Just now</span>
        </div>
      </div>
    `;
    return;
  }
  
  // Create activity items from recent jobs and applications
  const activities = [];
  
  // Add recent jobs
  state.jobs.slice(0, 3).forEach(job => {
    activities.push({
      icon: '💼',
      text: `Added "${job.title}" at ${job.company}`,
      time: new Date(job.created_at).toLocaleDateString()
    });
  });
  
  // Add recent applications
  state.applications.slice(0, 3).forEach(app => {
    const job = state.jobs.find(j => j.id === app.job_id);
    if (job) {
      activities.push({
        icon: '🚀',
        text: `Applied to "${job.title}" at ${job.company}`,
        time: app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'
      });
    }
  });
  
  // Sort by time and display
  activities.slice(0, 5).forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
      <div class="activity-icon">${activity.icon}</div>
      <div class="activity-content">
        <p>${activity.text}</p>
        <span class="activity-time">${activity.time}</span>
      </div>
    `;
    activityList.appendChild(activityItem);
  });
}

async function loadData() {
  if (!state.token) return;
  
  try {
    const [jobs, applications] = await Promise.all([
      api('/jobs'),
      api('/applications')
    ]);
    
    state.jobs = jobs;
    state.applications = applications;
    
    calculateStats();
    updateStatsDisplay();
    generateUpcomingDeadlines();
    generateRecentActivity();
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

// Event listeners
document.getElementById('logout-btn')?.addEventListener('click', () => {
  state.token = null;
  state.email = null;
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  window.location.href = 'login.html';
});


// Calendar generation function (same as in app.js)
function generateCalendarEvent(job) {
  if (!job.deadline) return;
  
  // Format dates for iCal
  const deadline = new Date(job.deadline);
  const startDate = new Date(deadline);
  startDate.setHours(9, 0, 0, 0); // 9 AM
  const endDate = new Date(deadline);
  endDate.setHours(17, 0, 0, 0); // 5 PM
  
  // Format dates in iCal format (YYYYMMDDTHHMMSSZ)
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // Generate unique ID
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@careerbuddy.app`;
  
  // Create iCal content
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CareerBuddy//Job Application Deadline//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Application Deadline - ${job.title} at ${job.company}`,
    `DESCRIPTION:Job Application Deadline\\n\\n`,
    `Position: ${job.title}\\n`,
    `Company: ${job.company}\\n`,
    job.location ? `Location: ${job.location}\\n` : '',
    job.salary_range ? `Salary: ${job.salary_range}\\n` : '',
    job.url ? `Job URL: ${job.url}\\n` : '',
    job.notes ? `Notes: ${job.notes}\\n` : '',
    `\\nPriority: ${job.priority}\\n`,
    `Category: ${job.category || 'Not specified'}\\n`,
    `\\nDon't forget to submit your application!`,
    'LOCATION:' + (job.location || 'Remote'),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Application deadline tomorrow!',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Application deadline in 2 hours!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  // Create and download the file
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Application Deadline - ${job.company} - ${job.title}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show success message
  alert('Calendar event downloaded! Import it into your calendar app.');
}

// Check if user is already logged in on page load
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  if (token && email) {
    state.token = token;
    state.email = email;
    setAuthUI();
    loadData();
  } else {
    setAuthUI();
  }
});
