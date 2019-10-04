var socket = io.connect('http://localhost:3000');
socket.on('message', function(message) {

	if((message)&&(message.length)>30) {
		var transMessage = message.split(/\r?\n/);

		document.getElementById("name").innerHTML = transMessage[0];
		document.getElementById("add").innerHTML = transMessage[1];
		document.getElementById("ic").innerHTML = transMessage[2];
		document.getElementById("gender").innerHTML = transMessage[3];
	}
	else {
		document.getElementById("name").innerHTML = message;
		document.getElementById("add").innerHTML = '';
		document.getElementById("ic").innerHTML = '';
		document.getElementById("gender").innerHTML = '';
	}
})

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function reload() {
	await sleep(5000);
	location.reload(true);
}

reload();
