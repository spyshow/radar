const soap = require("soap");
const CronJobManager = require("cron-job-manager");

const pool = require("./db");
const multiRequest = require("./multiRequest");
const mcalRequest = require("./mcalRequest");

const manager = new CronJobManager();
let machines = [];
let jobs = [];

//fetch machines configrations
function readMachinesConfig() {
  return pool.query("SELECT * FROM machines").then(res => {
    const machines = {};
    res.rows.map(machine => {
      let machine_line = machine.machine_name + "/" + machine.machine_line;
      machines[machine_line] = {
        machineId: machine.uid,
        type: machine.machine_name,
        url: machine.url,
        scantime: machine.scantime
      };
    });
    return machines;
  });
}

readMachinesConfig().then(machines => {
  Object.keys(machines).map((machineName, index) => {
    let scantime = "*/" + machines[machineName].scantime + " * * * *";

    //jobs[index] = schedule.scheduleJob(scantime, function() {
    manager.add(machineName, scantime, () => {
      soap.createClient(
        machines[machineName].url + "/webservice/cwebservice.asmx?wsdl",
        //"http://192.168.0.191/webservice/cwebservice.asmx?wsdl",
        function(err, client) {
          //calling soap api
          client.Counts({}, function(err, xml) {
            console.log(machineName);
            switch (machines[machineName].type) {
              case "MULTI4":
                multiRequest(xml, machines[machineName].machineId);
                break;

              case "MCAL4":
                mcalRequest(xml, machines[machineName].machineId);
                break;

              default:
                console.log("nothing at all");
                break;
            }
          });
        }
      );
    });
    manager.start(machineName);
  });
  return jobs;
});
