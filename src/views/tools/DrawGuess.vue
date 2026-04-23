<template>
  <div class="draw-guess-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">多人实时小游戏</p>
        <h1>你画我猜</h1>
        <p class="lead">最多 5 人联机，轮流作画猜词，实时积分。先填玩家名，再创建或加入房间。</p>
      </div>
      <router-link to="/tools" class="back-link">返回工具栏</router-link>
    </header>

    <section v-if="!session.roomId" class="entry-panel">
      <div class="entry-card">
        <label class="entry-label">玩家名称</label>
        <input v-model.trim="playerName" class="entry-input" maxlength="16" placeholder="例如：Ruiwen" />
        <div class="entry-grid">
          <div class="entry-block">
            <h2>创建房间</h2>
            <p>你会成为房主，凑够 2 人后就能开始。</p>
            <button class="primary-btn" :disabled="busy" @click="handleCreateRoom">{{ busy ? '处理中...' : '创建房间' }}</button>
          </div>
          <div class="entry-block">
            <h2>加入房间</h2>
            <p>输入 6 位房间码，和朋友一起开画。</p>
            <input v-model.trim="joinRoomCode" class="entry-input small" maxlength="6" placeholder="房间码" />
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
          <p class="word-line">
            <span>当前题目</span>
            <strong>{{ room.word_display || '等待开始' }}</strong>
          </p>
          <p class="word-line">
            <span>当前画手</span>
            <strong>{{ room.current_drawer_name || '等待中' }}</strong>
          </p>
          <p class="word-line">
            <span>倒计时</span>
            <strong>{{ room.remaining_seconds || 0 }} 秒</strong>
          </p>
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
          <p class="system-tip">{{ room.last_system_message || '等待玩家加入。' }}</p>
        </div>

        <div class="paper-card side-card">
          <div class="score-head">
            <h2>玩家排行</h2>
            <span>{{ room.players.length }}/{{ room.max_players || 5 }}</span>
          </div>
          <ul class="player-list">
            <li v-for="player in sortedPlayers" :key="player.id" class="player-item">
              <div>
                <strong>{{ player.name }}</strong>
                <p>
                  <span v-if="player.is_host">房主</span>
                  <span v-if="player.is_drawer">作画中</span>
                </p>
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
              width="900"
              height="540"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointerleave="onPointerUp"
            ></canvas>
            <div v-if="!isDrawer" class="board-mask">
              <p>{{ room.current_drawer_name || '当前无人作画' }} 正在作画</p>
            </div>
          </div>
        </div>

        <div class="paper-card chat-card">
          <div class="chat-log" ref="chatRef">
            <div v-for="message in room.messages" :key="message.id" class="chat-line" :class="message.kind">
              <strong v-if="message.player_name">{{ message.player_name }}：</strong>
              <span>{{ message.content }}</span>
            </div>
          </div>
          <div class="chat-input-wrap">
            <input
              v-model.trim="guessText"
              class="guess-input"
              :disabled="!canGuess"
              placeholder="输入你的猜测"
              @keyup.enter="handleSubmitGuess"
            />
            <button class="primary-btn" :disabled="!canGuess || guessBusy" @click="handleSubmitGuess">
              {{ guessBusy ? '发送中...' : '猜一下' }}
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

const STORAGE_KEY = 'draw-guess-player-name';

const playerName = ref(localStorage.getItem(STORAGE_KEY) || '');
const joinRoomCode = ref('');
const busy = ref(false);
const guessBusy = ref(false);
const guessText = ref('');
const canvasRef = ref(null);
const chatRef = ref(null);
const eventSourceRef = ref(null);

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

const isHost = computed(() => room.host_player_id === session.playerId);
const isDrawer = computed(() => room.current_drawer_id === session.playerId && room.status === 'playing');
const canGuess = computed(() => room.status === 'playing' && !isDrawer.value);
const canStartGame = computed(() => isHost.value && room.players.length >= 2 && room.status !== 'playing');
const sortedPlayers = computed(() => [...room.players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)));
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
  return true;
}

