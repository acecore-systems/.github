# コントリビューションガイド / Contributing Guide

[日本語](#日本語) · [English](#english)

## 日本語

Acecore プロジェクトへの改善提案ありがとうございます。
このガイドは、各リポジトリに固有のコントリビューション手順がない場合に適用します。

## 始める前に

- まずリポジトリの `README.md` と既存の Issue を確認してください。
- 大きな変更は、Pull Request を作る前に Issue や提案で方針を共有してください。
- 変更範囲は絞ってください。関係のないリファクタ、文章修正、設定変更を
  1つの Pull Request に混ぜないでください。
- コミット、スクリーンショット、ログ、Issue 本文に、秘密情報、顧客情報、
  個人情報、認証情報を含めないでください。

## Issue

共通の Issue テンプレートは次の2種類です。独自テンプレートがあるリポジトリでは、そちらの案内に従ってください。

- **不具合**: 現在の挙動、期待する挙動、直ったと判断できる状態を記載してください。
  再現手順や環境情報は、分かる範囲で添えてください。
- **タスク**: 改善、機能追加、コンテンツ、CMS、運用などの依頼に使います。
  何をしたいかと完了条件を記載し、対象ページ、言語、ファイルパスや制約があれば添えてください。

迷った場合は「タスク」を使い、足りない情報はコメントで補います。空の Issue も利用できます。

## Pull Request

- 変更結果が分かる明確なタイトルにしてください。
- 関連する Issue がある場合はリンクしてください。
- 実行した確認内容を書いてください。確認できなかった場合は理由を書いてください。
- UI や表示内容が変わる場合は、スクリーンショットや変更前後の説明を添えてください。
- リポジトリで求められていない生成物は差分に含めないでください。

## レビュー

変更内容のレビューと必要なCIは実施しますが、別の1人によるGitHub承認は一律の必須条件にしません。
AI作業・CMS更新・定期更新と保護設定の関係は、[共通運用方針](REPOSITORY_POLICY.md)を参照してください。

メンテナーは、変更依頼、大きな作業の分割、スコープ外の作業のクローズを行う
ことがあります。レビューコメントは、具体的で実行可能な内容にし、プロジェクトの
目的に結びつけてください。

## English

Thank you for proposing improvements to Acecore projects. This guide applies when a repository does not have its own contribution instructions.

### Before you start

- Read the repository's `README.md` and existing Issues first.
- For substantial changes, discuss the approach in an Issue or proposal before opening a pull request.
- Keep each pull request focused. Do not mix in unrelated refactoring, copy edits, or configuration changes.
- Do not include secrets, customer or personal data, or credentials in commits, screenshots, logs, or Issues.

### Issues

The shared Issue forms cover two cases. If a repository has its own forms, follow those instead.

- **Bug report:** Describe the current behavior, expected behavior, and what would count as fixed. Add reproduction steps and environment details when available.
- **Task:** Use for improvements, features, content, CMS, or operations work. Describe the goal and completion criteria; include the relevant page, language, file path, or constraints when available.

If unsure, use **Task** and add missing details in comments. Blank Issues are also available.

### Pull requests

- Use a title that clearly describes the result.
- Link a related Issue when one exists.
- State what you checked and explain anything you could not verify.
- For UI or content changes, include screenshots or a before-and-after description.
- Do not include generated files unless the repository requires them.

### Review

Changes receive review and the required CI checks, but a separate person's GitHub approval is not a universal requirement. See the [shared repository policy](REPOSITORY_POLICY.md) for AI work, CMS updates, scheduled updates, and branch protection.

Maintainers may request changes, split substantial work, or close out-of-scope proposals. Keep review comments specific, actionable, and tied to the project's purpose.
