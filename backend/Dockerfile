FROM node:24-alpine

WORKDIR /app

COPY package.json ./

# Instala as dependências 
RUN npm install


COPY . .

# Gera o build estático de produção 
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
