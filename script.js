
// Data storage
let personnel = [];
let constraints = [];
let roster = [];
let tempUnavailableDates = [];

function addUnavailableDate() {
  const date = document.getElementById('unavailable-date').value;
  if (date) {
    tempUnavailableDates.push(date);
    updateUnavailableDates();
  }
}

function updateUnavailableDates() {
  const container = document.getElementById('unavailable-dates');
  container.innerHTML = tempUnavailableDates.map((date, index) => 
    `<div>${date} <button onclick="removeUnavailableDate(${index})">刪除</button></div>`
  ).join('');
}

function removeUnavailableDate(index) {
  tempUnavailableDates.splice(index, 1);
  updateUnavailableDates();
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
  const unavailableDates = tempUnavailableDates || [];
  
  if (roles.length === 0) {
    alert('請選擇至少一個角色');
    return;
  }
  
  personnel.push({ name, roles, unavailableDates });
  tempUnavailableDates = [];
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
    div.innerHTML = `
      <p>${person.name} - ${person.roles.join(', ')}
      <button onclick="removePerson(${index})">刪除</button></p>
    `;
    list.appendChild(div);
  });
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

// Roster generation
function generateRoster() {
  const startDate = new Date(document.getElementById('start-date').value);
  if (!startDate.getTime()) {
    alert('請選擇開始日期');
    return;
  }
  
  roster = [];
  const roles = ['領詩', '司琴', '鼓手', '結他手', '低音結他手', '和唱'];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 21); // 4 weeks from start
  
  for (let i = 0; i < 4; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 7);
    const dateStr = date.toISOString().split('T')[0];
    
    const assignment = {
      date: dateStr,
      roles: {}
    };
    
    roles.forEach(role => {
      const available = personnel.filter(p => 
        p.roles.includes(role) && 
        !p.unavailableDates.includes(dateStr)
      );
      if (available.length > 0) {
        assignment.roles[role] = available[Math.floor(Math.random() * available.length)].name;
      } else {
        assignment.roles[role] = '(空)';
      }
    });
    
    roster.push(assignment);
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
