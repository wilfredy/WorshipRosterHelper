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
    // Filter out default people that already exist
    const existingNames = personnel.map(p => p.name);
    const newPeople = defaultPeople.filter(p => !existingNames.includes(p.name));
    
    // Merge new people with existing ones
    personnel = [...personnel, ...newPeople];
    saveToLocalStorage();
    updatePersonnelList();
    updatePersonnelSelects();
  }
}

function exportToCsv() {
  // Export personnel data
  let csvContent = "##人員資料##\n姓名,角色,不可用日期範圍,服侍次數限制\n";
  personnel.forEach(person => {
    const roles = person.roles.join('|');
    const dates = (person.unavailableDateRanges || [])
      .map(range => `${range.start}至${range.end}`)
      .join('|');
    
    // 处理服侍次数限制
    const serviceLimitsStr = person.roles
      .map(role => `${role}:${person.serviceLimits?.[role] || 4}`)
      .join('|');
    
    csvContent += `${person.name},${roles},${dates},${serviceLimitsStr}\n`;
  });
  
  // Export constraints data
  csvContent += "\n##限制與偏好##\n類型,人員1,人員2\n";
  constraints.forEach(constraint => {
    csvContent += `${constraint.type},${constraint.person1},${constraint.person2}\n`;
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
        console.log("CSV 原始内容:", e.target.result);
        const content = e.target.result;
        
        // 分割内容为行
        const lines = content.split('\n');
        console.log("总行数:", lines.length);
        
        // 找到人员数据部分
        let personnelStartIndex = -1;
        let constraintsStartIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('##人員資料##')) {
            personnelStartIndex = i;
          } else if (lines[i].includes('##限制與偏好##')) {
            constraintsStartIndex = i;
          }
        }
        
        console.log("人员数据开始行:", personnelStartIndex);
        console.log("约束数据开始行:", constraintsStartIndex);
        
        if (personnelStartIndex === -1) {
          alert('CSV 格式錯誤：找不到人員資料部分');
          return;
        }
        
        // 处理人员数据
        const tempPersonnel = [];
        // 从标题行的下一行开始处理
        for (let i = personnelStartIndex + 2; i < (constraintsStartIndex !== -1 ? constraintsStartIndex : lines.length); i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          console.log(`处理人员行 ${i}:`, line);
          
          const columns = line.split(',');
          if (columns.length < 2) continue;
          
          const name = columns[0].trim();
          if (!name) continue;
          
          const roles = columns[1].split('|').filter(r => r.trim());
          
          // 处理不可用日期
          const unavailableDateRanges = [];
          if (columns.length > 2 && columns[2].trim()) {
            const dateRanges = columns[2].split('|');
            for (const range of dateRanges) {
              if (!range.trim()) continue;
              const [start, end] = range.split('至');
              if (start && end) {
                unavailableDateRanges.push({
                  start: start.trim(),
                  end: end.trim()
                });
              }
            }
          }
          
          // 处理服侍次数限制
          const serviceLimits = {};
          if (columns.length > 3 && columns[3].trim()) {
            const limits = columns[3].split('|');
            for (const limit of limits) {
              const [role, count] = limit.split(':');
              if (role && count) {
                serviceLimits[role.trim()] = parseInt(count.trim()) || 4;
              }
            }
          } else {
            // 默认限制
            for (const role of roles) {
              serviceLimits[role] = 4;
            }
          }
          
          tempPersonnel.push({
            name,
            roles,
            unavailableDateRanges,
            serviceLimits
          });
          
          console.log("添加人员:", { name, roles, unavailableDateRanges, serviceLimits });
        }
        
        console.log("解析后的人员:", tempPersonnel);
        
        // 处理约束数据
        const tempConstraints = [];
        if (constraintsStartIndex !== -1) {
          // 从标题行的下一行开始处理
          for (let i = constraintsStartIndex + 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            console.log(`处理约束行 ${i}:`, line);
            
            const columns = line.split(',');
            if (columns.length < 3) continue;
            
            const type = columns[0].trim();
            const person1 = columns[1].trim();
            const person2 = columns[2].trim();
            
            if (type && person1 && person2) {
              tempConstraints.push({ type, person1, person2 });
              console.log("添加约束:", { type, person1, person2 });
            }
          }
        }
        
        console.log("解析后的约束:", tempConstraints);
        
        if (tempPersonnel.length === 0) {
          alert('未能解析到任何人員數據，請檢查 CSV 格式');
          return;
        }
        
        // 更新全局数据
        personnel = tempPersonnel;
        constraints = tempConstraints;
        
        saveToLocalStorage();
        updatePersonnelList();
        updatePersonnelSelects();
        updateConstraintsList();
        
        alert(`數據導入成功！共導入 ${personnel.length} 名人員和 ${constraints.length} 條限制`);
      } catch (error) {
        alert('導入失敗：' + error.message);
        console.error("CSV导入错误:", error);
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
  hasUnsavedChanges = {}; // Reset unsaved changes on list update
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
                  title="設定每季最多服侍次數"
                  placeholder="每季限制"
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

let hasUnsavedChanges = {};

function setUnsavedChanges(index, value) {
  hasUnsavedChanges[index] = value;
  const personItem = document.querySelector(`.person-item:nth-child(${index + 1})`);
  if (personItem) {
    const saveBtn = personItem.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.style.display = value ? 'inline-block' : 'none';
      saveBtn.title = value ? '有未儲存的變更' : '';
    }
  }
}

