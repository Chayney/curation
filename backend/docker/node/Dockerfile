FROM node:20-alpine

WORKDIR /app

COPY ../../node/package*.json .
# package.jsonとpackage-lock.jsonとの整合性を統一
RUN npm install --frozen-lockfile

# nodemonはコードの変更を監視して自動的にサーバーを再起動するツール
RUN npm install -g nodemon

COPY ../../node/ .

# コンテナ起動時に毎回npm run devを実行
# package.jsonでnodemonに指定のファイルを監視させサーバーを再起動するよう設定
CMD ["npm", "run", "dev"]