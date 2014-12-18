FROM lightsofapollo/node:v0-10-33
MAINTAINER James Lal [:lightsofapollo]
COPY . /npm-cache

# Install pip mostly so gaia can run...
RUN apt-get install -y python-pip git-core && pip install virtualenv

WORKDIR /npm-cache
RUN npm install && npm run-script prepublish && npm link
ENTRYPOINT ["/npm-cache/entrypoint.sh"]
