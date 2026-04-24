<template>
  <div class="draw-guess-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">多人实时小游戏</p>
        <h1>你画我猜</h1>
        <p class="lead">最多 5 人联机，轮流作画猜词，房间内通过 WebSocket 实时同步。</p>
      </div>
      <router-link to="/tools" class="back-link">返回工具栏</router-link>
    </header>

    <section v-if="!session.roomId" class="entry-panel">
      <div class="entry-shell">
        <div class="entry-card profile-card">
          <div class="profile-head">
            <div class="profile-avatar-frame">
              <img :src="selectedAvatarOption.src" :alt="selectedAvatarOption.label" class="profile-avatar-preview" />
            </div>
            <div class="profile-copy-block">
              <p class="profile-kicker">玩家资料</p>
              <h2>选择你的头像与昵称</h2>
              <p class="profile-copy">房间内会同步显示昵称和头像，系统内置 10 个 3D 彩色卡通头像。</p>
            </div>
          </div>

          <div class="avatar-picker">
            <button
              v-for="avatar in avatarOptions"
              :key="avatar.id"
              type="button"
              class="avatar-option"
              :class="{ active: selectedAvatar === avatar.id }"
              @click="selectedAvatar = avatar.id"
            >
              <img :src="avatar.src" :alt="avatar.label" />
            </button>
          </div>

          <div class="entry-field compact-inline">
            <div class="entry-field-icon subtle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 12.25C14.8995 12.25 17.25 9.89949 17.25 7C17.25 4.10051 14.8995 1.75 12 1.75C9.10051 1.75 6.75 4.10051 6.75 7C6.75 9.89949 9.10051 12.25 12 12.25Z" stroke="currentColor" stroke-width="1.8"/>
                <path d="M3.75 21C3.75 16.9969 7.99694 13.75 12 13.75C16.0031 13.75 20.25 16.9969 20.25 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <label class="entry-field-label compact">昵称</label>
            <input v-model.trim="playerName" class="entry-input entry-input-hero compact" maxlength="16" placeholder="例如：夜航者" />
          </div>
        </div>

        <div class="entry-card action-card">
          <div class="entry-block">
            <h2>创建房间</h2>
            <p>你会成为房主，至少 2 人就能开局，系统会自动轮换作画顺序。</p>
            <button class="primary-btn" :disabled="busy" @click="handleCreateRoom">{{ busy ? '处理中...' : '创建房间' }}</button>
          </div>
          <div class="entry-block">
            <h2>加入房间</h2>
            <p>输入 6 位房间码，和朋友一起开画。</p>
            <div class="entry-field compact-inline">
              <div class="entry-field-icon subtle" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="6" width="16" height="12" rx="4" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M8.5 12H15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <label class="entry-field-label compact">房间码</label>
              <input v-model.trim="joinRoomCode" class="entry-input entry-input-hero small" maxlength="6" placeholder="输入 6 位房间码" />
            </div>
            <button class="primary-btn ghost" :disabled="busy" @click="handleJoinRoom">加入房间</button>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="room-shell">
      <aside class="room-side">
        <div class="paper-card side-card">
          <div class="room-meta-head">
            <div>
              <p class="room-code-label">房间码</p>
              <strong class="room-code">{{ session.roomId }}</strong>
            </div>
            <button class="copy-btn" @click="copyRoomCode">复制</button>
          </div>
          <div class="status-line">
            <span class="status-pill" :class="room.status">{{ statusText }}</span>
            <span class="status-extra">第 {{ room.round || 0 }} 轮</span>
          </div>
          <div class="prompt-card" :class="{ drawer: isDrawer }">
            <span class="prompt-label">{{ isDrawer ? '你的词语' : '猜词提示' }}</span>
            <strong>{{ room.word_display || '等待系统出题' }}</strong>
            <p>
              {{ isDrawer ? '用图形表达，不要直接写字。尽量让线条简洁，别人会更容易猜到。' : '观察画布与聊天记录，随时输入你的答案，猜中会立即结算积分。' }}
            </p>
          </div>
          <div class="meta-grid">
            <p class="word-line">
              <span>当前画手</span>
              <strong>{{ room.current_drawer_name || '等待中' }}</strong>
            </p>
            <p class="word-line">
              <span>倒计时</span>
              <strong>{{ displayRemainingSeconds }} 秒</strong>
            </p>
          </div>
          <div class="room-actions">
            <button
              v-if="isHost"
              class="primary-btn"
              :disabled="!canStartGame"
              @click="handleStartGame"
            >
              {{ room.status === 'playing' ? '游戏进行中' : '开始游戏' }}
            </button>
            <button class="secondary-btn" @click="handleLeaveRoom">离开房间</button>
          </div>
          <p class="system-tip">{{ room.last_system_message || socketHint }}</p>
        </div>

        <div class="paper-card side-card">
          <div class="score-head">
            <h2>玩家排行</h2>
            <span>{{ room.players.length }}/{{ room.max_players || 5 }}</span>
          </div>
          <ul class="player-list">
            <li v-for="player in sortedPlayers" :key="player.id" class="player-item">
              <div class="player-main">
                <img :src="avatarMap[player.avatar] || selectedAvatarOption.src" :alt="player.name" class="player-avatar" />
                <div>
                <strong>{{ player.name }}</strong>
                <p>
                  <span v-if="player.is_host">房主</span>
                  <span v-if="player.is_drawer">作画中</span>
                  <span v-if="!player.is_connected">离线</span>
                </p>
                </div>
              </div>
              <span class="score">{{ player.score }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <section class="room-main">
        <div class="paper-card board-card">
          <div class="board-toolbar">
            <div class="toolbar-left">
              <label>
                颜色
                <input v-model="brush.color" type="color" :disabled="!isDrawer" />
              </label>
              <label>
                粗细
                <input v-model.number="brush.width" type="range" min="2" max="16" :disabled="!isDrawer" />
              </label>
            </div>
            <div class="toolbar-right">
              <button class="secondary-btn" :disabled="!isDrawer" @click="handleClearCanvas">清空画布</button>
            </div>
          </div>
          <div class="board-wrap">
            <canvas
              ref="canvasRef"
              class="draw-board"
              width="980"
              height="600"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointerleave="onPointerUp"
              @pointercancel="onPointerUp"
            ></canvas>
            <div v-if="!isDrawer" class="board-mask">
              <p>{{ room.current_drawer_name || '当前无人作画' }} 正在作画</p>
            </div>
          </div>
        </div>

        <div class="paper-card chat-card">
          <div class="guess-panel">
            <div class="guess-panel-copy">
              <span class="guess-kicker">Guess Channel</span>
              <h3>{{ canGuess ? '看到线索就快猜' : (isDrawer ? '你现在是画手' : '等待下一轮开始') }}</h3>
              <p>{{ canGuess ? '可以连续尝试，系统会实时广播消息，猜中后立刻跳转到结算。' : '当前输入区会在可操作时自动点亮，减少误触。' }}</p>
            </div>
            <div class="guess-status" :class="{ live: canGuess && socketReady }">
              <span class="guess-status-dot"></span>
              <span>{{ socketReady ? '实时连接中' : '连接重建中' }}</span>
            </div>
          </div>
          <div class="chat-log" ref="chatRef">
            <div v-for="message in room.messages" :key="message.id" class="chat-line" :class="message.kind">
              <strong v-if="message.player_name">{{ message.player_name }}：</strong>
              <span>{{ message.content }}</span>
            </div>
          </div>
          <div class="composer-shell" :class="{ active: canGuess, disabled: !canGuess }">
            <div class="composer-body">
              <label class="composer-label">{{ canGuess ? '猜词输入' : '当前不可猜词' }}</label>
              <input
                v-model.trim="guessText"
                class="guess-input"
                :disabled="!canGuess || guessBusy"
                :placeholder="canGuess ? '试试：猫咪、咖啡、相机……' : '等待下一轮开始'"
                @keyup.enter="handleSubmitGuess"
              />
            </div>
            <button class="primary-btn composer-submit" :disabled="!canGuess || guessBusy" @click="handleSubmitGuess">
              {{ guessBusy ? '发送中...' : '发送' }}
            </button>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { apiDrawGuess } from '../../api';
import { showToast } from '../../utils/toast';
import avatarBoyDefault from '../../assets/drawguess-avatar-boy-default.png';
import avatarWomanDefault from '../../assets/drawguess-avatar-woman-default.png';
import avatarManMedium from '../../assets/drawguess-avatar-man-medium.png';
import avatarWomanMediumLight from '../../assets/drawguess-avatar-woman-medium-light.png';
import avatarOldManMediumDark from '../../assets/drawguess-avatar-old-man-medium-dark.png';
import avatarDogFace from '../../assets/drawguess-avatar-dog-face.png';
import avatarCatFace from '../../assets/drawguess-avatar-cat-face.png';
import avatarFox from '../../assets/drawguess-avatar-fox.png';
import avatarPanda from '../../assets/drawguess-avatar-panda.png';
import avatarMonkeyFace from '../../assets/drawguess-avatar-monkey-face.png';

const STORAGE_KEY = 'draw-guess-player-name';
const AVATAR_STORAGE_KEY = 'draw-guess-avatar-id';

const avatarOptions = [
  { id: 'boy-default', label: '元气男孩', src: avatarBoyDefault },
  { id: 'woman-default', label: '明亮女生', src: avatarWomanDefault },
  { id: 'man-medium', label: '沉稳男生', src: avatarManMedium },
  { id: 'woman-medium-light', label: '温柔女生', src: avatarWomanMediumLight },
  { id: 'old-man-medium-dark', label: '酷感大叔', src: avatarOldManMediumDark },
  { id: 'dog-face', label: '小狗', src: avatarDogFace },
  { id: 'cat-face', label: '小猫', src: avatarCatFace },
  { id: 'fox', label: '狐狸', src: avatarFox },
  { id: 'panda', label: '熊猫', src: avatarPanda },
  { id: 'monkey-face', label: '小猴', src: avatarMonkeyFace },
];

const avatarMap = Object.fromEntries(avatarOptions.map((item) => [item.id, item.src]));

const playerName = ref(localStorage.getItem(STORAGE_KEY) || '');
const selectedAvatar = ref(localStorage.getItem(AVATAR_STORAGE_KEY) || 'boy-default');
const joinRoomCode = ref('');
const busy = ref(false);
const guessBusy = ref(false);
const guessText = ref('');
const canvasRef = ref(null);
const chatRef = ref(null);
const socketRef = ref(null);
const socketReady = ref(false);
const displayRemainingSeconds = ref(0);
const socketHint = ref('正在建立实时连接...');

const session = reactive({
  roomId: '',
  playerId: '',
});

const room = reactive({
  id: '',
  status: 'waiting',
  host_player_id: '',
  current_drawer_id: '',
  current_drawer_name: '',
  round: 0,
  word_display: '',
  remaining_seconds: 0,
  max_players: 5,
  players: [],
  messages: [],
  canvas_actions: [],
  last_system_message: '',
});

const brush = reactive({
  color: '#516b57',
  width: 4,
});

let canvasCtx = null;
let drawing = false;
let pendingPoints = [];
let countdownTimer = null;
let reconnectTimer = null;
let manualClose = false;
let strokeFrame = 0;
let activeStrokeId = '';
let activeStrokePoints = [];

const isHost = computed(() => room.host_player_id === session.playerId);
const isDrawer = computed(() => room.current_drawer_id === session.playerId && room.status === 'playing');
const canGuess = computed(() => room.status === 'playing' && !isDrawer.value);
const canStartGame = computed(() => isHost.value && room.players.length >= 2 && room.status !== 'playing');
const sortedPlayers = computed(() => [...room.players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)));
const selectedAvatarOption = computed(() => avatarOptions.find((item) => item.id === selectedAvatar.value) || avatarOptions[0]);
const statusText = computed(() => {
  switch (room.status) {
    case 'playing':
      return '作画中';
    case 'cooldown':
      return '结算中';
    default:
      return '等待开局';
  }
});

