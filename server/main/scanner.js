const soap = require("soap");
const parseString = require("xml2js").parseString;
const CronJobManager = require("cron-job-manager");
const manager = new CronJobManager();

const pool = require("./db");

// function to change string to number
let s2n = string => {
  return parseInt(string, 10);
};

//fetch machines configrations
function readMachinesConfig() {
  return pool.query("SELECT * FROM machines").then(res => {
    res.rows.map(machine => {
      let scantime = "*/" + machine.scantime + " * * * *";
      let machine_and_line =
        machine.machine_name +
        "_" +
        machine.machine_line.replace(/[^A-Z0-9]/gi, "");
      manager.add(
        machine_and_line,
        scantime,
        () => {
          soap.createClient(
            machine.url + "/webservice/cwebservice.asmx?wsdl",
            //"http://192.168.0.191/webservice/cwebservice.asmx?wsdl",
            function(err, client) {
              if (typeof client === "undefined") {
                setTimeout(readMachinesConfig, 60000);
              } else {
                //calling soap api
                client.Counts({}, function(err, xml) {
                  parseString(xml.CountsResult, function(err, result) {
                    if (result == null) {
                      setTimeout(readMachinesConfig, 60000);
                    } else {
                      //building Insert query
                      let insertQuery1 =
                        "INSERT INTO " +
                        result.Mold.Machine[0].$.id +
                        "_" +
                        machine.machine_line.replace(/[^A-Z0-9]/gi, "") +
                        " (uid,machine_id, inspected, rejected, ";
                      let insertQuery2 = "VALUES (uuid_generate_v4(),$1,$2,$3,";
                      let sensorIndex = 4;
                      machine.sensors.sensors.map((sensor, index) => {
                        for (var i = 0; i < sensor.counter.length; i++) {
                          insertQuery1 +=
                            sensor.id + "_" + sensor.counter[i].id + ",";
                          insertQuery2 += "$" + sensorIndex + " ,";
                          sensorIndex++;
                        }
                      });
                      insertQuery1 += "created_at, updated_at) ";
                      insertQuery2 += " NOW(), NOW());";
                      //DONE BUILDING INSERT QUERY

                      //START GATHERING THE INSERT VALUES

                      //DONE GATHERING THE INSERT VALUES

                      //INSERT VALUES TO DB

                      //DONE INSERTING VALUES TO DB
                    }
                  });
                });
              }
            }
          );
        },
        { start: true }
      );
    });
  });
}

readMachinesConfig();
