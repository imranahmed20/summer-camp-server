const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9qf7kmv.mongodb.net/?retryWrites=true&w=majority`;

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


        const userCollection = client.db('summerDb').collection('users')
        const classCollection = client.db('summerDb').collection('instructor')
        const instructorCollection = client.db('summerDb').collection('class')
        const addClassCollection = client.db('summerDb').collection('classes')

        // 
        app.get('/class', async (req, res) => {
            const result = await classCollection.find().toArray()
            res.send(result)
        })

        app.get('/instructor', async (req, res) => {
            const result = await instructorCollection.find().toArray()
            res.send(result)
        })






        // save user email and role in mongodb
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body
            const query = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user
            }
            const result = await userCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })

        // add classes 
        app.get('/classes', async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }
            const query = { email: email }
            const result = await addClassCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/classes', async (req, res) => {
            const item = req.body;
            const result = addClassCollection.insertOne(item)
            res.send(result)
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
    res.send('Summer Camp is running')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})