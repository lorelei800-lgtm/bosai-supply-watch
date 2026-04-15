# 防災備蓄ウォッチ (bosai-supply-watch)

避難所の開設状況・備蓄量をリアルタイムで確認できる防災情報Webアプリ。

Re:Earth CMSをバックエンドに使い、行政担当者が備蓄を管理・更新。市民はスマホから避難所の状況を確認できる。

## 特徴

- **ゲーム風ポリゴングラフィック** — Minecraft/Stardew Valley風の3Dブロックで備蓄量を直感的に表示
- **モバイルファースト** — 老若男女が使いやすいシンプルUI
- **デュアル構成** — 市民向け（読み取り専用）と行政向け（更新可能）を同一コードで切り替え
- **国土数値情報対応** — P20（避難施設）データで避難所を一括登録

## 技術スタック

- React 18 + TypeScript + Vite
- Tailwind CSS（UIライブラリなし）
- MapLibre GL + OpenStreetMap
- Re:Earth CMS（REST API）

## セットアップ

```bash
cd app
npm install
cp .env.example .env
# .env を編集して Re:Earth CMS の認証情報を入力
npm run dev
```

## Re:Earth CMS モデル設計

### shelter モデル
| フィールドキー | 型 | 説明 |
|---|---|---|
| `name` | Text | 施設名 |
| `address` | Text | 住所 |
| `lat` / `lng` | Number | 緯度・経度 |
| `capacity` | Integer | 最大収容人数 |
| `current_occupancy` | Integer | 現在の避難人数 |
| `shelter_types` | Select (multi) | 対応災害種別 |
| `is_open` | Boolean | 開設中フラグ |
| `kokudo_id` | Text | 国土数値情報ID |

### supply-snapshot モデル
| フィールドキー | 型 | 説明 |
|---|---|---|
| `shelter_id` | Text | 避難所ID |
| `food_portions` / `food_capacity` | Integer | 食料（食分） |
| `water_liters` / `water_capacity` | Integer | 飲料水（L） |
| `blankets_count` / `blankets_capacity` | Integer | 毛布（枚） |
| `diapers_count` / `diapers_capacity` | Integer | おむつ（パック） |
| `medicine_count` / `medicine_capacity` | Integer | 医薬品（セット） |
| `generators_count` / `generators_capacity` | Integer | 発電機（台） |

## 国土数値情報からの初期データ投入

1. [国土数値情報ダウンロードサービス](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P20-v2_1.html) から P20 GeoJSON をダウンロード
2. `data/kokudo-shelters-raw.geojson` に配置
3. `.env` に `VITE_CMS_TOKEN` を設定

```bash
# 千代田区の避難所のみ投入（テスト用）
node app/scripts/seed-shelters.mjs --municipality 13101 --limit 10
```

## 環境変数

| 変数名 | 説明 |
|---|---|
| `VITE_CMS_BASE_URL` | Re:Earth CMS API URL |
| `VITE_CMS_PROJECT` | `workspace/project` 形式 |
| `VITE_CMS_SHELTER_MODEL` | シェルターモデルのエイリアス（デフォルト: `shelter`） |
| `VITE_CMS_SUPPLY_MODEL` | 備蓄モデルのエイリアス（デフォルト: `supply-snapshot`） |
| `VITE_CMS_TOKEN` | 書き込み用トークン（管理者ビルドのみ設定） |

## デュアルビルド戦略

```bash
# 市民向けビルド（トークンなし → 読み取り専用）
VITE_CMS_TOKEN= npm run build

# 管理者向けビルド（トークンあり → 備蓄更新可能）
VITE_CMS_TOKEN=your_token npm run build
```
