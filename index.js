const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send(({ error: true, message: "Unauthorized access" }))
    }

    // const token = authorization.split(' ')[1]
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: "Unauthorized access" })

        }
        req.decoded = decoded;
        next()

    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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


        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })

        })

        // class relate api
        app.get('/class', async (req, res) => {
            const result = await classCollection.find().toArray()
            res.send(result)
        })

        app.get('/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await classCollection.findOne(query)
            res.send(result)
        })


        app.post('/class', async (req, res) => {
            const newClass = req.body;
            const result = await classCollection.insertOne(newClass)
            res.send(result)
        })
        // 
        app.get('/instructor', async (req, res) => {
            const result = await instructorCollection.find().toArray()
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)

            res.send(user)
        })

        // security added

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return send({ admin: false })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const result = { admin: user?.role === "admin" }
            res.send(result)
        })

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        //instructor
        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return send({ instructor: false })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const result = { instructor: user?.role == "instructor" }
            res.send(result)
        })

        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'instructor'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // student
        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return send({ instructor: false })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const result = { instructor: user?.role == "instructor" }
            res.send(result)
        })

        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'instructor'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
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
        app.get('/classes', verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(401).send({ error: true, message: 'forbidden access' })

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


        app.delete('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await addClassCollection.deleteOne(query)
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