function ensurePlayerName() {
  if (!playerName.value.trim()) {
    showToast('请先填写玩家名称', 'warn');
    return false;
  }
  localStorage.setItem(STORAGE_KEY, playerName.value.trim());
  localStorage.setItem(AVATAR_STORAGE_KEY, selectedAvatar.value);
  return true;
}

async function handleCreateRoom() {
  if (!ensurePlayerName()) return;
  busy.value = true;
  try {
    const res = await apiDrawGuess.createRoom({ player_name: playerName.value.trim(), avatar: selectedAvatar.value });
    applyJoinResult(res.data);
    showToast('房间创建成功', 'success');
  } catch (error) {
    showToast(error.response?.data?.error || '创建房间失败', 'error', 3200);
  } finally {
    busy.value = false;
  }
}

async function handleJoinRoom() {
  if (!ensurePlayerName()) return;
  if (!joinRoomCode.value.trim()) {
    showToast('请输入房间码', 'warn');
    return;
  }
  busy.value = true;
  try {
    const res = await apiDrawGuess.joinRoom(joinRoomCode.value.trim().toUpperCase(), { player_name: playerName.value.trim(), avatar: selectedAvatar.value });
    applyJoinResult(res.data);
    showToast('加入房间成功', 'success');
  } catch (error) {
    showToast(error.response?.data?.error || '加入房间失败', 'error', 3200);
  } finally {
    busy.value = false;
  }
}

