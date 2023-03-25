FROM node:16

WORKDIR /backend

COPY ./dbconnect.js .
COPY ./package.json .
COPY ./package-lock.json . 
COPY . . 

RUN npm install

EXPOSE  5000

CMD ["node", "comments.js"]