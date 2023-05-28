const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 3000

app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_U}:${process.env.DB_P}@cluster0.rohhp7w.mongodb.net/?retryWrites=true&w=majority`;

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

    let menu = client.db('Epicurean_Eats').collection('Data')
    let reviews = client.db('Epicurean_Eats').collection('reviews')
    let carts =  client.db('Epicurean_Eats').collection('carts')


    app.get('/menu', async(req, res)=>{
        let result = await menu.find().toArray()
        res.send(result);
    })

    app.get('/reviews', async(req, res)=>{
        let result = await reviews.find().toArray()
        res.send(result);
    })

    app.post('/carts', async(req, res)=>{
      let cart = req.body;
      let result = await carts.insertOne(cart);
      res.send(result);
    })

    app.get('/carts', async(req, res)=>{
      let mail = req.query.email;
   
      if(!mail){
        res.send([])
      }
      let query = {email : mail}
      let result = await carts.find(query).toArray();
      res.send(result)
    })


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
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
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})