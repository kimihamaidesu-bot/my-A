// ページを開いたときに、あなただけの「マイユーザーID」をランダムで作る
const myUniqueId = "user_" + Math.random().toString(36).substring(2, 9);
document.getElementById("my-user-id").value = myUniqueId;

// アップロードされたカスタム画像を一時保存する変数
let myCustomIconUrl = "";

// ローカルストレージからデータを読み込む仕組み
let rooms = [];
let blockedUsers = [];

if (localStorage.getItem("chat_rooms")) {
  rooms = JSON.parse(localStorage.getItem("chat_rooms"));
} else {
  rooms = [
    { id: "r1", name: "ロビー", messages: [] },
    { id: "r2", name: "雑談部屋", messages: [] }
  ];
}

if (localStorage.getItem("chat_blocked_users")) {
  blockedUsers = JSON.parse(localStorage.getItem("chat_blocked_users"));
}

let currentRoomId = "r1";
let lastRenameTime = 0;
let isAdminUser = false; // 現在、管理者にログインしているかどうか
const MAX_CHARS = 200; // 上限を200文字に変更！

// データをパソコンに保存する関数
function saveData() {
  localStorage.setItem("chat_rooms", JSON.stringify(rooms));
  localStorage.setItem("chat_blocked_users", JSON.stringify(blockedUsers));
}

// チャットした人の人数やメッセージ数を集計する関数
function updateAdminStats() {
  const adminPanel = document.getElementById("admin-panel");
  if (!isAdminUser) {
    adminPanel.style.display = "none";
    return;
  }
  adminPanel.style.display = "block";

  const allChatters = new Set();
  let totalMessages = 0;
  
  rooms.forEach(room => {
    room.messages.forEach(msg => {
      allChatters.add(msg.userId);
      totalMessages++;
    });
  });

  const currentRoom = rooms.find(r => r.id === currentRoomId);
  const currentRoomChatters = new Set();
  if (currentRoom) {
    currentRoom.messages.forEach(msg => {
      currentRoomChatters.add(msg.userId);
    });
  }

  const tbody = document.getElementById("stats-tbody");
  tbody.innerHTML = `
    <tr>
      <td>💬 サイト全体の合計メッセージ数</td>
      <td><strong>${totalMessages}</strong> 件</td>
    </tr>
    <tr>
      <td>👥 サイト全体でチャットした人の合計人数</td>
      <td><strong>${allChatters.size}</strong> 人</td>
    </tr>
    <tr>
      <td>🚪 この部屋（${currentRoom ? currentRoom.name : ''}）でチャットした人数</td>
      <td><strong>${currentRoomChatters.size}</strong> 人</td>
    </tr>
    <tr>
      <td>🚫 ブロック中のユーザー数</td>
      <td><strong>${blockedUsers.length}</strong> 人</td>
    </tr>
  `;
}

// 画面を更新するメインの関数
function render() {
  // 1. 部屋リストの表示
  const roomList = document.getElementById("room-list");
  roomList.innerHTML = "";
  rooms.forEach(room => {
    const li = document.createElement("li");
    li.innerText = room.name;
    if (room.id === currentRoomId) li.classList.add("active");
    li.onclick = () => { currentRoomId = room.id; render(); };
    roomList.appendChild(li);
  });

  // 2. 現在の部屋名の表示
  const currentRoom = rooms.find(r => r.id === currentRoomId);
  if (!currentRoom) {
    if (rooms.length > 0) {
      currentRoomId = rooms.id;
      render();
    }
    return;
  }
  document.getElementById("current-room-name").innerText = currentRoom.name;

  // 3. メッセージの表示
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  
  currentRoom.messages.forEach(msg => {
    if (blockedUsers.includes(msg.sender)) return;

    const div = document.createElement("div");
    div.classList.add("msg-item");

    const isMyMsg = (msg.userId === myUniqueId);
    if (isMyMsg) {
      div.classList.add("my-msg");
    }

    const nameClass = msg.isAdmin ? "admin-name" : "";
    
    let iconHtml = `<span>${msg.icon}</span>`;
    if (msg.isCustomIcon) {
      iconHtml = `<img src="${msg.icon}" class="chat-custom-icon" alt="icon">`;
    }
    
    let deleteBtnHtml = "";
    if (isMyMsg || isAdminUser) {
      deleteBtnHtml = `<button class="del-btn" onclick="deleteMessage('${msg.id}')">削除</button>`;
    }
    
    div.innerHTML = `
      <div class="msg-header">
        ${iconHtml}
        <span class="${nameClass}">${msg.sender}</span>
        <span style="color:#aaa; font-weight:normal;"> (${msg.time})</span>
        ${deleteBtnHtml}
        <button class="block-btn" onclick="blockUser('${msg.sender}')">ブロック</button>
      </div>
      <div class="msg-body">${msg.text}</div>
    `;
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;

  updateAdminStats();
}

// 文字入力をリアルタイムで数える仕組み
document.getElementById("message-input").oninput = function(e) {
  const currentLength = e.target.value.length;
  const countDisplay = document.getElementById("char-count");
  
  countDisplay.innerText = `${currentLength} / ${MAX_CHARS}`;
  
  if (currentLength > MAX_CHARS) {
    countDisplay.style.color = "#fa5252";
  } else {
    countDisplay.style.color = "#aaa";
  }
};

// アイコンの選択肢が変わったときの処理
document.getElementById("user-icon").onchange = function(e) {
  if (e.target.value === "CUSTOM") {
    document.getElementById("icon-file-input").click();
  }
};

// 実際に写真ファイルが選ばれたときの処理
document.getElementById("icon-file-input").onchange = function(e) {
  const file = e.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    myCustomIconUrl = event.target.result;
    alert("写真の読み込みに成功しました！");
  };
  reader.readAsDataURL(file);
};

// 管理者チェックボックスがクリックされたときの処理
document.getElementById("admin-mode").onchange = function(e) {
  if (e.target.checked) {
    const password = prompt("管理者パスワードを入力してください：");
    if (password === "2525kumasann") {
      alert("管理者認証に成功しました！💛");
      isAdminUser = true;
    } else {
      alert("パスワードが違います！一回一般ユーザーに戻ります。");
      e.target.checked = false;
      isAdminUser = false;
    }
  } else {
    isAdminUser = false;
    alert("管理者モードをオフにしました。");
  }
  render();
};

// メッセージ送信機能
document.getElementById("send-btn").onclick = sendMessage;
document.getElementById("message-input").onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };

