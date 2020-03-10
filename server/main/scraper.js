var soap = require("soap");
var schedule = require("node-schedule");
const parseString = require("xml2js").parseString;
var pool = require("./db");

let machines = [];
//let machine_line = machine.machine_name + "/" + machine.machine_line;
//machines[machine_line] = { url: machine.url, scantime: machine.scantime };

//fetch machines configrations
function machines_config() {
  return pool.query("SELECT * FROM machines").then(res => {
    const machines = [];
    res.rows.map(machine => {
      let machine_line = machine.machine_name + "/" + machine.machine_line;
      console.log(machine_line);
      machines[machine_line] = { url: machine.url, scantime: machine.scantime };
    });
    return machines;
  });
}

machines_config().then(res => {
  console.log(res);
});
