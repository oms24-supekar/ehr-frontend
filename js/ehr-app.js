const API_URL = "https://your-backend.onrender.com/api";

async function loadPatients() {
  const res = await fetch(`${API_URL}/patients`);
  const patients = await res.json();
  console.log(patients);
}
