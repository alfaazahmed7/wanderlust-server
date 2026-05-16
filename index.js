const express = require("express");
const dontenv = require("dotenv");
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dontenv.config();

const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//middlewere
const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Forbidden' });
    }
}

async function run() {
    try {
        // await client.connect();

        const db = client.db('wanderlust');
        const destinationCollection = db.collection('destinations');
        const bookingsCollection = db.collection('bookings');

        app.get('/destination', async (req, res) => {
            const result = await destinationCollection.find().toArray();
            res.json(result);
        });

        app.get('/destination/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await destinationCollection.findOne({
                _id: new ObjectId(id),
            });
            res.json(result);
        });

        app.post('/destination', async (req, res) => {
            const destinationData = req.body;
            const result = await destinationCollection.insertOne(destinationData);
            res.json(result);
        });

        app.patch('/destination/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const updatedData = req.body;
            const result = await destinationCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            res.json(result);
        });

        app.delete('/destination/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await destinationCollection.deleteOne(
                { _id: new ObjectId(id) }
            );
            res.json(result);
        });

        app.post('/bookings', verifyToken, async (req, res) => {
            const bookingData = req.body;
            const result = await bookingsCollection.insertOne(bookingData);
            res.json(result);
        });

        app.get('/bookings/:userId', verifyToken, async (req, res) => {
            const { userId } = req.params;
            const result = await bookingsCollection.find({ userId: userId }).toArray();
            res.json(result);
        });

        app.delete('/bookings/:bookingId', verifyToken, async (req, res) => {
            const { bookingId } = req.params;
            const result = await bookingsCollection.deleteOne({
                _id: new ObjectId(bookingId)
            });
            res.json(result);
        });

        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello WorldDDD!')
})

app.listen(PORT, () => {
    console.log(`Example app listening on PORT ${PORT}`)
})