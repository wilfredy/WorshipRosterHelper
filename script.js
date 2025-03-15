// Data storage
let personnel = [];
let constraints = [];
let roster = [];
let tempUnavailableDateRanges = [];

// Load data from localStorage
const savedData = localStorage.getItem('churchRosterData');
if (savedData) {
  const data = JSON.parse(savedData);
  personnel = data.personnel || [];
  constraints = data.constraints || [];
} 

function saveToLocalStorage() {
  localStorage.setItem('churchRosterData', JSON.stringify({
    personnel,
    constraints
  }));
}

function resetAllData() {
  if (confirm('確定要重設所有數據嗎？此操作無法復原。')) {
    personnel = [];
    constraints = [];
    saveToLocalStorage();
    updatePersonnelList();
    updatePersonnelSelects();
    updateConstraintsList();
  }
}

function addPlaceholderData() {
  if (confirm('確定要添加預設數據嗎？')) {
    personnel = defaultPeople;
    saveToLocalStorage();
    updatePersonnelList();
    updatePersonnelSelects();
  }
}

function exportToCsv() {
  // Export personnel data
  let csvContent = "姓名,角色,不可用日期範圍\n";
  personnel.forEach(person => {
    const roles = person.roles.join('|');
    const dates = person.unavailableDateRanges
      .map(range => `${range.start}至${range.end}`)
      .join('|');
    csvContent += `${person.name},${roles},${dates}\n`;
  });

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '教會輪值表數據.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function importCsv(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const rows = e.target.result.split('\n');
        personnel = [];
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          const [name, roles, dates] = rows[i].split(',');
          const personRoles = roles.split('|');
          const unavailableDateRanges = dates.split('|')
            .filter(date => date.trim())
            .map(dateRange => {
              const [start, end] = dateRange.split('至');
              return { start, end };
            });
          personnel.push({
            name,
            roles: personRoles,
            unavailableDateRanges,
            serviceLimits: {}
          });
        }
        saveToLocalStorage();
        updatePersonnelList();
        updatePersonnelSelects();
      } catch (error) {
        alert('導入失敗：CSV格式錯誤');
      }
    };
    reader.readAsText(file);
  }
}

function removePerson(index) {
  personnel.splice(index, 1);
  saveToLocalStorage();
  updatePersonnelList();
  updatePersonnelSelects();
}

// Generate 20 example people with service limits
const defaultPeople = [
  { name: "王小明", roles: ["領詩", "和唱"] },
  { name: "李美玲", roles: ["司琴"] },
  { name: "張大衛", roles: ["鼓手", "結他手"] },
  { name: "陳雅琪", roles: ["和唱", "領詩"] },
  { name: "林志豪", roles: ["低音結他手"] },
  { name: "黃詩婷", roles: ["司琴", "和唱"] },
  { name: "吳俊傑", roles: ["結他手"] },
  { name: "周淑芬", roles: ["領詩"] },
  { name: "劉建國", roles: ["鼓手"] },
  { name: "鄭雅文", roles: ["和唱"] },
  { name: "謝志明", roles: ["低音結他手", "結他手"] },
  { name: "楊美琪", roles: ["司琴"] },
  { name: "蔡英俊", roles: ["領詩", "和唱"] },
  { name: "許雅婷", roles: ["和唱"] },
  { name: "彭俊豪", roles: ["鼓手"] },
  { name: "趙小萍", roles: ["司琴", "和唱"] },
  { name: "郭志偉", roles: ["結他手"] },
  { name: "何淑華", roles: ["領詩"] },
  { name: "朱建安", roles: ["低音結他手"] },
  { name: "馮美玲", roles: ["和唱", "領詩"] }
].map(p => ({ ...p, unavailableDateRanges: [] }));

// Load saved data or use defaults
function loadSavedData() {
  const savedData = localStorage.getItem('churchRosterData');
  if (savedData) {
    const data = JSON.parse(savedData);
    personnel = data.personnel || defaultPeople;
    constraints = data.constraints || [];
    updatePersonnelList();
    updatePersonnelSelects();
    updateConstraintsList();
  } else {
    personnel = defaultPeople;
  }
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadSavedData);

function addUnavailableDateRange() {
  const startDate = document.getElementById('unavailable-date-start').value;
  const endDate = document.getElementById('unavailable-date-end').value;

  if (startDate && endDate) {
    tempUnavailableDateRanges.push({ start: startDate, end: endDate });
    updateUnavailableDates();
  }
}

function updateUnavailableDates() {
  const container = document.getElementById('unavailable-dates');
  container.innerHTML = tempUnavailableDateRanges.map((range, index) => 
    `<div>${range.start} 至 ${range.end} <button onclick="removeUnavailableDateRange(${index})">刪除</button></div>`
  ).join('');
}

