import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/global.css';

import VMdEditor from '@kangc/v-md-editor';
import VMdPreview from '@kangc/v-md-editor/lib/preview';
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import Prism from 'prismjs';
import zhCN from '@kangc/v-md-editor/lib/lang/zh-CN';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import '@kangc/v-md-editor/lib/style/preview.css';
import '@kangc/v-md-editor/lib/theme/style/github.css';

VMdEditor.lang.use('zh-CN', zhCN);
VMdEditor.use(githubTheme, { Prism });
VMdPreview.use(githubTheme, { Prism });

const app = createApp(App);
app.use(router);
app.use(VMdEditor);
app.use(VMdPreview);
app.mount('#app');
