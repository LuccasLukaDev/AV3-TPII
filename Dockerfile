
FROM node:24

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN DATABASE_URL="mysql://user:password@localhost:3306/cinebridge" npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
