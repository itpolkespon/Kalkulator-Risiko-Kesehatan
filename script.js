console.log("script.js loaded");

let logamData = [];

function toggleInputs() {
  const jenis = document.getElementById("jenisRisiko").value;
  const rfdBox = document.getElementById("rfdBox");
  const sfBox = document.getElementById("sfBox");

  if (jenis === "non") {
    rfdBox.style.display = "block";
    sfBox.style.display = "none";
  } else {
    rfdBox.style.display = "none";
    sfBox.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  toggleInputs();
  loadLogamData();
});

// Load logam.json
function loadLogamData() {
  fetch('data/logam.json')
    .then(res => res.json())
    .then(data => {
      logamData = data;
      const select = document.getElementById("logam");
      data.forEach(l => {
        const opt = document.createElement("option");
        opt.value = l.name;
        opt.textContent = l.name;
        select.appendChild(opt);
      });
      updateRfDSF();
    });
}

function updateRfDSF() {
  const selected = document.getElementById("logam").value;
  const jenis = document.getElementById("jenisRisiko").value;
  const logam = logamData.find(l => l.name === selected);
  if (!logam) return;
  if (jenis === "non") document.getElementById("RfD").value = logam.RfD;
  else document.getElementById("SF").value = logam.SF;
}

document.getElementById("logam").addEventListener("change", updateRfDSF);
document.getElementById("jenisRisiko").addEventListener("change", updateRfDSF);

function hitungRisiko() {
  const jenis = document.getElementById("jenisRisiko").value;
  const Wb = parseFloat(document.getElementById("Wb").value);

  if (isNaN(Wb) || Wb <= 0) { alert("Masukkan berat badan valid"); return; }

  // Ingestion
  const C_air = parseFloat(document.getElementById("C_air").value) || 0;
  const R_air = parseFloat(document.getElementById("R_air").value) || 0;

  const C_food = parseFloat(document.getElementById("C_food").value) || 0;
  const R_food = parseFloat(document.getElementById("R_food").value) || 0;

  const C_drink = parseFloat(document.getElementById("C_drink").value) || 0;
  const R_drink = parseFloat(document.getElementById("R_drink").value) || 0;

  // Inhalation
  const C_air_inh = parseFloat(document.getElementById("C_air_inh").value) || 0;
  const R_air_inh = parseFloat(document.getElementById("R_air_inh").value) || 0;

  // Dermal
  const C_dermal = parseFloat(document.getElementById("C_dermal").value) || 0;
  const SA = parseFloat(document.getElementById("SA").value) || 0;
  const AF = parseFloat(document.getElementById("AF").value) || 0;

  // Durasi rata-rata (avgT) untuk ADKL, 70 tahun * 365 hari
  const avgT = 70 * 365;

  // Intake ingestion
  const intake_ingestion = ((C_air * R_air) + (C_food * (R_food/1e6)) + (C_drink * R_drink)) / Wb;

  // Intake inhalation
  const intake_inh = (C_air_inh * R_air_inh) / Wb;

  // Intake dermal
  const intake_dermal = (C_dermal * SA * AF) / Wb;

  // Total intake
  const intake_total = intake_ingestion + intake_inh + intake_dermal;

  const hasil = document.getElementById("hasil");
  hasil.className = "result";

  let output = `<b>Total Intake ADKL:</b> ${intake_total.toExponential(3)} mg/kg/hari<br>`;

  if (jenis === "non") {
    const RfD = parseFloat(document.getElementById("RfD").value);
    if (isNaN(RfD) || RfD <= 0) { alert("Masukkan RfD valid"); return; }
    const HQ = intake_total / RfD;
    hasil.classList.add(HQ <= 1 ? "safe" : "risk");
    output += `<b>Hazard Quotient (HQ):</b> ${HQ.toFixed(2)}<br>
               <b>Status Risiko:</b> ${HQ <= 1 ? "AMAN" : "TIDAK AMAN"}`;
  } else {
    const SF = parseFloat(document.getElementById("SF").value);
    if (isNaN(SF) || SF <= 0) { alert("Masukkan SF valid"); return; }
    const ECR = intake_total * SF;
    let status = "";
    if (ECR <= 1e-6) status = "Risiko Rendah";
    else if (ECR <= 1e-4) status = "Risiko Sedang";
    else status = "Risiko Tinggi";
    hasil.classList.add(ECR <= 1e-6 ? "safe" : "risk");
    output += `<b>Excess Cancer Risk (ECR):</b> ${ECR.toExponential(3)}<br>
               <b>Status Risiko:</b> ${status}`;
  }

  hasil.innerHTML = output;

  // Update Chart
  updateChart(intake_ingestion, intake_inh, intake_dermal);
}

// Chart JS
let chart;
function updateChart(ing, inh, dermal) {
  const ctx = document.getElementById('riskChart').getContext('2d');
  const data = {
    labels: ['Ingestion','Inhalation','Dermal'],
    datasets: [{
      label: 'Intake (mg/kg/hari)',
      data: [ing, inh, dermal],
      backgroundColor: ['#007bff','#ffc107','#28a745']
    }]
  };
  if(chart) chart.destroy();
  chart = new Chart(ctx, { type: 'bar', data });
}
