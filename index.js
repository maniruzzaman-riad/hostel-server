const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hmuvaqm.mongodb.net/?retryWrites=true&w=majority`;

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
        const mealsCollection = client.db("hosteldb").collection("meals")
        const userCollection = client.db("hosteldb").collection("users")

        // middlewares
        const verifyToken = (req,res,next)=>{
            if(!req.headers.authorization){
                return res.status(401).send({message:'forbiden access'})
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
                if(err){
                    return res.status(401).send({message:'forbiden access'})
                }
                req.decoded = decoded;
                next()
            })
        }

        // jwt related api
        app.post('/jwt', verifyToken, async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
            res.send({ token })
        })

        app.get('/meals', async (req, res) => {
            const result = await mealsCollection.find().toArray()
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        app.get(`/users/:id`, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.findOne(query)
            res.send(result)
        })

        app.post('/meals', async (req, res) => {
            const newMeal = req.body;
            // console.log(newProduct);
            const result = await mealsCollection.insertOne(newMeal);
            res.send(result);
        })
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            // console.log(newProduct);
            const query = { email: newUser.email }
            const isUserExist = await userCollection.findOne(query)
            if (isUserExist) {
                return res.send({ message: "User already Exist" })
            }
            const result = await userCollection.insertOne(newUser);
            res.send(result);
        })

        app.patch(`/users/admin/:id`, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result);
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


app.get('/', (req, res) => {
    res.send('Hostel app is runing')
})

app.listen(port, () => {
    console.log(`Hostel app is runing from ${port}`);
})