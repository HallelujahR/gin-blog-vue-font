<template>
  <div class="tech-stack">
    <header class="tech-header">
      <h1>技术栈</h1>
      <p class="tech-subtitle">Current support tools as follow:</p>
    </header>

    <div class="tech-categories">
      <section
        v-for="category in techCategories"
        :key="category.name"
        class="tech-category"
      >
        <h2 class="category-title">{{ category.name }}</h2>
        <div class="tech-grid">
          <div
            v-for="tech in category.items"
            :key="tech.name"
            class="tech-item"
          >
            <div
              class="tech-icon"
              :style="{ backgroundColor: tech.iconUrl ? 'transparent' : tech.color }"
            >
              <img v-if="tech.iconUrl" :src="tech.iconUrl" :alt="tech.name" class="icon-img" />
              <span v-else class="icon-text">{{ tech.iconText }}</span>
            </div>
            <div class="tech-info">
              <h3 class="tech-name">{{ tech.name }}</h3>
              <p class="tech-desc">{{ tech.description }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="contact-section">
      <h2 class="contact-title">联系我</h2>
      <div class="contact-grid">
        <div
          v-for="item in contacts"
          :key="item.label"
          class="contact-card"
        >
          <div class="contact-icon">{{ item.icon }}</div>
          <div class="contact-info">
            <p class="contact-label">{{ item.label }}</p>
            <a v-if="item.href" :href="item.href">{{ item.value }}</a>
            <p v-else class="contact-value">{{ item.value }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import goIcon from '../assets/toolsLogo/golang.svg';
import phpIcon from '../assets/toolsLogo/php.svg';
import tomlIcon from '../assets/toolsLogo/TOML.svg';
import mysqlIcon from '../assets/toolsLogo/Mysql.svg';
import golandIcon from '../assets/toolsLogo/goland.svg';
import grpcIcon from '../assets/toolsLogo/GRPC.svg';
import laravelIcon from '../assets/toolsLogo/laravel.svg';
import redisIcon from '../assets/toolsLogo/REDIS.svg';
import gitIcon from '../assets/toolsLogo/git.svg';
import linuxIcon from '../assets/toolsLogo/linux.svg';
import postmanIcon from '../assets/toolsLogo/postman.svg';
import vscodeIcon from '../assets/toolsLogo/vscode.svg';
import phpstormIcon from '../assets/toolsLogo/Phpstorm.svg';

const techCategories = [
  {
    name: '编程',
    items: [
      {
        name: 'Golang',
        description: '熟悉内存分配、GMP调度、GC、性能优化',
        iconUrl: goIcon,
        color: '#0ea5e9',
      },
      {
        name: 'PHP',
        description: '多业务线实践经验',
        iconUrl: phpIcon,
        color: '#c084fc',
      },
      {
        name: 'SQL / MySQL',
        description: '熟悉索引、锁、SQL 调优与设计',
        iconUrl: mysqlIcon,
        color: '#0f766e',
      },
      {
        name: 'YAML / TOML',
        description: '配置语言与工程化规范',
        iconUrl: tomlIcon,
        color: '#8b5cf6',
      },
      {
        name: 'MongoDB',
        description: '文档型数据建模与聚合查询',
        iconText: 'MG',
        color: '#22c55e',
      },
      {
        name: 'Redis',
        description: '缓存架构与分布式锁',
        iconUrl: redisIcon,
        color: '#c2410c',
      },
    ],
  },
  {
    name: '开发与协作工具',
    items: [
      {
        name: 'Goland',
        description: 'IDE',
        iconUrl: golandIcon,
        color: '#111827',
      },
      {
        name: 'Linux & Shell',
        description: '熟练掌握常用命令',
        iconUrl: linuxIcon,
        color: '#4b5563',
      },
      {
        name: 'Git / SVN / PD',
        description: '版本管理与建模工具',
        iconUrl: gitIcon,
        color: '#dc2626',
      },
      {
        name: '思维导图',
        description: '方案设计与知识整理',
        iconText: 'MAP',
        color: '#ea580c',
      },
      {
        name: 'VS Code',
        description: '跨语言编辑器与建模工具',
        iconText: 'VS',
        color: '#2563eb',
      },
      {
        name: 'PhpStorm',
        description: 'PHP 工程协作与调试',
        iconUrl: phpstormIcon,
        color: '#9333ea',
      },
    ],
  },
  {
    name: 'AI 编程助手',
    items: [
      {
        name: 'Cursor',
        description: 'AI 结对编程与代码补全',
        iconText: 'CU',
        color: '#111827',
      },
      {
        name: '文心一言',
        description: '中文语境下的辅助开发',
        iconText: '文心',
        color: '#0ea5e9',
      },
      {
        name: 'GitHub Copilot',
        description: '通用代码补全与测试生成',
        iconText: 'GP',
        color: '#22c55e',
      },
      {
        name: 'ChatGPT / Claude',
        description: '架构讨论与代码审阅',
        iconText: 'AI',
        color: '#7c3aed',
      },
    ],
  },
];

const contacts = [
  {
    label: 'Phone',
    value: '13001130055',
    href: 'tel:13001130055',
    icon: '📱',
  },
  {
    label: 'E-mail',
    value: '13001130055@163.com',
    href: 'mailto:13001130055@163.com',
    icon: '✉️',
  },
  {
    label: 'WeChat',
    value: 'River_w_1997',
    icon: '💬',
  },
];
</script>

<style scoped>
.tech-stack {
  max-width: 960px;
  margin: 0 auto;
  padding: 0;
}

.tech-header {
  margin-bottom: 32px;
}

.tech-header h1 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
}

.tech-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
  font-weight: 400;
}

.tech-categories {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tech-category {
  background: var(--card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.category-title {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.tech-item:hover {
  background-color: rgba(99, 102, 241, 0.05);
  transform: translateY(-2px);
}

.tech-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
  color: #ffffff;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.icon-text {
  font-weight: 700;
  color: #ffffff;
  font-size: 14px;
  letter-spacing: 0.5px;
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
}

.tech-info {
  flex: 1;
  min-width: 0;
}

.tech-name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.tech-desc {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}

.contact-section {
  margin-top: 32px;
  background: var(--card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.contact-title {
  margin: 0 0 18px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.contact-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(148, 163, 184, 0.05);
}

.contact-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-label {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.contact-info a,
.contact-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  word-break: break-all;
}

.contact-info a:hover {
  color: #6366f1;
}

@media (max-width: 768px) {
  .tech-grid {
    grid-template-columns: 1fr;
  }
  
  .tech-header h1 {
    font-size: 26px;
  }
}
</style>

