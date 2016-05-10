// set up kraken api
var settings = require("./settings.js");
var KrakenClient = require('kraken-api');
var kraken = new KrakenClient(settings.krakenkey,settings.krakenpasscode);

// determine the minimum asset amount to trade (this prevents API errors)
var minTrade = 0.01;

// tolerance determines how much % near hi or low the lasttrade needs to be to begin acting
// NOTE: should NOT be set above 49% for obvious reasons
var buyTolerance = 10;
var sellTolerance = 5;

// set trade asset (bitcoin=XBTC, litecoin=XLTC, ether=XETH), or get from CMDLINE if given
var asset=['XLTC']; // default to litecoin
if (process.argv.length > 2) {
	asset=[process.argv[2]];
}

// add EUR to make the trade pair
var pair = asset+'ZEUR';

//log("Getting ticker info...");
kraken.api('Ticker', {"pair": pair}, function(error, data) {
	
	if(error) {
		//log(error);
	} else {
		var lasttrade = data.result[pair].c[0];
		var daylow = data.result[pair].l[1];
		var dayhi = data.result[pair].h[1];
	
		// see if the difference between current and low/hi is less than tolerated spread
		var distancefromlow = Math.round((lasttrade - daylow) / (dayhi - daylow) * 100);
		var distancefromhi = Math.round((dayhi - lasttrade) / (dayhi - daylow) * 100);

		// output fancy graph
		log(createGraph(distancefromlow, daylow, dayhi, buyTolerance, sellTolerance));
		
		// see if we need to continue buying/selling
		if (distancefromlow <= buyTolerance || distancefromhi <= sellTolerance) {

			kraken.api('Balance', null, function(error, data) {
				if(error) {
					log(error);
				} else {
					var euroBalance = data.result.ZEUR;
					var assetBalance = data.result[asset];

					if (distancefromlow <= buyTolerance) {
						
						// we should buy

						// buy ratio, the closer to 0 the more to buy
						var buyRatio = 1-(distancefromlow/buyTolerance)

						// determine the volume to buy, skip 50 cents for rounding issues
						var volume = ((euroBalance-0.5) / lasttrade) * buyRatio;
						if (volume < 0) volume = 0;

						if (volume >= minTrade) {
							log("[TRADE] Buying " + parseFloat(volume).toFixed(5) + " of " + asset + "...");
							kraken.api('AddOrder', {"pair": pair, "type": "buy", "ordertype": "market", "volume": volume}, function(error, data) {
								if (error) {
									log(error);
								} else {
									// buy successful!
								}
							});
						} else {
							// buy volume too low 
						}
					} else { 
						
						// we should sell

						// sell ratio, the closer to 0 the more to buy
						var sellRatio = 1-(distancefromhi/sellTolerance)

						// determine how much to sell 
						var volume = assetBalance * sellRatio;

						// make sure we are trading decent amounts
						if (volume >= minTrade) {
							log("[TRADE] Selling " + parseFloat(volume).toFixed(5) + " of " + asset + "...");
							kraken.api('AddOrder', {"pair": pair, "type": "sell", "ordertype": "market", "volume": volume}, function(error, data) {
								if (error) {
									log(error);
								} else {
									// sale complete!
								}
							});
						} else {
							// sale volume too low 
						}
					}
				}
			});
		} else {
			// trade tolerances not met
		}
	}
});

// simple log helper function
function log(string) {
	var d = new Date();
	var datestring = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
	console.log(datestring + (asset!=null?" "+asset:null) + " " + string);
}

// fancy graph to quickly see how asset is trading [bbb--*----ss]
function createGraph(distancefromlow, low, hi, buyTolerance, sellTolerance) {
	var width = 28;
	var result = low.substring(0,7) + " [";
	for (i=0;i<=width;i++) {
		if ((i / width) * 100 >= distancefromlow && (i / width) * 100 < distancefromlow + (100 / width))
			result = result + "*";
		else if ((i / width) * 100 < buyTolerance)
			result = result + "b";
		else if ((i / width) * 100 > 100 - sellTolerance)
			result = result + "s";
		else
			result = result + "-";
	}

	result = result + "] " + hi.substring(0,7) + " (" + distancefromlow + "%)";
	return result;
}
