# Claude Code プロジェクトガイドライン

## プロジェクト概要
このプロジェクトはNext.js 15、React 19、TypeScript、Tailwind CSS 4を使用したWebアプリケーションです。

## コードスタイルガイドライン

### TypeScript
- 厳密な型定義を使用する
- `any`型の使用を避ける
- インターフェースとタイプエイリアスを適切に使い分ける
- JSDocコメントでパブリックAPIを文書化する

### React/Next.js
- 関数コンポーネントとReact Hooksを使用する
- App Routerを使用する（pages routerは使用しない）
- Server ComponentsとClient Componentsを適切に使い分ける
- `use client`ディレクティブは必要な場合のみ使用する

### スタイリング
- Tailwind CSSを使用する
- カスタムCSSは最小限に抑える
- レスポンシブデザインを考慮する

## レビュー基準

### セキュリティ
- XSS、CSRF、SQLインジェクションなどの脆弱性をチェック
- 環境変数の適切な使用を確認
- APIキーやシークレットの露出を防ぐ

### パフォーマンス
- 不要な再レンダリングを避ける
- 適切なメモ化（useMemo、useCallback）の使用
- 画像最適化とNext.js Imageコンポーネントの使用
- バンドルサイズの最適化

### アクセシビリティ（優先度は低い）
- セマンティックHTMLの使用
- ARIA属性の適切な使用
- キーボードナビゲーションのサポート

## 好ましいパターン

### ファイル構造
```
src/
  app/           # App Router pages
  components/    # 再利用可能なコンポーネント
  lib/          # ユーティリティ関数
  types/        # TypeScript型定義
  hooks/        # カスタムHooks
```

### コンポーネント設計
- 単一責任の原則に従う
- プロップスの型を明確に定義する
- デフォルトプロップスを適切に設定する
- エラーハンドリングを含める

### 状態管理
- ローカル状態にはuseStateを使用
- 複雑な状態にはuseReducerを検討
- グローバル状態が必要な場合はContext APIを使用

## 避けるべきパターン
- 直接的なDOM操作
- インラインスタイルの過度な使用
- 巨大なコンポーネント
- 深いネストしたプロップスドリリング