function applyJoinResult(data) {
  session.roomId = data.room_id;
  session.playerId = data.player_id;
  joinRoomCode.value = data.room_id;
  applyRoomSnapshot(data.room);
  nextTick(setupCanvas);
  connectSocket();
}

function connectSocket() {
  if (!session.roomId || !session.playerId) return;
  closeSocket();
  manualClose = false;
  socketHint.value = '正在建立实时连接...';

  const socket = new WebSocket(apiDrawGuess.socketUrl(session.roomId, session.playerId));
  socket.onopen = () => {
    socketReady.value = true;
    socketHint.value = '实时连接稳定';
  };
  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'snapshot') {
        applyRoomSnapshot(parsed.data);
      } else if (parsed.type === 'canvas') {
        applyCanvasEvent(parsed.data);
      } else if (parsed.type === 'error') {
        const message = parsed.data?.message || '房间操作失败';
        showToast(message, 'warn', 2600);
      }
    } catch (_) {}
  };
  socket.onclose = () => {
    socketReady.value = false;
    if (manualClose || !session.roomId || !session.playerId) {
      return;
    }
    socketHint.value = '连接断开，正在重连...';
    scheduleReconnect();
  };
  socket.onerror = () => {
    socketHint.value = '连接异常，正在重连...';
  };
  socketRef.value = socket;
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = window.setTimeout(async () => {
    reconnectTimer = null;
    try {
      const res = await apiDrawGuess.getRoom(session.roomId, session.playerId);
      applyRoomSnapshot(res.data.room);
      connectSocket();
    } catch (_) {
      socketHint.value = '房间已失效，请重新加入';
    }
  }, 1800);
}

