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

const pinBtn = document.getElementById('pinBtn');
let isPinned = false;

if (pinBtn) {
  const updatePinVisual = () => {
    pinBtn.classList.toggle('active', isPinned);
    pinBtn.textContent = isPinned ? '📌' : '📍';
    pinBtn.title = isPinned ? '取消固定' : '固定在最前';
  };

  updatePinVisual();

  ipcRenderer
    .invoke('get-pin-state')
    .then(state => {
      isPinned = Boolean(state);
      updatePinVisual();
    })
    .catch(err => {
      console.error('获取置顶状态失败:', err);
    });

  pinBtn.addEventListener('click', async () => {
    try {
      isPinned = await ipcRenderer.invoke('toggle-pin');
      updatePinVisual();
    } catch (err) {
      console.error('切换置顶失败:', err);
    }
  });
}

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
  // span.textContent = taskText;

  const urlRegex = /\b((?:https?:\/\/)?(?:www\.)?(?:[\w-]+(?:\.[\w-]+)+|localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d{1,5})?(?:[\/\w#?=&%.,-]*)?)/gi;

  let lastIndex = 0;
  let match;
  while ((match = urlRegex.exec(taskText)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      span.appendChild(document.createTextNode(taskText.slice(lastIndex, match.index)));
    }

    const rawUrl = match[0];
    const hasProtocol = /^https?:\/\//i.test(rawUrl);
    const href = hasProtocol ? rawUrl : `https://${rawUrl}`;

    const link = document.createElement('a');
    link.href = href;
    link.textContent = rawUrl;
    link.style.color = '#1a0dab';
    link.style.textDecoration = 'underline';
    link.target = '_blank';
    link.classList.add('task-link');

    span.appendChild(link);
    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < taskText.length) {
    span.appendChild(document.createTextNode(taskText.slice(lastIndex)));
  }

  span.ondblclick = () => {
    if (li.querySelector('input.editing')) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = span.textContent;
    input.className = 'editing';
    input.style.flexGrow = '1';
    input.style.fontSize = 'inherit';
    input.style.border = '1px solid #ccc';
    input.style.padding = '4px';
    input.style.marginRight = '8px';
    input.style.border = 'none';
    input.style.borderBottom = '1px solid #ccc';
    input.style.outline = 'none';
  
    span.replaceWith(input);
    input.focus();
  
    const finishEdit = () => {
      const newText = input.value.trim();
      if (newText && newText !== span.textContent) {
        span.textContent = newText;
        saveTasks();
      }
      input.replaceWith(span);
    };
  
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        finishEdit();
      } else if (e.key === 'Escape') {
        input.replaceWith(span);
      }
    });
  
    input.addEventListener('blur', () => {
      // 确保 blur 后不会再触发额外 click
      setTimeout(finishEdit, 10);
    });
  };

  const delBtn = document.createElement('button');
  delBtn.textContent = '⊗';
  delBtn.style.fontSize = '23px';
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

window.addEventListener('DOMContentLoaded', () => {
  const taskList = document.getElementById('taskList');
  new Sortable(taskList, {
    animation: 150,
    delay: 400,
    delayOnTouchOnly: false,
    touchStartThreshold: 5,
    onEnd: () => {
      saveTasks();
    }
  });
});

const { shell } = require('electron');

document.addEventListener('click', e => {
  if (e.target.tagName === 'A' && e.target.classList.contains('task-link')) {
    e.preventDefault();
    shell.openExternal(e.target.href);
  }
});
