var soap = require("soap");
var schedule = require("node-schedule");
const parseString = require("xml2js").parseString;
var inspected = 0,
  rejects = 0,
  other = 0,
  stone = 0,
  blister = 0,
  drawn = 0,
  density = 0,
  lightBottom = 0,
  chockedNeck = 0,
  mark = 0;

var url = "http://192.168.0.191/webservice/cwebservice.asmx?wsdl";
var args = {};
schedule.scheduleJob("*/1 * * * *", function() {
  soap.createClient(url, function(err, client) {
    client.Counts(args, function(err, xml) {
      parseString(xml.CountsResult, function(err, result) {
        inspected += parseInt(result.Mold.Machine[0].Inspected[0], 10);
        rejects += parseInt(result.Mold.Machine[0].Rejects[0], 10);
        console.log(`inspected: ${inspected} and rejected: ${rejects} `);
        console.log(
          `stone:         ${(stone += parseInt(
            result.Mold.Machine[0].Sensor[0].Counter[1]["$"].Nb
          ))}\n
           Blister:       ${(blister += parseInt(
             result.Mold.Machine[0].Sensor[0].Counter[2]["$"].Nb
           ))}\n
           Drawn:         ${(drawn += parseInt(
             result.Mold.Machine[0].Sensor[0].Counter[3]["$"].Nb
           ))}\n
           Density:       ${(density += parseInt(
             result.Mold.Machine[0].Sensor[0].Counter[4]["$"].Nb
           ))}\n
           Light bottom:  ${(lightBottom += parseInt(
             result.Mold.Machine[0].Sensor[0].Counter[5]["$"].Nb
           ))}\n
           Chocked neck:  ${(chockedNeck += parseInt(
             result.Mold.Machine[0].Sensor[0].Counter[6]["$"].Nb
           ))}\n
           Mark:          ${(mark += parseInt(
             result.Mold.Machine[0].Sensor[0].Counter[7]["$"].Nb
           ))}\n
           Other:         ${(other += parseInt(
             result.Mold.Machine[0].Sensor[0].Counter[0]["$"].Nb
           ))}\n
           `
        );
      });
    });
  });
});
