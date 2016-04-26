FROM docker.kroger.com/library/kroger-npm

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

EXPOSE 3002

#VOLUME ["/app/stubs", "/app/server.js"]

ENTRYPOINT ["npm"]

CMD ["start"]
