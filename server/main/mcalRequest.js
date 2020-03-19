const parseString = require("xml2js").parseString;
const pool = require("./db");

// function to change string to number
let s2n = string => {
  return parseInt(string, 10);
};

function formatAMPM() {
  var d = new Date(),
    minutes =
      d.getMinutes().toString().length == 1
        ? "0" + d.getMinutes()
        : d.getMinutes(),
    hours =
      d.getHours().toString().length == 1 ? "0" + d.getHours() : d.getHours(),
    ampm = d.getHours() >= 12 ? "pm" : "am",
    months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    days[d.getDay()] +
    " " +
    months[d.getMonth()] +
    " " +
    d.getDate() +
    " " +
    d.getFullYear() +
    " " +
    hours +
    ":" +
    minutes +
    ampm
  );
}

const mcalRequest = (xml, machineId) => {
  // from xml to json
  parseString(xml.CountsResult, function(err, result) {
    //insert query string
    let queryString = `INSERT INTO public.mcal4( 
      uid, machine_id, inspected, rejected, sidewall_total_reject, dim_total_reject, stress_total_reject, lowcontrast_total_reject, sidewall_other, sidewall_compact, sidewall_blister, sidewall_drawn, sidewall_sideobject, sidewall_density, sidewall_thin, sidewall_birdswing, sidewall_wings, dim_verticality, dim_diameter, dim_height, dim_verticality1, dim_verticality2, dim_verticality3, dim_diameter1, dim_diameter2, dim_diameter3, dim_diameter4, dim_diameter5, dim_diameter6, dim_height1, dim_height2, lowcontrast_transition, lowcontrast_nolearningparameters, lowcontrast_deformation, lowcontrast_error, lowcontrast_blackimage, stress_stress, stress_error, stress_blackimage, created_at, updated_at)
      VALUES (uuid_generate_v4(),$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, NOW(), NOW());`;

    // declaration of sensors arrays  to make it easy to make a value array to insert
    let sidewallArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      dimArray = [0, 0, 0, 0],
      lowcontrastArray = [0, 0, 0, 0, 0],
      stressArray = [0, 0, 0],
      sidewall,
      dim,
      lowcontrast,
      stress;

    // declaring sensor object for mcal
    if (result == null) return;
    let mcal4Result = result.Mold.Machine[0];

    result.Mold.Machine[0].Sensor.map((sensor, index) => {
      switch (sensor.$.id) {
        case "Sidewall":
          sidewall = sensor;
          for (let i = 0; i < Object.keys(sidewall.Counter).length; i++) {
            sidewallArray[i] = s2n(sidewall.Counter[i]["$"].Nb);
          }
          break;

        case "Dim":
          dim = sensor;
          // declaring sensor defects for dim to dimArray
          for (let i = 0; i < Object.keys(dim.Counter).length; i++) {
            dimArray[i] = s2n(dim.Counter[i]["$"].Nb);
          }
          break;

        case "Low contrast":
          lowcontrast = sensor;
          for (let i = 0; i < Object.keys(lowcontrast.Counter).length; i++) {
            lowcontrastArray[i] = s2n(lowcontrast.Counter[i]["$"].Nb);
          }
          break;

        case "Stress":
          stress = sensor;
          for (let i = 0; i < Object.keys(stress.Counter).length; i++) {
            stressArray[i] = s2n(stress.Counter[i]["$"].Nb);
          }
          break;

        default:
          break;
      }
    });
    console.table(sidewallArray);
    console.table(dimArray);
    console.table(lowcontrastArray);
    console.table(stressArray);

    let values = [
      machineId,
      s2n(mcal4Result.Inspected[0]),
      s2n(mcal4Result.Rejects[0]),
      typeof sidewall !== "undefined" ? s2n(sidewall.Rejects[0]) : 0,
      typeof dim !== "undefined" ? s2n(dim.Rejects[0]) : 0,
      typeof lowcontrast !== "undefined" ? s2n(lowcontrast.Rejects[0]) : 0,
      typeof stress !== "undefined" ? s2n(stress.Rejects[0]) : 0,
      ...sidewallArray,
      ...dimArray,
      ...lowcontrastArray,
      ...stressArray
    ];
    console.table(values);
    pool.query(queryString, values).catch(error => console.log(error));
  });
};

module.exports = mcalRequest;
