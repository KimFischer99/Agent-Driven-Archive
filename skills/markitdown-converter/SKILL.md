---
name: markitdown-converter
description: 经由 MarkItDown 组件将已电子化的 PDF 和 Word (DOCX) 文档快速转换为 agent-readable Markdown，保留完整文本内容和结构层级。
---

# MarkItDown Converter Skill

将已电子化（非扫描件）的 PDF 和 DOCX 文档转换为干净的、适合 Agent 阅读的 Markdown。输出保留完整文本、标题层级、列表和表格结构，剥离所有图像和非文本元素。

此 skill 适用于已有文本层的电子文档。扫描件 PDF 请使用 `paddle-ocr-markdown` skill。

## Run

```bash
python3 ./scripts/markitdown_convert.py [FILE_OR_DIR ...]
```

## 默认行为

- 无路径：处理当前目录下所有 `.pdf` 和 `.docx` 文件
- 输出：同目录、同 basename、`.md`
- 已有 `.md`：跳过，除非 `--overwrite`
- 递归：`--recursive` 遍历子目录

## 适用场景

- 电子化 PDF（非扫描件，已有文本层）
- Word 文档 (.docx)
- 需要快速提取全文并保留结构的场景
- 作为 OCR pipeline 之前对已电子化材料的预处理

## 工作流定位

```text
primary sources
-> source inventory
-> 已电子化文档 → markitdown-converter → editable Markdown
-> 扫描件 PDF → paddle-ocr-markdown → OCR Markdown
-> cleaned / tagged / structured Markdown
-> exports / UI
```

## 依赖

```bash
pip install markitdown
```

## 注意事项

- 此 skill 仅处理已有文本层的电子文档，不执行 OCR
- 输出为纯文本 Markdown，自动剥离图像引用
- 转换后建议人工检查标题层级和表格对齐
- 本 skill 不绑定任何 API 密钥或云端服务