function closeSocket() {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socketRef.value) {
    socketRef.value.close();
    socketRef.value = null;
  }
  socketReady.value = false;
}

function sendSocket(type, data = {}) {
  if (!socketRef.value || socketRef.value.readyState !== WebSocket.OPEN) {
    throw new Error('实时连接尚未就绪');
  }
  socketRef.value.send(JSON.stringify({ type, data }));
}

function canUseSocket() {
  return socketRef.value && socketRef.value.readyState === WebSocket.OPEN;
}

function applyRoomSnapshot(snapshot) {
  room.id = snapshot.id;
  room.status = snapshot.status;
  room.host_player_id = snapshot.host_player_id;
  room.current_drawer_id = snapshot.current_drawer_id;
  room.current_drawer_name = snapshot.current_drawer_name;
  room.round = snapshot.round;
  room.word_display = snapshot.word_display;
  room.remaining_seconds = snapshot.remaining_seconds;
  room.max_players = snapshot.max_players;
  room.players = snapshot.players || [];
  room.messages = snapshot.messages || [];
  room.canvas_actions = snapshot.canvas_actions || [];
  room.last_system_message = snapshot.last_system_message || '';
  syncCountdown(snapshot.remaining_seconds || 0, snapshot.status);
  redrawCanvas();
  nextTick(scrollChatToBottom);
}

function applyCanvasEvent(action) {
  if (action.kind === 'clear') {
    room.canvas_actions = [...room.canvas_actions, action].slice(-320);
    clearBoard();
    return;
  }
  if (action.player_id === session.playerId && isDrawer.value) {
    return;
  }
  const index = room.canvas_actions.findIndex((item) =>
    item.kind === 'stroke'
    && item.player_id === action.player_id
    && item.stroke_id
    && item.stroke_id === action.stroke_id
  );
  if (index >= 0) {
    room.canvas_actions.splice(index, 1, action);
  } else {
    room.canvas_actions.push(action);
    if (room.canvas_actions.length > 320) {
      room.canvas_actions.shift();
    }
  }
  redrawCanvas();
}

async function handleStartGame() {
  try {
    if (canUseSocket()) {
      sendSocket('start', {});
      return;
    }
    await apiDrawGuess.startGame(session.roomId, { player_id: session.playerId });
    socketHint.value = 'WebSocket 尚未连稳，已使用普通请求启动';
  } catch (error) {
    showToast(error.response?.data?.error || error.message || '开始游戏失败', 'error', 3200);
  }
}

async function handleSubmitGuess() {
  if (!guessText.value.trim()) return;
  guessBusy.value = true;
  try {
    if (canUseSocket()) {
      sendSocket('guess', { content: guessText.value.trim() });
    } else {
      await apiDrawGuess.submitGuess(session.roomId, {
        player_id: session.playerId,
        content: guessText.value.trim(),
      });
    }
    guessText.value = '';
  } catch (error) {
    showToast(error.response?.data?.error || error.message || '发送猜测失败', 'error', 3000);
  } finally {
    window.setTimeout(() => {
      guessBusy.value = false;
    }, 160);
  }
}

async function handleClearCanvas() {
  try {
    if (canUseSocket()) {
      sendSocket('clear', {});
      return;
    }
    await apiDrawGuess.clearCanvas(session.roomId, { player_id: session.playerId });
  } catch (error) {
    showToast(error.response?.data?.error || error.message || '清空画布失败', 'error', 3000);
  }
}