function removeUnavailableDateRange(index) {
  tempUnavailableDateRanges.splice(index, 1);
  updateUnavailableDates();
}

function isDateInRange(date, range) {
  return date >= range.start && date <= range.end;
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
  });
});

// Personnel management
document.getElementById('personnel-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const roles = Array.from(document.querySelectorAll('.roles-checkboxes input:checked'))
    .map(checkbox => checkbox.value);
  const unavailableDateRanges = tempUnavailableDateRanges || [];

  if (roles.length === 0) {
    alert('請選擇至少一個角色');
    return;
  }

  const serviceLimits = {};
  roles.forEach(role => {
    serviceLimits[role] = 4; // Default limit of 4 services per month per role
  });
  personnel.push({ 
    name, 
    roles, 
    unavailableDateRanges,
    serviceLimits 
  });
  saveToLocalStorage();
  tempUnavailableDateRanges = [];
  document.getElementById('unavailable-dates').innerHTML = '';
  updatePersonnelList();
  updatePersonnelSelects();
  document.getElementById('personnel-form').reset();
});

function updatePersonnelList() {
  const list = document.getElementById('personnel-list');
  list.innerHTML = '';
  personnel.forEach((person, index) => {
    const div = document.createElement('div');
    div.className = 'person-item';
    div.innerHTML = `
      <div class="person-info">
        <input type="text" value="${person.name}" onchange="updatePersonName(${index}, this.value)">
        <div class="role-edit">
          ${['領詩', '司琴', '鼓手', '結他手', '低音結他手', '和唱'].map(role => `
            <div class="role-limit-group">
              <label>
                <input type="checkbox" value="${role}" 
                  ${person.roles.includes(role) ? 'checked' : ''}
                  onchange="updatePersonRole(${index}, '${role}', this.checked)">
                ${role}
              </label>
              ${person.roles.includes(role) ? `
                <input type="number" 
                  value="${person.serviceLimits?.[role] || 4}" 
                  min="1" max="10"
                  onchange="updateServiceLimit(${index}, '${role}', this.value)"
                  class="service-limit-input"
                  title="設定每月最多服侍次數"
                  placeholder="每月限制"
                >
              ` : ''}
            </div>
          `).join('')}
        </div>
        <div class="date-ranges">
          ${person.unavailableDateRanges.map((range, rangeIndex) => `
            <div class="date-range-item">
              ${range.start} 至 ${range.end}
              <button onclick="removePersonDateRange(${index}, ${rangeIndex})">刪除</button>
            </div>
          `).join('')}
          <input type="date" id="new-date-start-${index}" placeholder="開始日期">
          <input type="date" id="new-date-end-${index}" placeholder="結束日期">
          <button onclick="addPersonDateRange(${index})">新增日期範圍</button>
        </div>
      </div>
      <div class="person-actions">
        <button onclick="savePersonSettings(${index})" class="save-btn">儲存設定</button>
        <button onclick="removePerson(${index})">刪除</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function updatePersonName(index, newName) {
  personnel[index].name = newName;
  updatePersonnelSelects();
}

function updatePersonRole(index, role, checked) {
  if (checked && !personnel[index].roles.includes(role)) {
    personnel[index].roles.push(role);
    personnel[index].serviceLimits = personnel[index].serviceLimits || {};
    personnel[index].serviceLimits[role] = 4; // Default limit
  } else if (!checked) {
    personnel[index].roles = personnel[index].roles.filter(r => r !== role);
    delete personnel[index].serviceLimits[role];
  }
  saveToLocalStorage();
  updatePersonnelList();
}

function updateServiceLimit(index, role, value) {
  personnel[index].serviceLimits = personnel[index].serviceLimits || {};
  personnel[index].serviceLimits[role] = parseInt(value) || 4;
}

function addPersonDateRange(index) {
  const startInput = document.getElementById(`new-date-start-${index}`);
  const endInput = document.getElementById(`new-date-end-${index}`);

  if (startInput.value && endInput.value) {
    personnel[index].unavailableDateRanges = personnel[index].unavailableDateRanges || [];
    personnel[index].unavailableDateRanges.push({
      start: startInput.value,
      end: endInput.value
    });
    saveToLocalStorage();
    updatePersonnelList();
  }
}

function savePersonSettings(index) {
  saveToLocalStorage();
  alert(`已儲存 ${personnel[index].name} 的設定`);
}

function removePersonDateRange(personIndex, rangeIndex) {
  personnel[personIndex].unavailableDateRanges.splice(rangeIndex, 1);
  updatePersonnelList();
}

function removePerson(index) {
  personnel.splice(index, 1);
  updatePersonnelList();
  updatePersonnelSelects();
}

function updatePersonnelSelects() {
  ['person-a', 'person-b', 'person-c', 'person-d'].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">選擇人員</option>' +
      personnel.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
  });
}

// Constraints management
function addConstraint(type) {
  const person1 = type === 'cannot' ? 
    document.getElementById('person-a').value :
    document.getElementById('person-c').value;
  const person2 = type === 'cannot' ? 
    document.getElementById('person-b').value :
    document.getElementById('person-d').value;

  if (!person1 || !person2) {
    alert('請選擇兩個人員');
    return;
  }

  constraints.push({ type, person1, person2 });
  updateConstraintsList();
}

function updateConstraintsList() {
  const list = document.getElementById('constraints-list');
  list.innerHTML = '';
  constraints.forEach((constraint, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p>${constraint.person1} ${constraint.type === 'cannot' ? '不能' : '希望'}和 
      ${constraint.person2} 一起服侍
      <button onclick="removeConstraint(${index})">刪除</button></p>
    `;
    list.appendChild(div);
  });
}

