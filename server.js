const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')

require('dotenv').config();const url = process.env.MONGODB_URI;
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(url, { useUnifiedTopology: true });
client.connect();


const PORT = process.env.PORT || 5000;  

const app = express();

app.set('port', (process.env.PORT || 5000));

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(    'Access-Control-Allow-Headers',    'Origin, X-Requested-With, Content-Type, Accept, Authorization'  );
    res.setHeader(    'Access-Control-Allow-Methods',    'GET, POST, PATCH, DELETE, OPTIONS'  );  
    next();
});

app.post('/api/addcard', async (req, res, next) =>
{
  // incoming: userId, color
  // outgoing: error
	
  const { userId, card } = req.body;

  const newCard = {Card:card,UserId:userId};
  var error = '';

  try
  {
    const db = client.db();
    const result = db.collection('Cards').insertOne(newCard);
  }
  catch(e)
  {
    error = e.toString();
  }

//   cardList.push( card );

  var ret = { error: error };
  res.status(200).json(ret);
});

app.post('/api/login', async (req, res, next) => 
{
  // incoming: login, password
  // outgoing: id, firstName, lastName, error

 var error = '';

  const { login, password } = req.body;

  const db = client.db();
  const results = await db.collection('Users').find({Login:login,Password:password}).toArray();

  var id = -1;
  var fn = '';
  var ln = '';

  if( results.length > 0 )
  {
    id = results[0].id;
    fn = results[0].firstName;
    ln = results[0].lastName;
  }
else
{
    error = "none found";
}

  var ret = { id:id, firstName:fn, lastName:ln, error:error}; 
  res.status(200).json(ret);
});

app.post('/api/register', async (req, res, next) => 
{
    // incoming: login, password
    // outgoing: id, firstName, lastName, error
    var error = 'OK';
    const { login, password, id, firstName, lastName} = req.body;
    const newCard = {Login:login,Password:password, id:id, firstName:firstName, lastName:lastName};
    try{
    const db = client.db();
    const results = await db.collection('Users').insertOne(newCard);
    }
    catch(err)
    {
        error = err;
    }
    var ret = {error:error}; 
    res.status(200).json(ret);
});

app.post('/api/searchcards', async (req, res, next) => 
{
  // incoming: userId, search
  // outgoing: results[], error

  var error = '';

  const { userId, search } = req.body;

  var _search = search.trim();
  try{
      const db = client.db();
      const results = await db.collection('Cards').find({"Card":{$regex:_search, $options:'i'}}).toArray();
    var _ret = [];
      for( var i=0; i<results.length; i++ )
      {
        _ret.push( results[i].Card );
      }
  }
    catch(error)
    {
        error= "no cards found at all";
    }
  
  
  var ret = {results:_ret, error:error};
  res.status(200).json(ret);
});

app.listen(PORT, () => {  console.log('Server listening on port ' + PORT);});


///////////////////////////////////////////////////// For Heroku deployment
// Server static assets if in production
if (process.env.NODE_ENV === 'production') {  // Set static folder  
    app.use(express.static('frontend/build'));
    app.get('*', (req, res) =>  {    
        res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));  
    });
}