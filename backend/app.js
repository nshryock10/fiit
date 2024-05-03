const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./routes');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

//---- 
require('dotenv').config();

const OpenAI  = require('openai');
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

//---

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const prod_URL = 'https://fiit-8a6ab7670425.herokuapp.com';
const dev_URL = 'http://localhost:3001';
const prod_URL2 = 'https://app.tryfiit.com';
const prod_URL3 = 'https://fiit-zyfn.vercel.app';
const io = socketIo(server , {
    cors: {
        origin: ['https://fiit-ei55.onrender.com', 'https://www.tryfiit.com'],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Access-Control-Allow-Origin",  "Access-Control-Allow-Credentials"],
        credentials: true,
    }
})

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../', 'build')));

io.on('connection', (socket) => {
    console.log('user connected', socket.id);

    socket.join('data-room');

    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

})

app.use((res, req, next) => {
    req.io = io;
    next();
})

app.post("/chat", async (req, res, next) => {
    const message = req.body.message;
     try{
     //send a status that the request was accepted while we wait
     res.status(202).send('Working on your request');
 
     //ping chatGPT api
     const completion = await openai.chat.completions.create({
         model: "gpt-3.5-turbo",
         messages: [{role: "user", content: message}],
     });
     console.log('finished',completion)
     
     io.to('data-room').emit('finish', 200, [completion.choices[0].message, completion.choices[0].finish_reason]);
     //res.status(200).send([completion.data.choices[0].message, completion.data.choices[0].finish_reason])
     
     }catch(error){
         console.log('error', error)
         //console.log(error.response.status)
         res.status(error.response.code || 500).send(error.response.statusText)
     }
 
     
 })

app.use('/', router);

server.listen(process.env.PORT || PORT, () => {
    console.log("Express server listening on port in %s mode", app.settings.env);
  });