# Acecore GitHub 共通設定

このリポジトリは、`acecore-systems` Organization の公開プロフィールと
共通コミュニティファイルを管理します。

## 管理ファイル

- `profile/README.md`: GitHub に表示される Organization プロフィール
- `CODE_OF_CONDUCT.md`: 共通の行動規範
- `CONTRIBUTING.md`: 共通のコントリビューションガイド
- `SECURITY.md`: 共通のセキュリティポリシー
- `SUPPORT.md`: 共通のサポート案内
- [REPOSITORY_POLICY.md](REPOSITORY_POLICY.md): レビュー・CMS更新・リポジトリ公開の共通運用方針
- `.github/ISSUE_TEMPLATE/`: 共通の Issue フォーム
- `.github/PULL_REQUEST_TEMPLATE.md`: 共通の Pull Request テンプレート

## 共通設定が使われる条件

この公開リポジトリのデフォルトブランチにある共通ファイルは、`acecore-systems` が
所有するリポジトリで、対応する個別設定がない場合にGitHub上で使われます。
継承先の公開・非公開は問いません。共通ファイルは継承先にコピーされず、cloneにも含まれません。

| 対象                                             | 個別設定との関係                                                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CONTRIBUTING・CODE_OF_CONDUCT・SECURITY・SUPPORT | 各リポジトリにその種類のファイルがあれば個別版を優先します。複数の配置場所が使えるファイルは `.github/` → ルート → `docs/` の順で探します。                           |
| Issue Forms・問い合わせ設定                      | 個別リポジトリの `.github/ISSUE_TEMPLATE/` に有効なテンプレートまたは `config.yml` があれば、共通フォルダーの内容は一切使われません。フォーム単位では合成されません。 |
| PRテンプレート                                   | 個別テンプレートがある場合は個別版を使います。                                                                                                                        |
| `profile/README.md`                              | Organizationの公開プロフィールに表示されます。個別repoのREADMEにはなりません。                                                                                        |

GitHub Actions、`AGENTS.md`、`.github/copilot-instructions.md` は、ここに置くだけでは
他のリポジトリへ自動適用されません。Actionsは各repoにworkflowを配置するか、
呼び出し側を用意して再利用します。エージェント向け指示も必要な各repoで管理してください。

共通設定を使う場合は、個別設定の必要性と差分を確認したうえで、その種類の個別設定を取り除きます。
独自設定が必要な場合は、そのrepoで管理します。特に独自Issue設定では、必要な非公開連絡先も
個別の `config.yml` に記載してください。

詳しくは [GitHubの共通ファイル仕様](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) を参照してください。

## 検証

Node.js 24とnpmを使います。依存関係はlockfileに固定しています。

```sh
npm ci
npm run check
```

`npm run check` は以下を実行します。

- PrettierによるMarkdown・YAML・検証コードの整形確認。
- YAML構文、Issue Formsの基本構造（必須キー・入力型・IDやラベルの重複など）、問い合わせ設定の検証。
- Markdownの通常リンク・画像・参照リンクの相対パス確認。
- 検証処理が誤りを検出できることを確認するテスト。

自動修正は `npm run format`、構造とリンクだけの確認は `npm run check:community` です。
構造検証はGitHubの全仕様を再実装するものではありません。外部URLの応答、見出しアンカー、
HTMLで記述したリンク、GitHub上のフォーム表示は自動チェックの対象外です。
相対パスはこのrepo内に存在するファイルやディレクトリを指す必要があります。

CIはPRと `main` へのpushで `community-check` を実行します。必須チェックとして使うため、
パスによる実行除外や `[skip ci]` は使わないでください。外部サービスの認証情報は不要です。

## 更新手順と影響確認

1. 最新の `origin/main` から専用branch/worktreeを作成し、他の未コミット作業を混ぜずに変更します。
2. Issueは「不具合・タスク」の2種類を基本にし、必須入力やPR本文をむやみに増やしません。
3. `npm run check` と `git diff --check` を実行し、変更した外部リンクの到達先も確認します。
4. 日本語のdraft PRに変更理由・検証結果・適用先への影響を記載します。CI成功後にレビューを受けます。
5. マージ後、Organizationの公開プロフィール、文書リンク、Issue選択画面とフォーム表示を確認します。

継承確認には、共通Issue設定を使う `homepage-hatt` と、独自設定を持つ `acecore-net` を使います。
確認時に各repoのデフォルトブランチの設定を読み、前者には共通変更が反映され、後者の独自フォームは
維持されていることを確認してください。テンプレートの確認だけでIssueを投稿する必要はありません。

初回導入ではPRの `community-check` 成功後に、既存の `main` 保護へ同名チェックを必須として追加します。
無関係な保護項目は変更しません。承認人数やPR必須設定の見直しは、
[共通運用方針](REPOSITORY_POLICY.md)に沿って、CMS・AI作業の更新経路と両立することを確認します。
チェックを改名する場合は、旧名の必須設定がマージを止めないよう、workflowと保護設定を一緒に見直します。
