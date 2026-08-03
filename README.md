# 乡研知识库

乡村发展 / 乡村旅游 / 产业发展研究资料站：文献库、数据与工具、学习笔记。

## 目录结构

- `index.html` — 首页
- `research.html` — 研究方向
- `literature.html` — 文献库
- `resources.html` — 数据与工具
- `cases.html` — 案例库
- `journals.html` — 期刊入口
- `notes.html` — 学习笔记
- `about.html` — 关于与维护指南
- `assets/css/style.css` — 全局样式
- `assets/js/main.js` — 导航与搜索筛选

## 使用方式

直接用浏览器打开 `index.html` 即可本地使用。添加内容时复制对应页面中的卡片进行修改，无需构建。

## 部署（可选）

1. 在 GitHub / Gitee 创建仓库并上传本目录；
2. 在仓库设置中开启 Pages（GitHub Pages 选择 main 分支 / 根目录）；
3. 访问生成的网址即可分享给同门师生。

## 部署后如何更新内容

网站是静态页面，内容就保存在各页面的 HTML 文件里，更新方式：

1. 在电脑上打开对应的 HTML 文件（如 `literature.html`），复制一张卡片并修改文字；
2. 保存文件；
3. 把改动同步到 GitHub（提交并推送），等 1–2 分钟，Pages 自动更新。

小改动也可以直接在 GitHub 网站上打开对应文件在线编辑并提交。

## 访问热度统计

右上角的"访客量"显示全站浏览量，采用 10 分钟去重规则：同一浏览器 10 分钟内多次打开只计一次，超过 10 分钟再打开计一次，统计整个网站而非单个页面。计数存储在 Supabase 的 site_stats 表中，通过 increment_site_views 函数原子累加，无需第三方统计服务。

## 管理员模式

"添加笔记"和"添加案例"的入口默认隐藏，访客只能浏览。页面底部有"管理"入口，输入管理密码后可显示添加表单。

内容写入 Supabase 云数据库，所有访客共享同一份数据。笔记、案例、文献库、数据与工具、期刊入口五个板块均支持管理员在线添加，添加的内容刷新后所有人即可看到；删除操作仅管理员登录后可见，访客只能浏览。

连接配置：Supabase 项目地址与公开钥匙在 `assets/js/main.js` 顶部（SUPABASE_URL、SUPABASE_KEY）。数据库表 notes、cases、literature、resources、journals 和存储桶 case-photos 需按接入说明创建。

默认密码：`260803`，可在 `assets/js/main.js` 中修改。

注意：网页端管理密码与 Supabase 公开钥匙都存在于页面代码中，属于轻量权限控制，用于防止访客误操作；如需严格权限，应使用 Supabase Auth 登录。
