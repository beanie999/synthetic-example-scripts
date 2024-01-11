/**
 * Check the Kevel status and save it back to the New Relic events called KevelStatus.
 */

var assert = require('assert');
var request = require('request');
var eventName = "KevelStatus";
// Set the right endpoint according to your DC
var newRelicPostEndPoint = "https://insights-collector.eu01.nr-data.net/v1/accounts/" + $secure.NR_ACCOUNT_ID + "/events";

function sendResults(data) {
  var options = {
    'method': 'POST',
    'url': newRelicPostEndPoint,
    'headers': {
      'Api-Key': $secure.NR_INSERT_LICENSE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log("Response from New Relic: " + response.body);
  });
}

$http.get('https://status.kevel.co/api/v2/status.json',
  {
  },
  // Callback
  function (err, response, body) {
    assert.equal(response.statusCode, 200, 'Expected a 200 OK response');
    console.log('Response from Kevel:', body);
    
    var event = {};
    event.eventType = eventName;
    event.pageId = body.page.id;
    event.pageName = body.page.name;
    event.pageURL = body.page.url;
    event.pageTimeZone = body.page.time_zone;
    event.pageUpdatedAt = body.page.updated_at;
    event.statusIndicator = body.status.indicator;
    event.statusDescription = body.status.description;
    
    sendResults(event);
  }
);
