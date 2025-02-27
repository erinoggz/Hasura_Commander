# Use the predefined node base image for this application.
FROM node:23.0.0

WORKDIR '/app'

# This will copy from docker cache unless the package.json file has changed
COPY package.json .

# Install node dependencies
RUN yarn

COPY . .

RUN yarn global add typescript && yarn global add ts-node

RUN yarn run build

# Command to run the application
ENTRYPOINT ["ts-node", "app.ts"]

# Default arguments that can be overridden
CMD ["-e", "http://127.0.0.1:8090/", "-s", "HAadminsecret"]