function sendMessage() {
  const name = document.getElementById("user-name").value.trim() || "名無し";
  
  if (blockedUsers.includes(name)) {
    alert("あなたはブロックされているため、機能が使えません。");
    return;
  }

  const text = document.getElementById("message-input").value;
  if (!text.trim()) return;

  if (text.length > MAX_CHARS) {
    alert(`エラー：メッセージが長すぎます！${MAX_CHARS}文字以内で入力してください。`);
    return;
  }

  const iconSelect = document.getElementById("user-icon").value;
  let finalIcon = iconSelect;
  let isCustom = false;

  if (iconSelect === "CUSTOM") {
    if (myCustomIconUrl) {
      finalIcon = myCustomIconUrl;
      isCustom = true;
    } else {
      finalIcon = "👤";
    }
  }

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  const currentRoom = rooms.find(r => r.id === currentRoomId);
  currentRoom.messages.push({
    id: "m_" + Date.now(),
    userId: myUniqueId,
    sender: name,
    text: text,
    icon: finalIcon,
    isCustomIcon: isCustom,
    isAdmin: isAdminUser,
    time: timeStr
  });

  document.getElementById("message-input").value = "";
  document.getElementById("char-count").innerText = `0 / ${MAX_CHARS}`;
  document.getElementById("char-count").style.color = "#aaa";
  
  saveData();
  render();
}

// コメント削除機能
window.deleteMessage = function(msgId) {
  const currentRoom = rooms.find(r => r.id === currentRoomId);
  currentRoom.messages = currentRoom.messages.filter(m => m.id !== msgId);
  saveData();
  render();
};

// 部屋追加機能
document.getElementById("add-room-btn").onclick = () => {
  const name = prompt("新しい部屋の名前を入力してください：");
  if (!name) return;
  const newId = "r_" + Date.now();
  rooms.push({ id: newId, name: name, messages: [] });
  currentRoomId = newId;
  saveData();
  render();
};

// 部屋名前変更機能
document.getElementById("rename-room-btn").onclick = () => {
  const now = Date.now();
  if (now - lastRenameTime < 10000) {
    alert("短時間に何度も部屋名を変更することはできません！少し待ってください。");
    return;
  }

  const currentRoom = rooms.find(r => r.id === currentRoomId);
  const newName = prompt("新しい部屋名：", currentRoom.name);
  if (newName) {
    currentRoom.name = newName;
    lastRenameTime = now;
    saveData();
    render();
  }
};

// 部屋削除機能
document.getElementById("delete-room-btn").onclick = () => {
  if (rooms.length <= 1) {
    alert("最後の1部屋は削除できません。");
    return;
  }
  if (confirm("本当にこの部屋を削除しますか？")) {
    rooms = rooms.filter(r => r.id !== currentRoomId);
    currentRoomId = rooms.id;
    saveData();
    render();
  }
};

// ブロック機能
window.blockUser = function(username) {
  if (confirm(`${username} さんをブロックしますか？チャットが非表示になり、発言できなくなります。`)) {
    blockedUsers.push(username);
    saveData();
    render();
  }
};

// 最初に画面を動かす
render();