async function handleLeaveRoom() {
  const roomId = session.roomId;
  const playerId = session.playerId;
  manualClose = true;
  try {
    if (socketRef.value?.readyState === WebSocket.OPEN) {
      sendSocket('leave', {});
    }
  } catch (_) {}
  closeSocket();
  resetRoom();
  if (!roomId || !playerId) return;
  try {
    await apiDrawGuess.leaveRoom(roomId, { player_id: playerId });
  } catch (_) {}
}

function resetRoom() {
  session.roomId = '';
  session.playerId = '';
  room.id = '';
  room.status = 'waiting';
  room.host_player_id = '';
  room.current_drawer_id = '';
  room.current_drawer_name = '';
  room.round = 0;
  room.word_display = '';
  room.remaining_seconds = 0;
  room.max_players = 5;
  room.players = [];
  room.messages = [];
  room.canvas_actions = [];
  room.last_system_message = '';
  stopCountdown();
  displayRemainingSeconds.value = 0;
  socketHint.value = '正在建立实时连接...';
  clearBoard();
}

function setupCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvasCtx = canvas.getContext('2d');
  clearBoard();
}

function clearBoard() {
  if (!canvasCtx || !canvasRef.value) return;
  canvasCtx.fillStyle = '#fdfcf7';
  canvasCtx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
}

function redrawCanvas() {
  clearBoard();
  for (const action of room.canvas_actions) {
    if (action.kind === 'clear') {
      clearBoard();
      continue;
    }
    drawStroke(action);
  }
}

function drawStroke(action) {
  if (!canvasCtx || !action.points?.length) return;
  canvasCtx.save();
  canvasCtx.lineCap = 'round';
  canvasCtx.lineJoin = 'round';
  canvasCtx.strokeStyle = action.tool === 'eraser' ? '#fdfcf7' : (action.color || '#516b57');
  canvasCtx.lineWidth = action.width || 4;
  canvasCtx.beginPath();
  const points = densifyPoints(action.points, Math.max(1.6, (action.width || 4) * 0.55));
  canvasCtx.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    canvasCtx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i += 1) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      canvasCtx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    canvasCtx.lineTo(last.x, last.y);
  }
  canvasCtx.stroke();
  canvasCtx.restore();
}

function densifyPoints(points, maxStep) {
  if (!Array.isArray(points) || points.length < 2) {
    return points || [];
  }
  const densified = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const distance = Math.hypot(dx, dy);
    const segments = Math.max(1, Math.ceil(distance / maxStep));
    for (let step = 1; step <= segments; step += 1) {
      densified.push({
        x: Number((prev.x + (dx * step) / segments).toFixed(2)),
        y: Number((prev.y + (dy * step) / segments).toFixed(2)),
      });
    }
  }
  return densified;
}

function getCanvasPoint(event) {
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;
  return {
    x: Number(((event.clientX - rect.left) * scaleX).toFixed(2)),
    y: Number(((event.clientY - rect.top) * scaleY).toFixed(2)),
  };
}

function getCanvasPoints(event) {
  const coalesced = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
  if (!coalesced.length) {
    return [getCanvasPoint(event)];
  }
  return coalesced.map((item) => getCanvasPoint(item));
}

