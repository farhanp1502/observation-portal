FROM node:20 AS build

WORKDIR /app

RUN npm install -g @angular/cli@21.0.0

COPY package*.json ./
RUN npm install --force

COPY . .

RUN ng build --configuration production

FROM node:20 AS final

WORKDIR /usr/src/app

COPY --from=build /app/dist/observation-portal/browser /usr/src/app/dist/observations

COPY --from=build /app/dist/observation-portal/browser/index.html /usr/src/app/dist/index.html

COPY src/assets/env/env.js /usr/src/app/dist/observations/assets/env/env.js

RUN npm install --force -g serve

WORKDIR /usr/src/app/dist

EXPOSE 6006

CMD ["serve", "-s", ".", "-l", "6006"]