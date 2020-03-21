const soap = require("soap");
const parseString = require("xml2js").parseString;

const pool = require("./db");

function learnSensors(url, machineName, machineId) {
  const sensorObj = { sensors: [] };
  let insertQuery =
    "CREATE TABLE " +
    machineName +
    " ( uid uuid NOT NULL, machine_id integer, ";
  soap.createClient(
    url + "/webservice/cwebservice.asmx?wsdl",
    //"http://192.168.0.191/webservice/cwebservice.asmx?wsdl",
    function(err, client) {
      if (typeof client === "undefined") {
        setTimeout(learnSensors, 60000);
      } else {
        //calling soap api
        client.Counts({}, function(err, xml) {
          parseString(xml.CountsResult, function(err, result) {
            if (result == null) {
              setTimeout(learnSensors, 60000);
            } else {
              let machine = result.Mold.Machine[0];

              machine.Sensor.map((sensor, index) => {
                let counters = [];
                let sensorName = sensor.$.id;
                for (let i = 0; i < Object.keys(sensor.Counter).length; i++) {
                  insertQuery +=
                    sensorName +
                    "_" +
                    sensor.Counter[i]["$"].id.replace(/[^A-Z0-9]/gi, "") +
                    " integer,";
                  let counterId = sensor.Counter[i]["$"].id.replace(
                    /[^A-Z0-9]/gi,
                    ""
                  );
                  counters.push({ id: counterId });
                }
                sensorObj.sensors.push({ id: sensorName, counter: counters });
              });
              insertQuery +=
                "created_at timestamp with time zone,updated_at timestamp with time zone, " +
                "CONSTRAINT " +
                machineName +
                "_pkey PRIMARY KEY (uid), " +
                "CONSTRAINT " +
                machineName +
                "_machine_id_fkey FOREIGN KEY (machine_id) " +
                "REFERENCES public.machines (uid) MATCH SIMPLE " +
                "ON UPDATE NO ACTION " +
                "ON DELETE NO ACTION);";
              const updateQuery = `UPDATE public.machines
                SET sensors=$1
                WHERE uid=$2;`;
              console.log(machineId, JSON.stringify(sensorObj, null, 4));
              const updateValues = [sensorObj, machineId];
              pool
                .query(insertQuery)
                .then(() => {
                  pool.query(updateQuery, updateValues);
                })
                .catch(error => console.log(error));
            }
          });
        });
      }
    }
  );
}

learnSensors("http://192.168.0.191", "MULTI4_M21", 1);
