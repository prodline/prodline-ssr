FROM node:8

RUN mkdir -p /app/client

WORKDIR /app/client

# copy files
COPY ./.babelrc ./
COPY ./.eslintrc ./
COPY ./index.js ./
COPY ./webpack.config.js ./
COPY ./package.json ./
COPY ./package-lock.json ./

# copy folders
COPY ./src ./src

RUN npm install

EXPOSE 2048

CMD [ "npm", "run", "dev"]
