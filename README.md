# dsh-prompt-enhancer

DeepSeek Harness 插件：在输入框**模型选择器左侧**增加「✦ 增强提示词」按钮，把草稿改写为更清晰具体的提示词并写回；支持一键恢复原文、取消、内容漂移保护。

## 与 WorkBuddy 的关系

- **提示词原文**：系统提示词 `Ur`、用户模板 `Wr` 逐字取自 WorkBuddy 5.11.3 的 `server.js`（2986 / 3010 字符，原样保留，含缩进与示例）。处理规则（`{input}` 替换、去首尾引号、空结果判定）同样原样保留。
- **其余部分**：Host 架构、按钮位置、交互状态机参考两个成熟的 MIT DSH 插件整合：
  - [sun04222/dsh-prompt-enhance](https://github.com/sun04222/dsh-prompt-enhance)
  - [2861292267/dsh-prompt-forge](https://github.com/2861292267/dsh-prompt-forge)

## 功能

- 输入框模型左侧的 ✦ 按钮，点击改写草稿
- 增强中可再次点击取消
- 成功后显示「恢复原文」，一键回到改写前内容
- 增强期间若你继续输入，结果自动丢弃（内容漂移保护）
- 写入失败时把结果复制到剪贴板兜底
- 模型优先取插件配置 `provider`/`model`，否则跟随会话默认模型

## 安装

```sh
dsh plugin --profile desktop add github:jyz48prsbr-netizen/dsh-prompt-enhancer
```

安装后在 设置 → 插件 里确认已启用。

## 说明

- 每次点击消耗一次模型请求额度。
- 原版提示词面向通用任务；个别通用模型可能在结果里带出额外文字，插件做了防御性清理（去外层代码块/标签行），不改动提示词本身。
- 第三方来源均为 MIT，署名与许可见本仓库。

## License

MIT
