const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000
const app = express()

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fx40ttv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const database = client.db("job-management");
    const jobsCollection = database.collection("jobs");
    const jobsBidCollection = database.collection("jobs-bid");





    app.get('/', (req, res) => {
      res.send('hello..')
    })
    app.post('/jobs', async (req, res) => {
      const body = req.body;
      const result = await jobsCollection.insertOne(body);
      res.send(result)
    })
    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { authorEmail: email }
      }
      const result = await jobsCollection.find(query).toArray()
      res.send(result)
    })


    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })
    app.put('/jobs/:id', async (req, res) => {
      const id = req.params.id
      const body = req.body;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: body
      }
      const optional = { upsert: true }
      const result = await jobsCollection.updateOne(filter, updateDoc, optional)
      res.send(result)
    })
    app.delete('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.deleteOne(query)
      res.send(result);
    })


    // job bid api
    app.post('/jobs-bid', async (req, res) => {
      const bidRequest = req.body;
      const result = await jobsBidCollection.insertOne(bidRequest)
      let newBid = 0;
      const findJob = await jobsCollection.findOne({ _id: new ObjectId(bidRequest.job_id) })
      if (findJob.total_bids) {
        newBid = findJob.total_bids + 1
      }
      else {
        newBid = 1
      }
      const filter = { _id: new ObjectId(bidRequest.job_id) }
      const updateDoc = {
        $set: { total_bids: newBid }
      }
      const updateBidCount = await jobsCollection.updateOne(filter, updateDoc)
      res.send(updateBidCount)
    })

    app.get('/jobs-bid', async (req, res) => {
      const email = req.query.email;
      let query = {}
      if (email) {
        query = { bidEmail: email }
      }
      const result = await jobsBidCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/all-jobs-bid-request/:email', async (req, res) => {
      const email = req.params.email;
      const findAllEmailDatas = await jobsCollection.find({ authorEmail: email }).toArray();
      for (const data of findAllEmailDatas) {
        const id = data._id.toString()
        const matchJobIdDatas = await jobsBidCollection.find({ job_id: id }).toArray()
        console.log(matchJobIdDatas);
      }
      // res.send(result)
    })






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => console.log(`Server running on port ${port}`))