async function handleCreateRoom() {
  if (!ensurePlayerName()) return;
  busy.value = true;
  try {
    const res = await apiDrawGuess.createRoom({ player_name: playerName.value.trim() });
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
    const res = await apiDrawGuess.joinRoom(joinRoomCode.value.trim().toUpperCase(), { player_name: playerName.value.trim() });
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
  connectStream();
}

function connectStream() {
  closeStream();
  const source = new EventSource(apiDrawGuess.streamUrl(session.roomId, session.playerId));
  source.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'snapshot') {
        applyRoomSnapshot(parsed.data);
      } else if (parsed.type === 'canvas') {
        applyCanvasEvent(parsed.data);
      }
    } catch (_) {}
  };
  source.onerror = () => {
    showToast('房间连接中断，正在等待重连', 'warn', 1800);
  };
  eventSourceRef.value = source;
}

function closeStream() {
  if (eventSourceRef.value) {
    eventSourceRef.value.close();
    eventSourceRef.value = null;
  }
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
  redrawCanvas();
  nextTick(scrollChatToBottom);
}

function applyCanvasEvent(action) {
  room.canvas_actions.push(action);
  if (room.canvas_actions.length > 320) {
    room.canvas_actions.shift();
  }
  if (action.kind === 'clear') {
    clearBoard();
    return;
  }
  if (action.player_id === session.playerId && isDrawer.value) {
    return;
  }
  drawStroke(action);
}

async function handleStartGame() {
  try {
    await apiDrawGuess.startGame(session.roomId, { player_id: session.playerId });
  } catch (error) {
    showToast(error.response?.data?.error || '开始游戏失败', 'error', 3200);
  }
}

async function handleSubmitGuess() {
  if (!guessText.value.trim()) return;
  guessBusy.value = true;
  try {
    await apiDrawGuess.submitGuess(session.roomId, {
      player_id: session.playerId,
      content: guessText.value.trim(),
    });
    guessText.value = '';
  } catch (error) {
    showToast(error.response?.data?.error || '发送猜测失败', 'error', 3000);
  } finally {
    guessBusy.value = false;
  }
}

async function handleClearCanvas() {
  try {
    await apiDrawGuess.clearCanvas(session.roomId, { player_id: session.playerId });
  } catch (error) {
    showToast(error.response?.data?.error || '清空画布失败', 'error', 3000);
  }
}

