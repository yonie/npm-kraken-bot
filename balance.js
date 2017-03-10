// set up kraken api
var settings = require("./settings.js");
var KrakenClient = require('kraken-api');
var kraken = new KrakenClient(settings.krakenkey,settings.krakenpasscode);

// get trade balance info
kraken.api('TradeBalance', {"asset":"ZEUR"}, function(error, tradeBalanceData) {
	if (!error) log("Trade balance: "+parseFloat(tradeBalanceData.result.eb).toFixed(2));
	// get asset balance
	kraken.api('Balance',null, function(error,balanceData) {
		if (!error) {
			// get ticker info to determine total value
			kraken.api('Ticker', {"pair":"XETCZEUR,XETHZEUR,XLTCZEUR,XREPZEUR,XXBTZEUR,XXLMZEUR,XXMRZEUR,XZECZEUR"}, function(error,tickerData) {
				for (var asset in balanceData.result) {
					if (balanceData.result[asset]!=null && balanceData.result[asset]>=0.00001) {
						var logString = asset+": " + parseFloat(balanceData.result[asset]).toFixed(5);
						if (asset!="ZEUR") logString = logString + " for " + tickerData.result[asset+"ZEUR"].c[0] + " = "+parseFloat(balanceData.result[asset]*tickerData.result[asset+"ZEUR"].c[0]).toFixed(2)+" ZEUR";
						log(logString);
					}
				}
			});
		}
	});	
});

// simple log helper function
function log(string) {
	var d = new Date();
	var datestring = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
	console.log(datestring + " " + string);
}
