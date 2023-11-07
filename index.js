const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mt6zv6m.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // Connect Collection
        const foodCollection = client.db('restaurant').collection('foods');

        /*-------------------- Foods--------------------  */
        //Food read
        app.get('/foods', async (req, res) => {
            const cursor = foodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        // Single Food read
        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await foodCollection.findOne(query);
            res.send(result);
        })
        //Food added
        app.post('/foods', async (req, res) => {
            const newFood = req.body;
            const result = await foodCollection.insertOne(newFood);
            res.send(result);
        })

        /*--------------------Ordered Foods--------------------  */
        const orderedFoodsCollection = client.db('restaurant').collection('orderedFoods');

        // ordered food 
        app.post('/orderedFoods', async (req, res) => {
            const orderedFoods = req.body;
            console.log(orderedFoods);
            const result = await orderedFoodsCollection.insertOne(orderedFoods);
            res.send(result);
        })

        // ordered food seen
        app.get('/orderedFoods', async (req, res) => {
            const cursor = orderedFoodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });








        // jwt token
        app.post('/access-token', async (req, res) => {
            //crating token and send to client

            const user = req.body
            const token = jwt.sign(user, process.env.DB_USER, { expiresIn: 60 * 60 });
            console.log(token);
            res.cookie('token', {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true })

        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




//Testing
app.get('/', (req, res) => {
    res.send('Taste Trial Paradise is running')
})
app.listen(port, () => {
    console.log(`Taste Trial Paradise is running on port: ${port}`);
})