async function handleLeaveRoom() {
  const roomId = session.roomId;
  const playerId = session.playerId;
  closeStream();
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
  canvasCtx.moveTo(action.points[0].x, action.points[0].y);
  for (let i = 1; i < action.points.length; i += 1) {
    canvasCtx.lineTo(action.points[i].x, action.points[i].y);
  }
  canvasCtx.stroke();
  canvasCtx.restore();
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

function onPointerDown(event) {
  if (!isDrawer.value) return;
  drawing = true;
  pendingPoints = [getCanvasPoint(event)];
}

function onPointerMove(event) {
  if (!drawing || !isDrawer.value) return;
  pendingPoints.push(getCanvasPoint(event));
  if (pendingPoints.length >= 4) {
    flushStroke(false);
  }
}

function onPointerUp(event) {
  if (!drawing || !isDrawer.value) return;
  drawing = false;
  pendingPoints.push(getCanvasPoint(event));
  flushStroke(true);
}

async function flushStroke(force) {
  if (pendingPoints.length < 2) {
    return;
  }
  const payloadPoints = force ? [...pendingPoints] : pendingPoints.slice(0, pendingPoints.length - 1);
  const keepPoint = force ? [] : [pendingPoints[pendingPoints.length - 1]];
  pendingPoints = keepPoint;
  const action = {
    player_id: session.playerId,
    color: brush.color,
    width: brush.width,
    tool: 'pen',
    points: payloadPoints,
  };
  drawStroke(action);
  try {
    await apiDrawGuess.submitStroke(session.roomId, action);
  } catch (_) {}
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

watch(playerName, (value) => {
  if (value.trim()) {
    localStorage.setItem(STORAGE_KEY, value.trim());
  }
});

onMounted(() => {
  setupCanvas();
});

onBeforeUnmount(() => {
  handleLeaveRoom();
});
</script>

<style scoped>
.draw-guess-page { display: flex; flex-direction: column; gap: 20px; padding: 16px 0 40px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.eyebrow { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.08em; color: var(--primary-1); }
.page-head h1 { margin: 0; font-size: 30px; }
.lead { margin: 8px 0 0; color: var(--muted); max-width: 42rem; }
.back-link { color: var(--primary-1); }
.entry-panel { display: flex; justify-content: center; }
.entry-card { width: min(760px, 100%); background: rgba(253, 253, 250, 0.78); border: 1px solid rgba(107, 143, 113, 0.12); border-radius: 18px; padding: 28px; }
.entry-label { display: block; margin-bottom: 8px; font-size: 13px; color: var(--muted); }
.entry-input { margin: 0 0 16px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.78); }
.entry-input.small { margin-bottom: 12px; }
.entry-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.entry-block { padding: 18px; background: rgba(255,255,255,0.62); border: 1px solid rgba(122,122,122,0.08); border-radius: 16px; }
.entry-block h2 { margin: 0 0 8px; font-size: 18px; }
.entry-block p { margin: 0 0 14px; color: var(--muted); font-size: 14px; line-height: 1.7; }
.primary-btn, .secondary-btn, .copy-btn { margin-top: 0; }
.primary-btn { border-radius: 999px; padding: 10px 18px; border: none; background: linear-gradient(135deg, #8da57d, #6b8f71); color: #fff; font-weight: 600; }
.primary-btn.ghost { background: linear-gradient(135deg, #556b56, #405545); }
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.secondary-btn, .copy-btn { border-radius: 999px; background: rgba(255,255,255,0.68); }
.room-shell { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 18px; align-items: start; }
.room-side, .room-main { display: flex; flex-direction: column; gap: 16px; }
.side-card, .board-card, .chat-card { padding: 18px; background: rgba(253, 253, 250, 0.8); border: 1px solid rgba(122,122,122,0.08); }
.room-meta-head, .status-line, .score-head, .board-toolbar, .chat-input-wrap { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.room-code-label { margin: 0 0 6px; color: var(--muted); font-size: 12px; }
.room-code { font-size: 24px; letter-spacing: 0.08em; color: var(--text-head); }
.status-pill { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 12px; border: 1px solid rgba(107,143,113,0.18); color: var(--primary-1); }
.status-pill.playing { background: rgba(107,143,113,0.12); }
.status-pill.cooldown { background: rgba(202, 161, 92, 0.12); color: #a26d22; }
.status-extra, .system-tip, .word-line span { color: var(--muted); font-size: 13px; }
.word-line { display: flex; justify-content: space-between; gap: 12px; margin: 12px 0 0; }
.room-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.system-tip { margin: 14px 0 0; line-height: 1.7; }
.player-list { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.player-item { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.58); }
.player-item p { display: flex; gap: 8px; margin: 4px 0 0; color: var(--muted); font-size: 12px; }
.score { font-weight: 700; color: var(--primary-1); }
.board-wrap { position: relative; margin-top: 14px; border-radius: 18px; overflow: hidden; border: 1px dashed rgba(107,143,113,0.16); }
.draw-board { width: 100%; height: auto; display: block; background: #fdfcf7; touch-action: none; }
.board-mask { position: absolute; inset: 0; display: flex; align-items: flex-start; justify-content: flex-end; padding: 14px; pointer-events: none; }
.board-mask p { margin: 0; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.9); color: var(--muted); font-size: 13px; }
.toolbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar-left label { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
.chat-log { max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px; }
.chat-line { padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.55); line-height: 1.7; }
.chat-line.system { color: var(--primary-1); }
.chat-line.correct { background: rgba(107,143,113,0.12); color: var(--text-head); }
.guess-input { margin: 0; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.78); }
.chat-input-wrap { margin-top: 14px; }

@media (max-width: 960px) {
  .room-shell { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .page-head { flex-direction: column; align-items: flex-start; }
  .entry-card, .side-card, .board-card, .chat-card { padding: 16px; }
  .room-meta-head, .board-toolbar, .chat-input-wrap { flex-direction: column; align-items: stretch; }
  .toolbar-left { width: 100%; }
}
</style>
