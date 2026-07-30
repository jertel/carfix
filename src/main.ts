import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar, Dark, Notify } from 'quasar';

import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import './css/app.scss';

import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(Quasar, {
  plugins: { Dark, Notify },
  config: {
    dark: 'auto'
  }
});

app.mount('#app');
