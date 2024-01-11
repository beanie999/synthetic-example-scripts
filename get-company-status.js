/**
 * Check the status page for multiple companies and save the details back to New Relic events.
 * Add the company names to the array and query the 3 events!
 */

var assert = require('assert');
var request = require('request');
var eventName = "NewRelicStatus";
var eventIncident = "NewRelicStatusIncident";
var eventMaintenance = "NewRelicStatusMaintenance";
// Set the right endpoint according to your DC
var newRelicPostEndPoint = "https://insights-collector.eu01.nr-data.net/v1/accounts/" + $secure.NR_ACCOUNT_ID + "/events";
var companies = ['newrelic'];

function sendResults(data, company) {
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
    console.log(company + " - Insert " + data[0].eventType + " response: " + response.body);
  });
}

function decorate(arr, evnt, company, ind, desc, updates) {
  for (var i = 0; i < arr.length; i++) {
    arr[i].eventType = evnt;
    arr[i].company = company;
    arr[i].syntheticLocation = $env.LOCATION;
    arr[i].overallIndicator = ind;
    arr[i].overallDescription = desc;
    if (updates) {
      arr[i].update_body = arr[i].incident_updates[0].body;
      arr[i].update_created_at = arr[i].incident_updates[0].created_at;
      arr[i].update_display_at = arr[i].incident_updates[0].display_at;
      arr[i].update_id = arr[i].incident_updates[0].id;
      arr[i].update_updated_at = arr[i].incident_updates[0].updated_at;
    }
  }
}

function getStatus(company) {
  $http.get('https://status.' + company + '.com/api/v2/summary.json',
    // Callback
    function (err, response, body) {
      assert.equal(response.statusCode, 200, 'Expected a 200 OK response');
      console.log("Status for " + company + ": " + JSON.stringify(body.status));
      var data = body.components;
      decorate(data, eventName, company, body.status.indicator, body.status.description, false);
      sendResults(data, company);
      if (body.incidents.length > 0) {
        var incident = body.incidents;
        decorate(incident, eventIncident, company, body.status.indicator, body.status.description, true);
        sendResults(incident, company);
      }
      else {
        console.log("No incidents found for " + company + ".");
      }
      if (body.scheduled_maintenances.length > 0) {
        var maintenance = body.scheduled_maintenances;
        delete maintenance.incident_updates;
        decorate(maintenance, eventMaintenance, company, body.status.indicator, body.status.description, true);
        sendResults(maintenance, company);
      }
      else {
        console.log("No scheduled maintenance events found for " + company + ".")
      }
      $util.insights.set(company + 'StatusIndicator', body.status.indicator);
      $util.insights.set(company + 'StatusDescription', body.status.description);
    }
  );
}

for (var c = 0; c < companies.length; c++) {
  getStatus(companies[c]);
}
