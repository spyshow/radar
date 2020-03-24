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
      //each machine
      let scantime = "*/" + machine.scantime + " * * * *"; // we make a cron time string for the scan time
      let machine_and_line =
        machine.machine_name +
        "_" +
        machine.machine_line.replace(/[^A-Z0-9]/gi, ""); //make a string for the cron name (name of the machine _ number of line) all in capital letters
      manager.add(
        //we add a corn job
        machine_and_line,
        scantime,
        () => {
          //the function to loop in every scan time
          soap.createClient(
            //call the soap API
            machine.url + "/webservice/cwebservice.asmx?wsdl",
            function(err, client) {
              if (typeof client === "undefined") {
                //if the first call for the API it will return an empty respond
                setTimeout(readMachinesConfig, 60000); // call the function again after 60 second
              } else {
                //calling soap api
                client.Counts({}, function(err, xml) {
                  parseString(xml.CountsResult, function(err, result) {
                    if (result == null) {
                      // if the respond is empty
                      setTimeout(readMachinesConfig, 60000); // try again in 60 second
                    } else {
                      let insertQuery;
                      let sensorArray = [];
                      //building the insert statement and array
                      console.log(typeof result.Mold);
                      if (typeof result.Mold === Array) {
                        //building Insert query
                        let insertQuery1 =
                          'INSERT INTO "' +
                          result.Mold.Machine[0].$.id +
                          "_" +
                          machine.machine_line.replace(/[^A-Z0-9]/gi, "") +
                          '" (uid,machine_id, inspected, rejected, mold ,';
                        //start building the values string
                        let insertQuery2 = " VALUES ";
                        let sensorIndex = 1;

                        result.Mold.map(mold, moldIndex => {
                          insertQuery2 += " (uuid_generate_v4(),";
                          for (var i = 0; i < 4; i++) {
                            insertQuery2 += "$" + sensorIndex + ",";
                            sensorIndex++;
                          }
                          machine.sensors.sensors.map((sensor, index) => {
                            //loop through all the sensors
                            for (var i = 0; i < sensor.counter.length; i++) {
                              //loop through the counters of the sensor
                              if (moldIndex == 0) {
                                //loop only at the first time ( to write the sensor_counter names )
                                insertQuery1 +=
                                  sensor.id + "_" + sensor.counter[i].id + ","; //add the name of the sensor_counter
                              }
                              insertQuery2 += "$" + sensorIndex + " ,"; //add the number of the value (ex: $22 )

                              sensorArray[sensorIndex - 5] = s2n(
                                // insert value of counter to sensor array
                                result.Mold.Machine[0].Sensor[index].Counter[i][
                                  "$"
                                ].Nb
                              );

                              sensorIndex++; // increase the index by 1
                            }
                          });

                          insertQuery2 += " NOW(), NOW()),";
                        });
                        insertQuery1 += "created_at, updated_at) "; // finishing the insert statement
                        insertQuery = insertQuery1 + insertQuery2.slice(0, -1);
                      } else {
                        //building Insert query
                        console.log("its an object");
                        let insertQuery1 =
                          'INSERT INTO "' +
                          result.Mold.Machine[0].$.id +
                          "_" +
                          machine.machine_line.replace(/[^A-Z0-9]/gi, "") +
                          '" (uid,machine_id, inspected, rejected, mold ,';

                        //start building the values string
                        let insertQuery2 =
                          " VALUES (uuid_generate_v4(),$1,$2,$3, $4, ";
                        let sensorIndex = 5; // sensor array offset
                        console.log(
                          JSON.stringify(result.Mold.Machine[0], null, 4)
                        );

                        machine.sensors.sensors.map((sensor, index) => {
                          //loop through all the sensors
                          for (var i = 0; i < sensor.counter.length; i++) {
                            //loop through the counters of the sensor
                            insertQuery1 +=
                              sensor.id + "_" + sensor.counter[i].id + ","; //add the name of the sensor_counter

                            insertQuery2 += "$" + sensorIndex + " ,"; //add the number of the value (ex: $22 )

                            sensorArray[sensorIndex - 5] = s2n(
                              // insert value of counter to sensor array
                              result.Mold.Machine[0].Sensor[index].Counter[i][
                                "$"
                              ].Nb
                            );

                            sensorIndex++; // increase the index by 1
                          }
                        });
                        insertQuery1 += "created_at, updated_at) "; // finishing the insert statement
                        insertQuery2 += " NOW(), NOW());";
                        insertQuery = insertQuery1 + insertQuery2;
                        //DONE BUILDING INSERT QUERY

                        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                      }
                      //START GATHERING THE INSERT VALUES
                      let values = [
                        machine.uid,
                        s2n(result.Mold.Machine[0].Inspected),
                        s2n(result.Mold.Machine[0].Rejects),
                        s2n(result.Mold.$.id),
                        ...sensorArray
                      ];
                      //DONE GATHERING THE INSERT VALUES
                      console.log(insertQuery);
                      console.table(sensorArray);
                      //INSERT VALUES TO DB
                      pool
                        .query(insertQuery, values)
                        .then(() => console.log("done!"))
                        .catch(error => console.log(error));
                      //DONE INSERTING VALUES TO DB
                    }
                  });
                });
              }
            }
          );
        },
        { start: true } // start the cron job immediately
      );
    });
  });
}

readMachinesConfig();
