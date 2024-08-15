FROM node:12.22.0
COPY test.js .
COPY package.json .
RUN npm install
ENTRYPOINT ["npm", "start"]