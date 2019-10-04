const express = require('express');
var firebase = require("firebase/app");
require("firebase/database");
var bodyParser = require('body-parser');
const app = express();
var server = require('http').Server(app);
var nemHash=[];
var transMessage=[];

app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.get('/', function (req, res) {
  res.render('index')
})

server.listen(5000);
//app.listen(3000, function () {
//  console.log('Example app listening on port 3000!')
//})

console.log('Server is running on port 3000');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}


//Firebase Code

var firebaseConfig = {
    apiKey: "AIzaSyD7CVxRS816Gqr1KHpVilgEwmeLvmadLdA",
    authDomain: "dekyc-taylors.firebaseapp.com",
    databaseURL: "https://dekyc-taylors.firebaseio.com",
    projectId: "dekyc-taylors",
    storageBucket: "dekyc-taylors.appspot.com",
    messagingSenderId: "291374892016",
    appId: "1:291374892016:web:de7182200032d4c0"
  };

  firebase.initializeApp(firebaseConfig);

// Use require
var nem = require("nem-sdk").default;

// Address to subscribe
var address = "TBCI2A67UQZAKCR6NS4JWAEICEIGEIM72G3MVW5S";

// Private Key
var privateKey = "713ac3986f2283d7bc1792c0496bbc3f73d6af2cef48a8213568a3db085dea12";
 
// Key Pair
var keyPair = nem.crypto.keyPair.create(privateKey);

// Public Key
var publicKey = keyPair.publicKey.toString();

// Create a common object holding key
var common = nem.model.objects.create("common")("5061329as",privateKey)


var userReference = firebase.database().ref("/loginAuth/Admin/KYC");
var username
var passnemHash

// Using sdk data
var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, nem.model.nodes.defaultPort);





async function readUserData(){
  console.log("HTTP Get Request");
	//Attach an asynchronous callback to read the data
	userReference.on("value", 
			  function(snapshot) {
          if(snapshot.val().NemHash == "x"){
					console.log(snapshot.val());

                    
					// Create an un-prepared mosaic transfer transaction object (use same object as transfer tansaction)
					var transferTransaction = nem.model.objects.create("transferTransaction")(address, 1, "Name: "+snapshot.val().Name+"\nIC: "+snapshot.val().IC+"\nGender: "+snapshot.val().Gender+"\nAddress: "+snapshot.val().Address);

					// Prepare the above object
					var transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, nem.model.network.data.testnet.id)
					
					// Serialize transfer transaction and announce
					nem.model.transactions.send(common, transactionEntity, endpoint).then(function(res) {
					console.log(res.transactionHash.data)
					passnemHash = res.transactionHash.data;



                    console.log("HTTP DELETE Request");
                    userReference.remove().then(function() {
                    console.log("Remove succeeded.")
                    })
                    .catch(function(error) {
                    console.log("Remove failed: " + error.message)
                    });


					console.log("HTTP POST Request");

					userReference.update({NemHash: passnemHash}, 
				 	function(error) {
					if (error) {
						console.log("Data could not be updated." + error);
					} 
					else {
						console.log("Data updated successfully.");
					}
			    });

                
					},function(err){
					console.log(err);
					});		
					userReference.off("value");
          }
          else{
            console.log("Data already sent to NEM");
          }}, 
			  function (errorObject) {
					console.log("The read failed: " + errorObject.code);
       });
       
      
}


async function getHashMessage() {
  await sleep(5000);
  //Retrieving NEM Transaction Message by HASH
  var nem = require("nem-sdk").default;
  var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, nem.model.nodes.defaultPort);
  nem.com.requests.transaction.byHash(endpoint, nemHash[0]).then(function(res){
  						//console.log(res);
  						var fmtmsg = nem.utils.format.hexMessage(res.transaction.message)
  						//console.log(fmtmsg);
              transMessage=[];
              transMessage.push(fmtmsg);
  						},function(err){
                nemHash[0]='';
  						  //console.log(err);
  					})
}
getHashMessage();

async function checkForData() {
  var io = require('socket.io').listen(server);
  var flag=0;
  while(true) {
    nemHash=[];

      firebase.database().ref('/loginAuth/Admin/KYC/NemHash').once('value').then(function(snapshot) {
        nemHash=[];
        nemHash.push(snapshot.val());
    });

    await sleep(5000);

    if(nemHash.length>0) {
      var dataLen = nemHash[0].length;
    }

    if(nemHash.length>0 && dataLen>0) {
      console.log('Hash detected');
      getHashMessage();

      io.sockets.on('connection', function (socket) {
            socket.emit('message', transMessage[0]);
      });

    }
    else {
      console.log('Hash not detected');
      readUserData();
      io.sockets.on('connection', function (socket) {
            socket.emit('message', 'Data cannot be retrieved!');
      });
    }
  }
}

checkForData();
