const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

const savePath = path.join(__dirname, 'tasks.json');

loadTasks();

document.getElementById('taskInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTask();
  }
});

document.getElementById('closeBtn').addEventListener('click', () => {
  ipcRenderer.send('close-window');
});

function addTask(text) {
  const input = document.getElementById('taskInput');
  const taskText = text || input.value.trim();
  if (!taskText) return;

  if (!text) input.value = '';

  const taskList = document.getElementById('taskList');
  const li = document.createElement('li');

  const circle = document.createElement('div');
  circle.className = 'circle';
  circle.onclick = () => {
    const completed = li.classList.toggle('completed');
  
    if (completed) {
      circle.textContent = '✓';
      circle.style.color = 'blue';
      circle.style.border = 'none';
      circle.style.fontSize = '23px';
    } else {
      circle.textContent = '';
      circle.style.backgroundColor = '';
      circle.style.border = '2px solid #666';
    }
  
    saveTasks();
  };

  const span = document.createElement('span');
  span.textContent = taskText;

  const delBtn = document.createElement('button');
  delBtn.textContent = '🗑️';
  delBtn.className = 'delete-btn';
  delBtn.onclick = () => {
    li.classList.add('fade-out');
    setTimeout(() => {
      li.remove();
      saveTasks();
    }, 500);
  };

  li.appendChild(circle);
  li.appendChild(span);
  li.appendChild(delBtn);
  taskList.appendChild(li);

  saveTasks();
}


function saveTasks() {
  const tasks = [];
  document.querySelectorAll('#taskList li').forEach(li => {
    const text = li.querySelector('span').textContent.trim();
    const done = li.classList.contains('completed');
    tasks.push({ text, done });
  });

  fs.writeFileSync(savePath, JSON.stringify(tasks, null, 2), 'utf-8');
}

function loadTasks() {
  if (!fs.existsSync(savePath)) return;

  try {
    const data = fs.readFileSync(savePath, 'utf-8');
    const saved = JSON.parse(data);
    saved.forEach(task => {
      addTask(task.text);
      if (task.done) {
        const lastLi = document.querySelectorAll('#taskList li:last-child')[0];
        const circle = lastLi.querySelector('.circle');
        lastLi.classList.add('completed');
        circle.textContent = '✓';
        circle.style.color = 'blue';
        circle.style.border = 'none';
        circle.style.fontSize = '23px';
      }      
    });
  } catch (err) {
    console.error('读取任务失败:', err);
  }
}
