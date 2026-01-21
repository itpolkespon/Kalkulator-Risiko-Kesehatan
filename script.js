console.log("script.js loaded");

// Global variable untuk data logam
let logamData = {};

// Load data logam dari JSON eksternal
fetch('data/logam.json')
  .then(response => response.json())
  .then(data => {
    logamData = data;
    document.getElementById('dataVersion').innerText = "Data versi: " + data.version;

    const logamSelect = document.getElementById('logam');
    for (let metal in data) {
      if (metal !== "version") {
        let option = document.createElement('option');
        option.value = metal;
        option.text = metal + " (" + data[metal].info + ")";
        logamSelect.add(option);
      }
    }

    // Set default RfD/SF/BAF saat logam dipilih
    logamSelect.addEventListener('change', () => {
      const selected = logamSelect.value;
      if (logamData[selected]) {
        document.getElementById('RfD').value = logamData[selected].RfD;
        document.getElementById('SF').value = logamData[selected].SF;
        document.getElementById('BAF').value = logamData[selected].BAF;
      }
    });
  });

// Toggle input RfD / SF
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

document.addEventListener("DOMContentLoaded", toggleInputs);

// Fungsi utama hitung risiko
function hitungRisiko() {
  const Wb  = parseFloat(document.getElementById("Wb").value);
  const UF  = parseFloat(document.getElementById("UF").value) || 1;
  const BAF = parseFloat(document.getElementById("BAF").value) || 1;

  const jenis = document.getElementById("jenisRisiko").value;
  const logam = document.getElementById("logam").value;

  if (!logam || !logamData[logam]) {
    alert("Pilih logam berat yang valid.");
    return;
  }

  // Intake Ingestion
  const C_air   = parseFloat(document.getElementById("C_air").value) || 0;
  const R_air   = parseFloat(document.getElementById("R_air").value) || 0;
  const C_food  = parseFloat(document.getElementById("C_food").value) || 0;
  const R_food  = parseFloat(document.getElementById("R_food").value) || 0;
  const C_drink = parseFloat(document.getElementById("C_drink").value) || 0;
  const R_drink = parseFloat(document.getElementById("R_drink").value) || 0;

  let intake_ingestion = (C_air*R_air + C_food*R_food + C_drink*R_drink) / Wb;

  // Intake Inhalation
  const C_airu = parseFloat(document.getElementById("C_airu").value) || 0;
  const R_airu = parseFloat(document.getElementById("R_airu").value) || 0;
  let intake_inhalation = (C_airu * R_airu) / Wb;

  // Intake Dermal
  const C_dermal = parseFloat(document.getElementById("C_dermal").value) || 0;
  const SA = parseFloat(document.getElementById("SA").value) || 0;
  const AF = parseFloat(document.getElementById("AF").value) || 0;
  let intake_dermal = (C_dermal * SA * AF) / Wb;

  // Total intake
  let total_intake = (intake_ingestion + intake_inhalation + intake_dermal) * BAF;

  const hasil = document.getElementById("hasil");
  hasil.className = "result";

  let output = `<b>Total Intake (mg/kg/hari):</b> ${total_intake.toExponential(3)}<br>`;

  if (jenis === "non") {
    const RfD = parseFloat(document.getElementById("RfD").value);
    if (isNaN(RfD) || RfD <= 0) {
      alert("Masukkan nilai RfD yang valid");
      return;
    }
    const HQ = total_intake / (RfD * UF);
    hasil.classList.add(HQ <= 1 ? "safe" : "risk");
    output += `<b>Hazard Quotient (HQ):</b> ${HQ.toFixed(2)}<br>
               <b>Status Risiko:</b> ${HQ <= 1 ? "AMAN" : "TIDAK AMAN"}`;
  } else {
    const SF = parseFloat(document.getElementById("SF").value);
    if (isNaN(SF) || SF <= 0) {
      alert("Masukkan nilai SF yang valid");
      return;
    }
    const ECR = total_intake * SF;
    let status = "";
    if (ECR <= 1e-6) status = "Risiko Rendah";
    else if (ECR <= 1e-4) status = "Risiko Sedang";
    else status = "Risiko Tinggi";

    hasil.classList.add(ECR <= 1e-6 ? "safe" : "risk");
    output += `<b>Excess Cancer Risk (ECR):</b> ${ECR.toExponential(3)}<br>
               <b>Status Risiko:</b> ${status}`;
  }

  hasil.innerHTML = output;
  hasil.scrollIntoView({behavior: "smooth"});
}

// Fungsi download CSV hasil perhitungan
function downloadCSV() {
  const hasil = document.getElementById("hasil").innerText;
  const blob = new Blob([hasil], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "hasil_risiko.csv";
  link.click();
}
