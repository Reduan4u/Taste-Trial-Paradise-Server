const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        origin: [
            'http://localhost:5173',
            'https://taste-trial-paradise.web.app'
        ],
        credentials: true,
    }
));

const verify = (req, res, next) => {
    const { token } = req.cookies;
    console.log("token", token);
    if (!token) {
        return res.status(401).send({ message: "unauthorized" });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            res.status(403).send({ message: "forbidden" });
        }
        req.user = decoded;
        next();
    });
};


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mt6zv6m.mongodb.net/?retryWrites=true&w=majority`;
//console.log(uri);

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
        // await client.connect();

        // jwt token
        app.post('/jwt', async (req, res) => {
            //crating token and send to client
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 60 * 60 });
            console.log(token);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

            })
                .send({ success: true });
        })





        /*-------------------- Foods--------------------  */
        const foodCollection = client.db('restaurant').collection('foods');


        //Food read
        app.get('/foods', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            let queryObj = {}
            //let sortObj = {}
            const category = req.query.category;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;
            const priceFilter = req.query.price;
            const countryFilter = req.query.country;

            if (category) {
                queryObj.category = category;
            }
            if (sortField && sortOrder) {
                sortObj[sortField] = sortOrder;
            }
            if (priceFilter) {
                queryObj.price = { $lte: parseFloat(priceFilter) };
            }
            if (countryFilter) {
                queryObj.country = countryFilter;
            }

            const cursor = foodCollection.find(queryObj).sort();
            const result = await cursor
                .skip(page * size)
                .limit(size)
                .toArray();
            res.send(result);
        });



        // foods count
        app.get('/foodsCount', async (req, res) => {
            const count = await foodCollection.estimatedDocumentCount();
            res.send({ count });
        })


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

        //food update (showing)
        app.put('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedFood = req.body;
            const foods = {
                $set: {
                    name: updatedFood.name,
                    category: updatedFood.category,
                    foodOrigin: updatedFood.foodOrigin,
                    price: updatedFood.price,
                    rating: updatedFood.rating,
                    image: updatedFood.image,
                    quantity: updatedFood.quantity,
                    tags: updatedFood.tags,
                    description: updatedFood.description,
                    userEmail: updatedFood.userEmail,
                    madeBy: updatedFood.madeBy,
                }
            }
            const result = await foodCollection.updateOne(filter, foods, options);
            res.send(result);
        });


        /*--------------------Ordered Foods--------------------  */
        const orderedFoodsCollection = client.db('restaurant').collection('orderedFoods');
        // ordered food add

        app.post('/orderedFoods', async (req, res) => {
            const orderedFoods = req.body;
            console.log(orderedFoods);
            const result = await orderedFoodsCollection.insertOne(orderedFoods);
            res.send(result);
        })

        // ordered food seen
        app.get("/orderedFoods", verify, async (req, res) => {

            /* const user = req.body.email;
            console.log(user, req.user.email);

            if (user !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            let query = {};
            if (req.query.userEmail) {
                query = { userEmail: req?.query.userEmail };
            } */
            const result = await orderedFoodsCollection.find().toArray();
            res.send(result);
        });




        app.get("/orderedFoods/:id", async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };
            const result = await orderedFoodsCollection.findOne(query);
            console.log(result);
            res.send(result);
        });

        //ordered food remove
        app.delete('/orderedFoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await orderedFoodsCollection.deleteOne(query);
            res.send(result);
        });












        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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