// set up kraken api
var settings = require("./settings.js");
var KrakenClient = require('kraken-api');
var kraken = new KrakenClient(settings.krakenkey,settings.krakenpasscode);

// get ticker info
kraken.api('TradeBalance', {"asset":"ZEUR"}, function(error, data) {
	if (!error) log("Trade balance: "+parseFloat(data.result.eb).toFixed(2));
	kraken.api('Balance',null, function(error,data) {
		if (!error) for (var asset in data.result)
			if (data.result[asset]>=0.00001) log(asset+": "+ parseFloat(data.result[asset]).toFixed(5));
	});	
});

// simple log helper function
function log(string) {
	var d = new Date();
	var datestring = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
	console.log(datestring + " " + string);
}
