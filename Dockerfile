FROM node:slim
MAINTAINER James Lal [:lightsofapollo]
COPY . /npm-cache
WORKDIR /npm-cache
RUN npm install && npm run-script prepublish && npm link
ENTRYPOINT ["/npm-cache/entrypoint.sh"]
