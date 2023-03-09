import { Socket } from 'dgram';
import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
app.use(express.static('public'));

//set __dirname
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

//websocket
import { Server } from 'socket.io';
const io = new Server(server);


//pocketbase config
import PocketBase from 'pocketbase';


/*  main modules import  */
import post from './post.mjs';



/*  main logic  */

io.on('connection', (socket) => {
    socket.on('postd', (data) => {
        console.log(data);
        post(data);

    });
});

// Prints: 6


//pocketbase auth middleware
app.use(async (req, res, next) => {
    req.pb = new PocketBase('http://127.0.0.1:8090');
    // load cookie
    req.pb.authStore.loadFromCookie(req.headers.cookie)
    console.log(req.headers.cookie);
    req.pb.authStore.onChange(() => {
        res.setHeader("Set-Cookie", req.pb.authStore.exportToCookie({ httpOnly: false }));
    })
    console.log(req.pb.authStore.isValid);
    try {
        //  auth state by refreshing the loaded auth model
        if (req.pb.authStore.isValid) {
            await req.pb.collection('users').authRefresh();
        }
    } catch (err) {
        console.log("REFRESH error (mostly likely due to expired token)", err);

        // clear auth store
        req.pb.authStore.clear();
    }
    next();
})


app.get("/", async function (req, res) {
    return res.sendFile(__dirname + '/src/index.html');

});

app.get("/app", async function (req, res) {
    if (!req.pb.authStore.isValid) {
        console.log(req.pb.authStore.isValid);
        return res.redirect('http://localhost:3000/');
    }
    console.log(req.pb.authStore.isValid);
    res.sendFile(__dirname + '/src/app.html');
});

app.get("/login", async function (req, res) {
    if (!req.pb.authStore.isValid) {
        return res.sendFile(__dirname + '/src/login.html');
    }

    res.redirect('http://localhost:3000/app');
});

app.get("/register", async function (req, res) {
    return res.sendFile(__dirname + '/src/register.html');

});

app.get("/user", async function (req, res) {
    return res.sendFile(__dirname + '/src/user-p.html');

});

app.get("/test", async function (req, res) {
    return res.sendFile(__dirname + '/src/test.html');

});

//404
app.use((req, res, next) => {
    res.status(404).sendFile(__dirname + '/src/test.html');
})

server.listen(3001, '10.0.0.10', () => {
    console.log('listening on *:3000');
});