function removeConstraint(index) {
  constraints.splice(index, 1);
  updateConstraintsList();
}

function savePreferences() {
  saveToLocalStorage();
  alert('偏好設定已儲存');
}

// Roster generation
function generateRoster() {
  const startDate = new Date(document.getElementById('start-date').value);
  const endDate = new Date(document.getElementById('end-date').value);
  if (!startDate.getTime() || !endDate.getTime()) {
    alert('請選擇開始和結束日期');
    return;
  }

  roster = [];
  const roles = ['領詩', '司琴', '鼓手', '結他手', '低音結他手', '和唱'];
  const serviceCount = new Map(); // Track monthly service count for each person
  const recentAssignments = new Map(); // Track recent assignments for each person

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() === 0) { // Check if it's Sunday
      const date = new Date(currentDate);
    const dateStr = date.toISOString().split('T')[0];

    const assignment = {
      date: dateStr,
      roles: {}
    };

    roles.forEach(role => {
      const available = personnel.filter(p => 
        p.roles.includes(role) && 
        !p.unavailableDateRanges.some(range => isDateInRange(dateStr, range)) &&
        (!recentAssignments.has(p.name) || 
         (date - recentAssignments.get(p.name)) / (1000 * 60 * 60 * 24) >= 14) // At least 14 days gap
      );

      if (available.length > 0) {
        const selectedPerson = available[Math.floor(Math.random() * available.length)];
        assignment.roles[role] = selectedPerson.name;
        recentAssignments.set(selectedPerson.name, date.getTime());
      } else {
        // If no one available without recent service, try without the recency check
        const allAvailable = personnel.filter(p => 
          p.roles.includes(role) && 
          !p.unavailableDateRanges.some(range => isDateInRange(dateStr, range))
        );
        assignment.roles[role] = allAvailable.length > 0 ? 
          allAvailable[Math.floor(Math.random() * allAvailable.length)].name : '(空)';
      }
    });

    roster.push(assignment);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  document.getElementById('roster-table').innerHTML = `
    <h3>輪值期間: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</h3>
    <table>
      <tr>
        <th>日期</th>
        <th>領詩</th>
        <th>司琴</th>
        <th>鼓手</th>
        <th>結他手</th>
        <th>低音結他手</th>
        <th>和唱</th>
      </tr>
      ${roster.map(week => `
        <tr>
          <td>${week.date}</td>
          <td>${week.roles['領詩']}</td>
          <td>${week.roles['司琴']}</td>
          <td>${week.roles['鼓手']}</td>
          <td>${week.roles['結他手']}</td>
          <td>${week.roles['低音結他手']}</td>
          <td>${week.roles['和唱']}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function displayRoster() {
  const table = document.getElementById('roster-table');
  table.innerHTML = `
    <table>
      <tr>
        <th>日期</th>
        <th>領詩</th>
        <th>司琴</th>
        <th>鼓手</th>
        <th>結他手</th>
        <th>低音結他手</th>
        <th>和唱</th>
      </tr>
      ${roster.map(week => `
        <tr>
          <td>${week.date}</td>
          <td>${week.roles['領詩']}</td>
          <td>${week.roles['司琴']}</td>
          <td>${week.roles['鼓手']}</td>
          <td>${week.roles['結他手']}</td>
          <td>${week.roles['低音結他手']}</td>
          <td>${week.roles['和唱']}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function exportRoster() {
  // Create CSV content
  const csvContent = "data:text/csv;charset=utf-8," + 
    "日期,領詩,司琴,鼓手,結他手,低音結他手,和唱\n" +
    roster.map(week => 
      `${week.date},${week.roles['領詩']},${week.roles['司琴']},${week.roles['鼓手']},` +
      `${week.roles['結他手']},${week.roles['低音結他手']},${week.roles['和唱']}`
    ).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "輪值表.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}