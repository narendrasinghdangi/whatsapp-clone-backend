import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//App config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1471949",
    key: "034359d6f42c5b3e503b",
    secret: "693ae9a2a0dcfff25b37",
    cluster: "eu",
    useTLS: true,
});

//middleware
app.use(express.json());
app.use(cors());


//DB config
const connection_url =
    "mongodb+srv://admin:Jq7hZgcbu0CnFkei@cluster0.vxzzsz8.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => {
    console.log("DB Connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("A change occured ", change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        } else {
            console.log("Error triggering pusher");
        }
    });
});

//API route
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

//Lister
app.listen(port, () => console.log(`listing on localhost ${port}`));

//PAss--Jq7hZgcbu0CnFkei