function updatePersonName(index, newName) {
  personnel[index].name = newName;
  setUnsavedChanges(index, true);
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
  setUnsavedChanges(index, true);
  saveToLocalStorage();
  updatePersonnelList();
}

function updateServiceLimit(index, role, value) {
  personnel[index].serviceLimits = personnel[index].serviceLimits || {};
  personnel[index].serviceLimits[role] = parseInt(value) || 4;
  setUnsavedChanges(index, true);
  updatePersonnelList();
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
    setUnsavedChanges(index, true);
    updatePersonnelList();
  }
}

function savePersonSettings(index) {
  saveToLocalStorage();
  setUnsavedChanges(index, false);
  alert(`已儲存 ${personnel[index].name} 的設定`);
}

function removePersonDateRange(personIndex, rangeIndex) {
  personnel[personIndex].unavailableDateRanges.splice(rangeIndex, 1);
  setUnsavedChanges(personIndex, true);
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
  const serviceCount = new Map();
  const totalServiceCount = new Map();
  const recentAssignments = new Map();
  const preferredPairs = new Map();

  // Initialize counts and preferred pairs
  personnel.forEach(person => {
    Object.keys(person.serviceLimits || {}).forEach(role => {
      serviceCount.set(`${person.name}-${role}`, 0);
    });
    totalServiceCount.set(person.name, 0);
    
    // Build preferred pairs map
    constraints.forEach(c => {
      if (c.type === 'prefer' && (c.person1 === person.name || c.person2 === person.name)) {
        const pair = c.person1 === person.name ? c.person2 : c.person1;
        if (!preferredPairs.has(person.name)) {
          preferredPairs.set(person.name, []);
        }
        preferredPairs.get(person.name).push(pair);
      }
    });
  });

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const currentQuarter = Math.floor(currentDate.getMonth() / 3);
    const startQuarter = Math.floor(startDate.getMonth() / 3);
    if (currentQuarter !== startQuarter) {
      personnel.forEach(person => {
        Object.keys(person.serviceLimits || {}).forEach(role => {
          serviceCount.set(`${person.name}-${role}`, 0);
        });
      });
    }

    if (currentDate.getDay() === 0) { // Check if it's Sunday
      const date = new Date(currentDate);
    const dateStr = date.toISOString().split('T')[0];

    const assignment = {
      date: dateStr,
      roles: {}
    };

    // First, check for cannot-serve-together constraints
    const cannotServeTogether = new Set();
    constraints.forEach(c => {
      if (c.type === 'cannot') {
        cannotServeTogether.add(`${c.person1}-${c.person2}`);
        cannotServeTogether.add(`${c.person2}-${c.person1}`);
      }
    });

    // Function to check if two people can serve together
    const canServeTogether = (person1, person2) => {
      return !cannotServeTogether.has(`${person1}-${person2}`);
    };

    // Function to get preferred pair score
    const getPreferredScore = (person, assignedPeople) => {
      if (!preferredPairs.has(person)) return 0;
      return preferredPairs.get(person).filter(pair => assignedPeople.includes(pair)).length;
    };

    const assignedPeople = new Set();
    
    roles.forEach(role => {
      let available = personnel.filter(p => 
        p.roles.includes(role) && 
        !p.unavailableDateRanges.some(range => isDateInRange(dateStr, range)) &&
        (!recentAssignments.has(p.name) || 
         (date - recentAssignments.get(p.name)) / (1000 * 60 * 60 * 24) >= 14) &&
        (!p.serviceLimits?.[role] || serviceCount.get(`${p.name}-${role}`) < p.serviceLimits[role]) &&
        Array.from(assignedPeople).every(assigned => canServeTogether(p.name, assigned))
      );

      if (available.length > 0) {
        // Sort by preferred pairs first, then by service count
        available.sort((a, b) => {
          const prefScoreA = getPreferredScore(a.name, Array.from(assignedPeople));
          const prefScoreB = getPreferredScore(b.name, Array.from(assignedPeople));
          if (prefScoreB !== prefScoreA) return prefScoreB - prefScoreA;
          return (totalServiceCount.get(a.name) || 0) - (totalServiceCount.get(b.name) || 0);
        });
        
        const selectedPerson = available[0];
        assignment.roles[role] = selectedPerson.name;
        assignedPeople.add(selectedPerson.name);
        recentAssignments.set(selectedPerson.name, date.getTime());
        serviceCount.set(`${selectedPerson.name}-${role}`, (serviceCount.get(`${selectedPerson.name}-${role}`) || 0) + 1);
        totalServiceCount.set(selectedPerson.name, (totalServiceCount.get(selectedPerson.name) || 0) + 1);
      } else {
        const allAvailable = personnel.filter(p => 
          p.roles.includes(role) && 
          !p.unavailableDateRanges.some(range => isDateInRange(dateStr, range)) &&
          Array.from(assignedPeople).every(assigned => canServeTogether(p.name, assigned))
        );
        if (allAvailable.length > 0) {
          const selected = allAvailable[Math.floor(Math.random() * allAvailable.length)];
          assignment.roles[role] = selected.name;
          assignedPeople.add(selected.name);
        } else {
          assignment.roles[role] = '(空)';
        }
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