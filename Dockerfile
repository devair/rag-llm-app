FROM node:24-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Compila o TypeScript gerando a pasta /app/dist
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