function onPointerDown(event) {
  if (!isDrawer.value || !socketReady.value) return;
  drawing = true;
  activeStrokeId = `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  activeStrokePoints = [];
  canvasRef.value?.setPointerCapture?.(event.pointerId);
  pendingPoints = [];
  const point = getCanvasPoint(event);
  appendPendingPoint(point);
  appendStrokePoint(point);
}

function onPointerMove(event) {
  if (!drawing || !isDrawer.value || !socketReady.value) return;
  const points = getCanvasPoints(event);
  for (const point of points) {
    const previous = pendingPoints[pendingPoints.length - 1];
    const appended = appendPendingPoint(point);
    if (!appended) {
      continue;
    }
    appendStrokePoint(point);
    if (previous) {
      drawStroke({
        color: brush.color,
        width: brush.width,
        tool: 'pen',
        points: [previous, point],
      });
    }
  }
  scheduleStrokeFlush();
}

function onPointerUp(event) {
  if (!drawing || !isDrawer.value) return;
  drawing = false;
  canvasRef.value?.releasePointerCapture?.(event.pointerId);
  const point = getCanvasPoint(event);
  if (appendPendingPoint(point)) {
    appendStrokePoint(point);
  }
  flushStroke(true);
  activeStrokeId = '';
  activeStrokePoints = [];
}

function flushStroke(force) {
  if (strokeFrame) {
    window.cancelAnimationFrame(strokeFrame);
    strokeFrame = 0;
  }
  if (pendingPoints.length < 2) {
    return;
  }
  if (!force && pendingPoints.length < 3) {
    return;
  }
  if (activeStrokePoints.length < 2) {
    return;
  }
  pendingPoints = force ? [] : [pendingPoints[pendingPoints.length - 1]];
  try {
    const networkPoints = densifyPoints(activeStrokePoints, Math.max(1.1, (brush.width || 4) * 0.32));
    sendSocket('stroke', {
      stroke_id: activeStrokeId,
      color: brush.color,
      width: brush.width,
      tool: 'pen',
      final: force,
      points: networkPoints,
    });
  } catch (_) {}
}

function scheduleStrokeFlush() {
  if (strokeFrame) return;
  strokeFrame = window.requestAnimationFrame(() => {
    strokeFrame = 0;
    flushStroke(false);
  });
}

function appendPendingPoint(point) {
  const previous = pendingPoints[pendingPoints.length - 1];
  if (previous && previous.x === point.x && previous.y === point.y) {
    return false;
  }
  pendingPoints.push(point);
  return true;
}

function appendStrokePoint(point) {
  const previous = activeStrokePoints[activeStrokePoints.length - 1];
  if (previous && previous.x === point.x && previous.y === point.y) {
    return false;
  }
  activeStrokePoints.push(point);
  return true;
}

function scrollChatToBottom() {
  if (chatRef.value) {
    chatRef.value.scrollTop = chatRef.value.scrollHeight;
  }
}

async function copyRoomCode() {
  try {
    await navigator.clipboard.writeText(session.roomId);
    showToast('房间码已复制', 'success');
  } catch (_) {
    showToast('复制失败，请手动复制', 'warn');
  }
}

function syncCountdown(seconds, status) {
  stopCountdown();
  displayRemainingSeconds.value = seconds;
  if (status !== 'playing' || seconds <= 0) {
    return;
  }
  countdownTimer = window.setInterval(() => {
    if (displayRemainingSeconds.value <= 0) {
      stopCountdown();
      return;
    }
    displayRemainingSeconds.value -= 1;
  }, 1000);
}

function stopCountdown() {
  if (countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

watch(playerName, (value) => {
  if (value.trim()) {
    localStorage.setItem(STORAGE_KEY, value.trim());
  }
});

watch(selectedAvatar, (value) => {
  if (value) {
    localStorage.setItem(AVATAR_STORAGE_KEY, value);
  }
});

onMounted(() => {
  setupCanvas();
});

onBeforeUnmount(() => {
  stopCountdown();
  manualClose = true;
  closeSocket();
  if (strokeFrame) {
    window.cancelAnimationFrame(strokeFrame);
    strokeFrame = 0;
  }
});
</script>

<style scoped>
.draw-guess-page { display: flex; flex-direction: column; gap: 20px; padding: 16px 0 40px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.eyebrow { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.08em; color: var(--primary-1); }
.page-head h1 { margin: 0; font-size: 30px; }
.lead { margin: 8px 0 0; color: var(--muted); max-width: 46rem; }
.back-link { color: var(--primary-1); }

.entry-panel { display: flex; justify-content: center; }
.entry-shell {
  display: grid;
  grid-template-columns: minmax(280px, 0.84fr) minmax(380px, 1.16fr);
  gap: 18px;
  width: min(1120px, 100%);
}
.entry-card {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.86), rgba(251,249,242,0.9)),
    radial-gradient(circle at top right, rgba(141,165,125,0.12), transparent 35%);
  border: 1px solid rgba(107, 143, 113, 0.12);
  border-radius: 22px;
  padding: 28px;
  box-shadow: 0 20px 40px rgba(60, 73, 52, 0.07);
}
.profile-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}
.action-card { display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.profile-head {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  min-width: 0;
}
.profile-avatar-frame {
  width: 84px;
  height: 84px;
  box-sizing: border-box;
  flex: 0 0 auto;
  border-radius: 24px;
  padding: 8px;
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(239,244,236,0.9));
  border: 1px solid rgba(107,143,113,0.14);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.92);
  align-self: start;
  overflow: hidden;
}
.profile-avatar-preview {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.profile-copy-block {
  min-width: 0;
  padding-top: 2px;
  overflow: hidden;
}
.profile-kicker {
  margin: 0 0 4px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-1);
}
.profile-head h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-head);
  line-height: 1.3;
  word-break: break-word;
}
.profile-copy {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  max-width: none;
}
.avatar-picker {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  align-items: start;
}
.avatar-option {
  padding: 8px;
  border-radius: 18px;
  border: 1px solid rgba(122,122,122,0.1);
  background: rgba(255,255,255,0.76);
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.avatar-option img {
  width: 100%;
  height: auto;
  display: block;
}
.avatar-option:hover,
.avatar-option:focus-visible {
  border-color: rgba(107,143,113,0.24);
  transform: translateY(-1px);
}
.avatar-option.active {
  border-color: rgba(107,143,113,0.44);
  box-shadow: 0 0 0 3px rgba(107,143,113,0.1);
  background: rgba(243,248,240,0.94);
}
.entry-field {
  display: grid;
  grid-template-columns: 40px 72px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.entry-field.compact-inline {
  grid-template-columns: 32px 56px minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 0;
  align-items: center;
}
.entry-field.compact {
  grid-template-columns: 32px 56px minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.entry-field-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: #2563eb;
}
.entry-field-icon.subtle {
  width: 32px;
  height: 32px;
  color: #7b8794;
}
.entry-field-icon svg {
  width: 100%;
  height: 100%;
}
.entry-field-label {
  font-size: 18px;
  font-weight: 500;
  color: #7a7f87;
  letter-spacing: 0.01em;
}
.entry-field-label.compact {
  font-size: 15px;
}
.entry-input {
  margin: 0;
  border-radius: 14px;
  background: rgba(255,255,255,0.86);
  border: 1px solid rgba(122,122,122,0.12);
}
.entry-input-hero {
  height: 58px;
  border-radius: 16px;
  border: 3px solid #8d949d;
  background: #fff;
  padding: 0 18px;
  font-size: 18px;
  font-weight: 600;
  color: #747b84;
  box-shadow: none;
}
.entry-input-hero:focus {
  border-color: #6b7280;
  box-shadow: 0 0 0 4px rgba(141, 148, 157, 0.12);
}
.entry-input-hero::placeholder {
  color: #b2b8bf;
  font-weight: 500;
}
.entry-input-hero.small {
  height: 52px;
  border-width: 3px;
  border-radius: 14px;
  font-size: 16px;
  padding-inline: 14px;
}
.entry-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.entry-block {
  padding: 18px;
  background: rgba(255,255,255,0.68);
  border: 1px solid rgba(122,122,122,0.08);
  border-radius: 18px;
}
.entry-block h2 { margin: 0 0 8px; font-size: 18px; }
.entry-block p { margin: 0 0 14px; color: var(--muted); font-size: 14px; line-height: 1.7; }

.primary-btn, .secondary-btn, .copy-btn { margin-top: 0; }
.primary-btn {
  border-radius: 999px;
  padding: 11px 18px;
  border: none;
  background: linear-gradient(135deg, #8da57d, #6b8f71);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 12px 24px rgba(107, 143, 113, 0.2);
}
.primary-btn.ghost { background: linear-gradient(135deg, #556b56, #405545); }
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.primary-btn:hover,
.primary-btn:focus-visible {
  color: #fff;
  background: linear-gradient(135deg, #789062, #5c7a61);
}
.secondary-btn, .copy-btn {
  border-radius: 999px;
  background: rgba(255,255,255,0.88);
  color: var(--text-head);
  border: 1px solid rgba(122,122,122,0.12);
}
.secondary-btn:hover,
.copy-btn:hover,
.secondary-btn:focus-visible,
.copy-btn:focus-visible {
  color: var(--text-head);
  background: rgba(239,244,236,0.96);
  border-color: rgba(107,143,113,0.24);
}

.room-shell { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 18px; align-items: start; }
.room-side, .room-main { display: flex; flex-direction: column; gap: 16px; }
.side-card, .board-card, .chat-card {
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.8), rgba(252,251,245,0.84)),
    repeating-linear-gradient(180deg, rgba(107,143,113,0.04), rgba(107,143,113,0.04) 1px, transparent 1px, transparent 34px);
  border: 1px solid rgba(122,122,122,0.08);
  box-shadow: 0 18px 36px rgba(66, 74, 54, 0.06);
}
.room-meta-head, .status-line, .score-head, .board-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.room-code-label { margin: 0 0 6px; color: var(--muted); font-size: 12px; }
.room-code { font-size: 24px; letter-spacing: 0.08em; color: var(--text-head); }
.status-pill { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid rgba(107,143,113,0.18); color: var(--primary-1); background: rgba(255,255,255,0.8); }
.status-pill.playing { background: rgba(107,143,113,0.16); border-color: rgba(107,143,113,0.3); }
.status-pill.cooldown { background: rgba(202, 161, 92, 0.14); color: #a26d22; border-color: rgba(202,161,92,0.32); }
.status-extra, .system-tip, .word-line span { color: var(--muted); font-size: 13px; }
.meta-grid { display: grid; gap: 10px; margin-top: 14px; }
.word-line { display: flex; justify-content: space-between; gap: 12px; margin: 0; }
.prompt-card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255,255,255,0.66);
  border: 1px solid rgba(122,122,122,0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.prompt-card.drawer {
  background: linear-gradient(135deg, rgba(107,143,113,0.12), rgba(255,255,255,0.78));
  border-color: rgba(107,143,113,0.18);
}
.prompt-label { font-size: 12px; letter-spacing: 0.06em; color: var(--primary-1); }
.prompt-card strong { font-size: 20px; color: var(--text-head); }
.prompt-card p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.7; }
.room-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.system-tip { margin: 14px 0 0; line-height: 1.7; }
.player-list { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.player-item { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.58); }
.player-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.player-avatar {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
  border: 1px solid rgba(107,143,113,0.14);
  background: rgba(255,255,255,0.9);
  object-fit: cover;
}
.player-item p { display: flex; gap: 8px; margin: 4px 0 0; color: var(--muted); font-size: 12px; flex-wrap: wrap; }
.score { font-weight: 700; color: var(--primary-1); }

.board-wrap { position: relative; margin-top: 14px; border-radius: 18px; overflow: hidden; border: 1px dashed rgba(107,143,113,0.16); }
.draw-board {
  width: 100%;
  height: auto;
  display: block;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,244,236,0.96)),
    repeating-linear-gradient(180deg, rgba(107,143,113,0.06), rgba(107,143,113,0.06) 1px, transparent 1px, transparent 34px);
  touch-action: none;
  cursor: crosshair;
}
.board-mask { position: absolute; inset: 0; display: flex; align-items: flex-start; justify-content: flex-end; padding: 14px; pointer-events: none; }
.board-mask p { margin: 0; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.9); color: var(--muted); font-size: 13px; }
.toolbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar-left label { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }

.guess-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.86), rgba(241,246,237,0.92)),
    radial-gradient(circle at top right, rgba(107,143,113,0.14), transparent 35%);
  border: 1px solid rgba(107,143,113,0.1);
}
.guess-kicker {
  display: inline-flex;
  margin-bottom: 6px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-1);
}
.guess-panel h3 { margin: 0; font-size: 20px; color: var(--text-head); }
.guess-panel p { margin: 6px 0 0; color: var(--muted); line-height: 1.7; }
.guess-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--muted);
  background: rgba(255,255,255,0.76);
  border: 1px solid rgba(122,122,122,0.1);
}
.guess-status.live {
  color: var(--primary-1);
  border-color: rgba(107,143,113,0.18);
  background: rgba(243,248,240,0.95);
}
.guess-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #c6b48a;
}
.guess-status.live .guess-status-dot {
  background: #6b8f71;
  box-shadow: 0 0 0 6px rgba(107,143,113,0.12);
}

.chat-log { max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px; }
.chat-line { padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.55); line-height: 1.7; }
.chat-line.system { color: var(--primary-1); }
.chat-line.correct { background: rgba(107,143,113,0.12); color: var(--text-head); }

.composer-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 18px;
  background: #fff;
  border: 2px solid #9aa0a8;
  box-shadow:
    0 10px 24px rgba(34, 44, 58, 0.05),
    inset 0 1px 0 rgba(255,255,255,0.9);
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease, opacity .2s ease;
}
.composer-shell.active {
  border-color: #6b7280;
  box-shadow:
    0 14px 32px rgba(56, 70, 54, 0.08),
    0 0 0 4px rgba(141, 148, 157, 0.12),
    inset 0 1px 0 rgba(255,255,255,0.9);
}
.composer-shell.disabled { opacity: 0.76; }
.composer-body { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.composer-label { font-size: 12px; letter-spacing: 0.03em; color: #7a7f87; }
.guess-input {
  margin: 0;
  height: 38px;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 17px;
  font-weight: 600;
  color: #747b84;
  box-shadow: none;
}
.guess-input:focus { box-shadow: none; }
.guess-input::placeholder { color: #b2b8bf; font-weight: 500; }
.composer-submit {
  padding-inline: 20px;
  min-width: 96px;
}

@media (max-width: 960px) {
  .room-shell { grid-template-columns: 1fr; }
  .entry-shell { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .page-head { flex-direction: column; align-items: flex-start; }
  .entry-card, .side-card, .board-card, .chat-card { padding: 16px; }
  .entry-field,
  .entry-field.compact {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .entry-field.compact-inline {
    grid-template-columns: 1fr;
  }
  .entry-field-icon,
  .entry-field-icon.subtle {
    width: 44px;
    height: 44px;
  }
  .entry-field-label {
    font-size: 16px;
  }
  .entry-input-hero {
    height: 52px;
    font-size: 16px;
    border-width: 2px;
    padding-inline: 14px;
  }
  .profile-head {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .profile-avatar-frame {
    width: 76px;
    height: 76px;
  }
  .avatar-picker {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .room-meta-head, .board-toolbar { flex-direction: column; align-items: stretch; }
  .guess-panel { flex-direction: column; align-items: flex-start; }
  .toolbar-left { width: 100%; }
  .composer-shell {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}
</style>
