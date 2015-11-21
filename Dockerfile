FROM taskcluster/base-test:0.1.1
MAINTAINER Aus Lacroix [:nullaus]
COPY . /npm-cache

WORKDIR /npm-cache
RUN npm install && npm run-script prepublish && npm link
ENTRYPOINT ["/npm-cache/entrypoint.sh"]
