import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/global.css';
import './assets/admin.css';
import 'md-editor-v3/lib/style.css';

const app = createApp(App);
app.use(router);
app.mount('#app');
