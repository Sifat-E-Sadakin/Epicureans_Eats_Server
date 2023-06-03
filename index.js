const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 3000

app.use(cors());
app.use(express.json())

let verifyJWT = (req, res, next)=>{
  let authorization = req.headers.authorization;
  if (!authorization){
    return res.status(401).send({error: true, message : "unauthorized access" });
  }
  let token = authorization.split(' ')[1];

  jwt.verify(token, process.env.WEB_TOKEN, (err, decoded)=>{
    if (err){
      return res.status(403).send({error: true, message : "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    let users =  client.db('Epicurean_Eats').collection('users')


    let verifyAdmin = async (req, res, next)=>{
      let email = req.decoded.email
      // console.log(email);
      let query = { email : email}
      let user = await users.findOne(query);
      if(user?.role != 'admin'){
        return res.status(403).send({err: true, msg: 'forbidden'})
      }
      next();
    }

    app.post('/jwt', (req, res)=>{
      let user = req.body;
      let token = jwt.sign(user, process.env.WEB_TOKEN, {expiresIn: '1h'} )
      res.send({token})

    })

    // Menu APIs
    app.get('/menu', async(req, res)=>{
        let result = await menu.find().toArray()
        res.send(result);
    })

    app.delete('/menu/:id',verifyJWT, verifyAdmin, async (req, res)=>{
      let id  = req.params.id;
      let query = { _id : new ObjectId(id)}
      let result = await menu.deleteOne(query);
      res.send(result);
    })

    app.post('/menu',verifyJWT, verifyAdmin, async (req, res)=>{
      let item = req.body;
      let result = await menu.insertOne(item);
      res.send(result);
    })

    app.get('/reviews', async(req, res)=>{
        let result = await reviews.find().toArray()
        res.send(result);
    })

    app.post('/carts',  async(req, res)=>{
      let cart = req.body;
      let result = await carts.insertOne(cart);
      res.send(result);
    })

    app.get('/carts', verifyJWT, async(req, res)=>{
      let mail = req.query.email;
   
      if(!mail){
        res.send([])
      }
      let query = {email : mail}
      let result = await carts.find(query).toArray();
      res.send(result)
    })

    app.delete('/carts/:id', async(req, res)=>{
      let id = req.params.id;
      let query = {_id : new ObjectId(id)}
      let result = await carts.deleteOne(query);
      res.send(result)
    })

    // users APIs 

    app.post('/users', async(req, res)=>{
      let user = req.body;
      let query = {email : user.email}
      let oldUser = await users.findOne(query);
      if(oldUser){
        return;
      }
      let result = await users.insertOne(user);
      res.send(result);
    })

    app.get('/users', async (req, res)=>{
      let result = await users.find().toArray();
      res.send(result);
    })

    app.patch('/users/admin/:id', async(req, res)=>{
      let id = req.params.id;
      let filter = { _id : new ObjectId(id)};
      let updateRole = {
        $set: {
          role : 'admin'
        }
      }
      let result = await users.updateOne(filter, updateRole);
      res.send(result)
    })

    app.get('/users/isadmin', async (req, res)=>{
      let email = req.query.email;

      let query = {email : email}
      let user =  await users.findOne(query);



      let result = { admin : user?.role == 'admin' }
      res.send(result);

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