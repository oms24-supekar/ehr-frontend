const API_URL = "https://ehr-backed.onrender.com";

async function loadPatients() {
  const res = await fetch(`${API_URL}/patients`);
  const patients = await res.json();
  console.log(patients);
}
