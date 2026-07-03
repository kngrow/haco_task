バージョンをsemverに従ってbumpする。

## 手順

1. `src-tauri/tauri.conf.json` の `version` フィールドを読み取る
2. 今回の変更内容（git diffやコミット履歴）を確認し、変更の種類を判定する:
   - **バグ修正・不具合対応** → patch bump（例: 1.3.2 → 1.3.3）
   - **機能追加** → minor bump（例: 1.3.3 → 1.4.0、patchは0にリセット）
3. 判定結果と新バージョンをユーザーに提示し、確認を取る
4. 確認後、`src-tauri/tauri.conf.json` の `version` を更新する

## ルール

- 対象ファイルは `src-tauri/tauri.conf.json` のみ
- major bumpは行わない（ユーザーが手動で行う）
- 判断に迷う場合はユーザーに確認する
