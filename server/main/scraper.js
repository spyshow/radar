const soap = require("soap");
const schedule = require("node-schedule");
const CronJobManager = require("cron-job-manager");
const parseString = require("xml2js").parseString;
const pool = require("./db");

const manager = new CronJobManager();
let machines = [];
let jobs = [];

// function to change string to number
let s2n = string => {
  return parseInt(string, 10);
};

//fetch machines configrations
function readMachinesConfig() {
  return pool.query("SELECT * FROM machines").then(res => {
    const machines = {};
    res.rows.map(machine => {
      let machine_line = machine.machine_name + "/" + machine.machine_line;
      machines[machine_line] = {
        machineId: machine.uid,
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
        "http://192.168.0.191/webservice/cwebservice.asmx?wsdl",
        //machines[machineName].url + "/webservice/cwebservice.asmx?wsdl",
        function(err, client) {
          //calling soap api
          client.Counts({}, function(err, xml) {
            //making request for count
            parseString(xml.CountsResult, function(err, result) {
              // from xml to json
              console.log(JSON.stringify(result, null, 4));

              //insert query string
              let queryString = `INSERT INTO public.multi4( 
              uid,machine_id, inspected, rejected, mcf_reject, csbc_reject, spike_reject, stress_reject, mcf_other, mcf_stone, mcf_blister, mcf_drawn,  mcf_density,mcf_lightbottom, mcf_chockedneck, mcf_mark, csbc_registration, csbc_lineoverfinish, csbc_internalblister1, csbc_internalblister2, csbc_externalblister, csbc_scalyfinish, csbc_sugarytop, csbc_overpressed1, csbc_overpressed2, csbc_unrolled, csbc_unfilledfinish1, csbc_unfilledfinish2, csbc_unfilledfinish3, csbc_internalblackdefect, csbc_surfaceblackdefect, csbc_externalblackdefect, spike_other, spike_stone, spike_blister, spike_drawn, spike_density, spike_lightbottom, spike_chockedneck, spike_mark, stress_stress, stress_error, stress_blackimage, created_at, updated_at)
              VALUES (uuid_generate_v4(),$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, NOW(), NOW());`;

              // declaration of sensors arrays  to make it easy to make a value array to insert
              let mcfArray = [],
                csbcArray = [],
                spikeArray = [],
                stressArray = [];

              // declaring sensor object for multi
              let multi4Result = result.Mold.Machine[0];

              // declaring sensor object for mcf
              let mcf =
                result.Mold.Machine[0].Sensor[0].$.id == "Mcf"
                  ? result.Mold.Machine[0].Sensor[0]
                  : null;
              // declaring sensor defects for mcf to mcfArray
              for (let i = 0; i < Object.keys(mcf.Counter).length; i++) {
                mcfArray[i] = s2n(mcf.Counter[i]["$"].Nb);
              }

              // declaring sensor object for csbc,csbclo or crb
              let csbc =
                result.Mold.Machine[0].Sensor[1].$.id == "Csbc" ||
                result.Mold.Machine[0].Sensor[1].$.id == "Csbclo" ||
                result.Mold.Machine[0].Sensor[1].$.id == "Crb"
                  ? result.Mold.Machine[0].Sensor[1]
                  : null;

              // declaring sensor defects for csbc,csbclo or crb to csbcArray
              for (let i = 0; i < Object.keys(csbc.Counter).length; i++) {
                csbcArray[i] = s2n(csbc.Counter[i]["$"].Nb);
              }
              // declaring sensor object for stress to stressArray if it is active
              if (result.Mold.Machine[0].Sensor[2].$.id == "Stress") {
                let stress = result.Mold.Machine[0].Sensor[2];
                // declaring sensor defects for stress to stressArray
                for (let i = 0; i < Object.keys(stress.Counter).length; i++) {
                  stressArray[i] = s2n(stress.Counter[i]["$"].Nb);
                }
                // if spike is activated,// declaring sensor object for spike
                if (result.Mold.Machine[0].Sensor[3]) {
                  let spike = result.Mold.Machine[0].Sensor[3];

                  // declaring sensor object for spike to spikeArray
                  for (let i = 0; i < Object.keys(spike.Counter).length; i++) {
                    spikeArray[i] = s2n(spike.Counter[i]["$"].Nb);
                  }
                } else {
                  //if spike is not active put 0 in all it's sensor values
                  spikeArray = [0, 0, 0, 0, 0, 0, 0, 0];
                }
              } else {
                // declaring sensor object for spike to spikeArray
                let spike = result.Mold.Machine[0].Sensor[2];

                // declaring sensor object for spike to spikeArray
                for (let i = 0; i < Object.keys(spike.Counter).length; i++) {
                  spikeArray[i] = s2n(spike.Counter[i]["$"].Nb);
                }

                //if stress is activated
                if (result.Mold.Machine[0].Sensor[3].$.id == "Stress") {
                  let stress = result.Mold.Machine[0].Sensor[3];
                  for (let i = 0; i < Object.keys(stress.Counter).length; i++) {
                    stressArray[i] = s2n(stress.Counter[i]["$"].Nb);
                  }
                } else {
                  stressArray[i] = [0, 0, 0];
                }
              }

              let values = [
                machines[machineName].machineId,
                s2n(multi4Result.Inspected[0]),
                s2n(multi4Result.Rejects[0]),
                typeof mcf !== "undefined" ? s2n(mcf.Rejects[0]) : 0,
                typeof csbc !== "undefined" ? s2n(csbc.Rejects[0]) : 0,
                typeof spike !== "undefined" ? s2n(spike.Rejects[0]) : 0,
                typeof stress !== "undefined" ? s2n(stress.Rejects[0]) : 0,
                ...mcfArray,
                ...csbcArray,
                ...spikeArray,
                ...stressArray
              ];
              return pool
                .query(queryString, values)
                .catch(error => console.log(error));
            });
          });
        }
      );
    });
    manager.start(machineName);
  });
  return jobs;
});
