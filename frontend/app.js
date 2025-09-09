const API_BASE = localStorage.getItem('api_base') || 'http://127.0.0.1:8000';

const state = {
  token: localStorage.getItem('token') || null,
  email: localStorage.getItem('email') || null,
  jobs: [],
  apps: [],
  filters: {
    search: '',
    category: '',
    priority: ''
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
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

function renderJobs() {
  const list = document.getElementById('jobs-list');
  list.innerHTML = '';
  state.jobs.forEach(job => {
    const li = document.createElement('li');
    li.className = 'card';
    const left = document.createElement('div');
    
    // Format deadline
    const deadlineText = job.deadline ? new Date(job.deadline).toLocaleDateString() : '';
    const isUrgent = job.deadline && new Date(job.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    left.innerHTML = `
      <div class="title">
        ${job.title} @ ${job.company}
        ${job.priority ? `<span class="job-priority ${job.priority}">${job.priority}</span>` : ''}
      </div>
      ${job.category ? `<div class="job-category ${job.category.replace(' ', '')}">${job.category}</div>` : ''}
      <div class="muted">${job.location || ''}</div>
      ${job.salary_range ? `<div class="job-salary">💰 ${job.salary_range}</div>` : ''}
      ${deadlineText ? `<div class="job-deadline ${isUrgent ? 'urgent' : ''}">📅 Deadline: ${deadlineText}</div>` : ''}
      <div class="muted"><a href="${job.url || '#'}" target="_blank" rel="noopener noreferrer">${job.url || 'No URL provided'}</a></div>
      <div class="muted">${job.notes || ''}</div>`;

    const right = document.createElement('div');
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Track';
    applyBtn.onclick = async () => {
      await api('/applications', { method: 'POST', body: JSON.stringify({ job_id: job.id }) });
      await loadData();
    };
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'secondary';
    copyBtn.textContent = 'Copy URL';
    copyBtn.onclick = async () => {
      if (job.url) {
        try {
          await navigator.clipboard.writeText(job.url);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy URL'; }, 2000);
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = job.url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy URL'; }, 2000);
        }
      }
    };
    
    const calendarBtn = document.createElement('button');
    calendarBtn.className = 'secondary';
    calendarBtn.textContent = '📅 Calendar';
    calendarBtn.onclick = () => {
      if (job.deadline) {
        generateCalendarEvent(job);
      } else {
        alert('No deadline set for this job. Please add a deadline first.');
      }
    };
    
    const delBtn = document.createElement('button');
    delBtn.className = 'secondary';
    delBtn.textContent = 'Delete';
    delBtn.onclick = async () => { await api(`/jobs/${job.id}`, { method: 'DELETE' }); await loadData(); };
    right.append(applyBtn, copyBtn, calendarBtn, delBtn);

    li.append(left, right);
    list.append(li);
  });
}

function renderApps() {
  const list = document.getElementById('apps-list');
  list.innerHTML = '';
  state.apps.forEach(app => {
    const job = state.jobs.find(j => j.id === app.job_id);
    const li = document.createElement('li');
    li.className = 'card';
    const left = document.createElement('div');
    left.innerHTML = `<div class="title">${job?.title || 'Unknown Job'}</div><div class="muted">${job?.company || 'Unknown Company'}</div>`;
    const right = document.createElement('div');
    const status = document.createElement('span');
    status.className = `status ${app.status}`;
    status.textContent = app.status;
    
    // Create dropdown for status selection
    const statusSelect = document.createElement('select');
    statusSelect.className = 'status-select';
    const statusOptions = [
      { value: 'SAVED', label: 'Saved' },
      { value: 'APPLIED', label: 'Applied' },
      { value: 'INTERVIEW', label: 'Interview' },
      { value: 'OFFER', label: 'Offer' },
      { value: 'REJECTED', label: 'Rejected' }
    ];
    
    statusOptions.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      if (option.value === app.status) {
        optionEl.selected = true;
      }
      statusSelect.appendChild(optionEl);
    });
    
    statusSelect.onchange = async () => {
      const newStatus = statusSelect.value;
      await api(`/applications/${app.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      await loadData();
    };
    
    const delBtn = document.createElement('button');
    delBtn.className = 'secondary';
    delBtn.textContent = 'Delete';
    delBtn.onclick = async () => { await api(`/applications/${app.id}`, { method: 'DELETE' }); await loadData(); };
    right.append(statusSelect, delBtn);
    li.append(left, right);
    list.append(li);
  });
}

async function loadData() {
  if (!state.token) return;
  
  // Build query parameters for filtering
  const params = new URLSearchParams();
  if (state.filters.search) params.append('search', state.filters.search);
  if (state.filters.category) params.append('category', state.filters.category);
  if (state.filters.priority) params.append('priority', state.filters.priority);
  
  const jobsUrl = `/jobs${params.toString() ? '?' + params.toString() : ''}`;
  
  const [jobs, apps] = await Promise.all([
    api(jobsUrl),
    api('/applications')
  ]);
  state.jobs = jobs;
  state.apps = apps;
  renderJobs();
  renderApps();
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

document.getElementById('logout-btn').addEventListener('click', () => {
  state.token = null; state.email = null; state.jobs = []; state.apps = [];
  localStorage.removeItem('token'); localStorage.removeItem('email');
  setAuthUI();
  renderJobs(); renderApps();
});

document.getElementById('job-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const job = {
      title: document.getElementById('job-title').value,
      company: document.getElementById('job-company').value,
      location: document.getElementById('job-location').value,
      url: document.getElementById('job-url').value,
      notes: document.getElementById('job-notes').value,
      category: document.getElementById('job-category').value || null,
      priority: document.getElementById('job-priority').value,
      salary_range: document.getElementById('job-salary').value || null,
      deadline: document.getElementById('job-deadline').value || null,
    };
    
    console.log('Submitting job:', job); // Debug log
    
    await api('/jobs', { method: 'POST', body: JSON.stringify(job) });
    e.target.reset();
    await loadData();
    
    // Show success message
    alert('Job added successfully!');
    
  } catch (error) {
    console.error('Error adding job:', error);
    alert('Error adding job: ' + error.message);
  }
});

// Filter event listeners
document.getElementById('job-search')?.addEventListener('input', (e) => {
  state.filters.search = e.target.value;
  loadData();
});

document.getElementById('category-filter')?.addEventListener('change', (e) => {
  state.filters.category = e.target.value;
  loadData();
});

document.getElementById('priority-filter')?.addEventListener('change', (e) => {
  state.filters.priority = e.target.value;
  loadData();
});

document.getElementById('clear-filters')?.addEventListener('click', () => {
  state.filters = { search: '', category: '', priority: '' };
  document.getElementById('job-search').value = '';
  document.getElementById('category-filter').value = '';
  document.getElementById('priority-filter').value = '';
  loadData();
});

// Calendar generation function
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

// Initialization is now handled in the window load event


