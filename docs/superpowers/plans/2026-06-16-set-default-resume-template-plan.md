# 设置默认简历模板实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标**：将用户下载目录中的 `前端(AI 应用)_4年低代码经验_杨忠源_15779736785 (1).json` 文件设置为项目默认的简历模板（覆盖项目中的 `src/data/defaultResume.json`）。

**架构**：在不对代码逻辑进行改动的前提下，读取源 JSON 文件数据，完整覆盖项目中的默认简历 JSON 数据文件，以达成默认简历模板更新的目的。

**技术栈**：Node.js / shell 文件操作

---

### 任务 1：文件替换与备份

**文件：**
- 修改：`src/data/defaultResume.json`

- [ ] **步骤 1：备份当前默认简历文件**

  在终端运行以下备份命令：
  ```bash
  cp src/data/defaultResume.json src/data/defaultResume.json.bak
  ```

- [ ] **步骤 2：用最新的下载文件覆盖默认简历文件**

  在终端运行以下复制覆盖命令：
  ```bash
  cp "/Users/neoyuan/Downloads/前端(AI 应用)_4年低代码经验_杨忠源_15779736785 (1).json" src/data/defaultResume.json
  ```

- [ ] **步骤 3：验证 JSON 格式语法正确性**

  在终端使用 Node.js 验证复制后的 JSON 格式是否完好：
  ```bash
  node -e "const fs = require('fs'); JSON.parse(fs.readFileSync('src/data/defaultResume.json', 'utf8')); console.log('JSON 格式验证通过！')"
  ```
  预期输出：`JSON 格式验证通过！`

- [ ] **步骤 4：删除备份文件并 Commit**

  在终端运行以下命令：
  ```bash
  rm src/data/defaultResume.json.bak
  git add src/data/defaultResume.json
  git commit -m "feat: 更新默认简历数据模板为最新版本"
  ```

---

### 任务 2：本地运行验证

- [ ] **步骤 1：启动本地开发服务器**

  在终端运行：
  ```bash
  npm run dev
  ```

- [ ] **步骤 2：浏览器访问验证**

  请用户在浏览器中打开本地开发服务器的地址（通常为 `http://localhost:3000`）。
  
  **预期验证点**：
  1. 页面默认加载显示的简历信息为“杨忠源”，求职意向及内容应包含最新的“AI 应用开发经验”和“4年低代码平台研发经验”。
  2. 头像正常加载并渲染（不再是原默认头像，或者如果原模板未设置头像，则目前头像能展示）。
  3. 各模块（如 Mini React 开源经历、荣誉奖项等）排版正常。
