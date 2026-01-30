const API_URL = "https://ehr-backed.onrender.com";

async function loadPatients() {
  const res = await fetch(`${API_URL}/patients`);
  const patients = await res.json();
  console.log(patients);
}
class ComprehensiveEHRApp {
    constructor() {
        this.currentPatientId = null;
        this.currentSection = 'dashboard';
        this.currentEHRTab = 'overview';
        this.patients = [];
        this.appointments = [];
        this.medications = [];
        this.vitals = [];
        this.labResults = [];
        this.soapNotes = [];
        this.messages = [];
        this.prescriptions = [];
        this.diseaseHistory = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAllData();
        this.showSection('dashboard');
        this.updateDashboardStats();
        this.initializeCharts();
    }

    bindEvents() {
        // Navigation events
        document.getElementById('dashboardBtn').addEventListener('click', () => this.showSection('dashboard'));
        document.getElementById('patientsBtn').addEventListener('click', () => this.showSection('patients'));
        document.getElementById('appointmentsBtn').addEventListener('click', () => this.showSection('appointments'));
        document.getElementById('labResultsBtn').addEventListener('click', () => this.showSection('labResults'));
        document.getElementById('messagesBtn').addEventListener('click', () => this.showSection('messages'));
        document.getElementById('analyticsBtn').addEventListener('click', () => this.showSection('analytics'));

        // Quick action buttons
        document.getElementById('addPatientBtn').addEventListener('click', () => this.showAddPatientModal());
        document.getElementById('addPatientBtnSecondary').addEventListener('click', () => this.showAddPatientModal());
        document.getElementById('scheduleAppointmentBtn').addEventListener('click', () => this.showScheduleAppointmentModal());
        document.getElementById('scheduleAppointmentBtnSecondary').addEventListener('click', () => this.showScheduleAppointmentModal());
        document.getElementById('addLabResultBtn').addEventListener('click', () => this.showAddLabResultModal());
        document.getElementById('addLabResultBtnSecondary').addEventListener('click', () => this.showAddLabResultModal());
        document.getElementById('sendMessageBtn').addEventListener('click', () => this.showComposeMessageModal());
        document.getElementById('composeMessageBtn').addEventListener('click', () => this.showComposeMessageModal());

        // Modal close events
        document.getElementById('closePatientModal').addEventListener('click', () => this.hideModal('patientDetailsModal'));
        document.getElementById('closePatientFormModal').addEventListener('click', () => this.hideModal('patientFormModal'));
        document.getElementById('closeAppointmentFormModal').addEventListener('click', () => this.hideModal('appointmentFormModal'));
        document.getElementById('closeVitalsFormModal').addEventListener('click', () => this.hideModal('vitalsFormModal'));

        // Form events
        document.getElementById('patientForm').addEventListener('submit', (e) => this.handlePatientFormSubmit(e));
        document.getElementById('appointmentForm').addEventListener('submit', (e) => this.handleAppointmentFormSubmit(e));
        document.getElementById('vitalsForm').addEventListener('submit', (e) => this.handleVitalsFormSubmit(e));

        // Search and filter events
        document.getElementById('searchBtn').addEventListener('click', () => this.searchPatients());
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchPatients();
        });

        // Appointment filters
        document.getElementById('applyAppointmentFilters').addEventListener('click', () => this.filterAppointments());

        // EHR tab navigation
        document.querySelectorAll('.ehr-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchEHRTab(e.target.dataset.tab));
        });

        // Cancel form buttons
        document.getElementById('cancelPatientForm').addEventListener('click', () => this.hideModal('patientFormModal'));
        document.getElementById('cancelAppointmentForm').addEventListener('click', () => this.hideModal('appointmentFormModal'));
        document.getElementById('cancelVitalsForm').addEventListener('click', () => this.hideModal('vitalsFormModal'));

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
                const modals = ['patientDetailsModal', 'patientFormModal', 'appointmentFormModal', 'vitalsFormModal'];
                modals.forEach(modalId => {
                    if (e.target.id === modalId) {
                        this.hideModal(modalId);
                    }
                });
            }
        });
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        document.getElementById(`${sectionName}Section`).classList.remove('hidden');

        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-medical-blue', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });

        const activeBtn = document.getElementById(`${sectionName}Btn`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-medical-blue', 'text-white');
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        switch(sectionName) {
            case 'patients':
                this.loadPatients();
                break;
            case 'appointments':
                this.loadAppointments();
                break;
            case 'labResults':
                this.loadLabResults();
                break;
            case 'messages':
                this.loadMessages();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'dashboard':
                this.loadDashboard();
                break;
        }
    }

    async loadAllData() {
        try {
            this.showLoading();
            
            // Load all data in parallel
            const [patients, appointments, medications, vitals, labResults, soapNotes, messages, prescriptions, diseaseHistory] = await Promise.all([
                this.fetchData('patients'),
                this.fetchData('appointments'),
                this.fetchData('medications'),
                this.fetchData('vitals'),
                this.fetchData('lab_results'),
                this.fetchData('soap_notes'),
                this.fetchData('messages'),
                this.fetchData('prescriptions'),
                this.fetchData('disease_history')
            ]);

            this.patients = patients;
            this.appointments = appointments;
            this.medications = medications;
            this.vitals = vitals;
            this.labResults = labResults;
            this.soapNotes = soapNotes;
            this.messages = messages;
            this.prescriptions = prescriptions;
            this.diseaseHistory = diseaseHistory;

        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error loading application data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async fetchData(tableName) {
        try {
            const response = await fetch(`tables/${tableName}`);
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return [];
        }
    }

    async updateDashboardStats() {
        const today = new Date().toDateString();
        
        // Calculate stats
        const totalPatients = this.patients.length;
        const todayAppointments = this.appointments.filter(apt => 
            new Date(apt.appointment_date).toDateString() === today
        ).length;
        
        const activeCases = this.diseaseHistory.filter(disease => 
            disease.status === 'Active' || disease.status === 'Under Treatment'
        ).length;
        
        const activeMedications = this.medications.filter(med => 
            med.status === 'Active'
        ).length;
        
        const pendingLabs = this.labResults.filter(lab => 
            lab.status === 'Pending'
        ).length;
        
        const unreadMessages = this.messages.filter(msg => 
            msg.status === 'Unread'
        ).length;

        // Update DOM
        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('todayAppointments').textContent = todayAppointments;
        document.getElementById('activeCases').textContent = activeCases;
        document.getElementById('activeMedications').textContent = activeMedications;
        document.getElementById('pendingLabs').textContent = pendingLabs;
        document.getElementById('unreadMessages').textContent = unreadMessages;
    }

    loadDashboard() {
        this.updateDashboardStats();
        this.loadTodaysSchedule();
        this.loadCriticalAlerts();
    }

    loadTodaysSchedule() {
        const today = new Date().toDateString();
        const todaysAppointments = this.appointments.filter(apt => 
            new Date(apt.appointment_date).toDateString() === today
        ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

        const container = document.getElementById('todaysSchedule');
        
        if (todaysAppointments.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No appointments scheduled for today</p>';
            return;
        }

        container.innerHTML = todaysAppointments.map(apt => {
            const patient = this.patients.find(p => p.id === apt.patient_id);
            const time = new Date(apt.appointment_date).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <div class="font-medium">${time} - ${patient ? patient.first_name + ' ' + patient.last_name : 'Unknown Patient'}</div>
                        <div class="text-sm text-gray-600">${apt.appointment_type} • ${apt.doctor_name || 'Dr. TBD'}</div>
                    </div>
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(apt.status)}">${apt.status}</span>
                </div>
            `;
        }).join('');
    }

    loadCriticalAlerts() {
        const alerts = [];
        
        // Critical lab results
        const criticalLabs = this.labResults.filter(lab => lab.status === 'Critical');
        criticalLabs.forEach(lab => {
            const patient = this.patients.find(p => p.id === lab.patient_id);
            alerts.push({
                type: 'critical',
                message: `Critical lab result: ${lab.test_name} for ${patient ? patient.first_name + ' ' + patient.last_name : 'Unknown Patient'}`,
                icon: 'fa-flask'
            });
        });

        // Overdue appointments
        const now = new Date();
        const overdueAppointments = this.appointments.filter(apt => 
            new Date(apt.appointment_date) < now && apt.status === 'Scheduled'
        );
        
        overdueAppointments.forEach(apt => {
            const patient = this.patients.find(p => p.id === apt.patient_id);
            alerts.push({
                type: 'warning',
                message: `Overdue appointment: ${patient ? patient.first_name + ' ' + patient.last_name : 'Unknown Patient'}`,
                icon: 'fa-calendar-times'
            });
        });

        // Medication adherence issues
        const poorAdherence = this.medications.filter(med => 
            med.adherence_level === 'Poor' && med.status === 'Active'
        );
        
        poorAdherence.forEach(med => {
            const patient = this.patients.find(p => p.id === med.patient_id);
            alerts.push({
                type: 'warning',
                message: `Poor medication adherence: ${med.medication_name} for ${patient ? patient.first_name + ' ' + patient.last_name : 'Unknown Patient'}`,
                icon: 'fa-pills'
            });
        });

        const container = document.getElementById('criticalAlerts');
        
        if (alerts.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No critical alerts at this time</p>';
            return;
        }

        container.innerHTML = alerts.slice(0, 5).map(alert => `
            <div class="flex items-center p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <i class="fas ${alert.icon} text-red-600 mr-3"></i>
                <span class="text-sm text-red-800">${alert.message}</span>
            </div>
        `).join('');
    }

    async loadPatients() {
        this.displayPatients(this.patients);
    }

    displayPatients(patients) {
        const container = document.getElementById('patientsContainer');
        
        if (patients.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-user-md text-gray-400 text-4xl mb-4"></i>
                    <p class="text-gray-600">No patients found. Click "Add Patient" to get started.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${patients.map(patient => this.renderPatientRow(patient)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderPatientRow(patient) {
        const lastAppointment = this.appointments
            .filter(apt => apt.patient_id === patient.id && apt.status === 'Completed')
            .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))[0];

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-medical-blue flex items-center justify-center">
                                <i class="fas fa-user text-white"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${patient.first_name} ${patient.last_name}</div>
                            <div class="text-sm text-gray-500">${patient.gender}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${patient.phone || 'N/A'}</div>
                    <div class="text-sm text-gray-500">${patient.email || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        ${patient.blood_type || 'Unknown'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.calculateAge(patient.date_of_birth)} years
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${lastAppointment ? new Date(lastAppointment.appointment_date).toLocaleDateString() : 'No visits'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="app.viewPatientEHR('${patient.id}')" class="text-medical-blue hover:text-blue-900">
                        <i class="fas fa-file-medical"></i> EHR
                    </button>
                    <button onclick="app.editPatient('${patient.id}')" class="text-medical-green hover:text-green-900">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="app.schedulePatientAppointment('${patient.id}')" class="text-purple-600 hover:text-purple-900">
                        <i class="fas fa-calendar-plus"></i> Schedule
                    </button>
                    <button onclick="app.deletePatient('${patient.id}')" class="text-medical-red hover:text-red-900">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }

    async viewPatientEHR(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;

        this.currentPatientId = patientId;
        this.switchEHRTab('overview');
        this.showModal('patientDetailsModal');
    }

    switchEHRTab(tabName) {
        // Update tab UI
        document.querySelectorAll('.ehr-tab').forEach(tab => {
            tab.classList.remove('border-medical-blue', 'text-medical-blue');
            tab.classList.add('border-transparent', 'text-gray-500');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('border-medical-blue', 'text-medical-blue');
            activeTab.classList.remove('border-transparent', 'text-gray-500');
        }

        this.currentEHRTab = tabName;
        this.loadEHRTabContent(tabName);
    }

    loadEHRTabContent(tabName) {
        const patient = this.patients.find(p => p.id === this.currentPatientId);
        if (!patient) return;

        const content = document.getElementById('patientDetailsContent');

        switch(tabName) {
            case 'overview':
                content.innerHTML = this.renderPatientOverview(patient);
                break;
            case 'vitals':
                content.innerHTML = this.renderPatientVitals(patient);
                break;
            case 'medications':
                content.innerHTML = this.renderPatientMedications(patient);
                break;
            case 'lab-results':
                content.innerHTML = this.renderPatientLabResults(patient);
                break;
            case 'appointments':
                content.innerHTML = this.renderPatientAppointments(patient);
                break;
            case 'notes':
                content.innerHTML = this.renderPatientNotes(patient);
                break;
        }
    }

    renderPatientOverview(patient) {
        const patientDiseases = this.diseaseHistory.filter(d => d.patient_id === patient.id);
        const recentVitals = this.vitals.filter(v => v.patient_id === patient.id)
            .sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date))[0];

        return `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-user mr-2 text-medical-blue"></i>Personal Information
                    </h4>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="font-medium text-gray-700">Name:</span> 
                            <span>${patient.first_name} ${patient.last_name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium text-gray-700">Date of Birth:</span> 
                            <span>${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium text-gray-700">Age:</span> 
                            <span>${this.calculateAge(patient.date_of_birth)} years</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium text-gray-700">Gender:</span> 
                            <span>${patient.gender || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium text-gray-700">Blood Type:</span> 
                            <span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">${patient.blood_type || 'Unknown'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium text-gray-700">Phone:</span> 
                            <span>${patient.phone || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium text-gray-700">Email:</span> 
                            <span>${patient.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-heartbeat mr-2 text-medical-red"></i>Recent Vitals
                    </h4>
                    ${recentVitals ? `
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="font-medium text-gray-700">Blood Pressure:</span>
                                <span>${recentVitals.blood_pressure_systolic || 'N/A'}/${recentVitals.blood_pressure_diastolic || 'N/A'} mmHg</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium text-gray-700">Heart Rate:</span>
                                <span>${recentVitals.heart_rate || 'N/A'} BPM</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium text-gray-700">Temperature:</span>
                                <span>${recentVitals.temperature || 'N/A'}°F</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium text-gray-700">Weight:</span>
                                <span>${recentVitals.weight || 'N/A'} lbs</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium text-gray-700">BMI:</span>
                                <span>${recentVitals.bmi || 'N/A'}</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-2">
                                Recorded: ${new Date(recentVitals.recorded_date).toLocaleDateString()}
                            </div>
                        </div>
                    ` : `
                        <p class="text-gray-500 text-sm">No vital signs recorded</p>
                    `}
                    <button onclick="app.showRecordVitalsModal('${patient.id}')" class="mt-4 bg-medical-red text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                        <i class="fas fa-plus mr-2"></i>Record Vitals
                    </button>
                </div>

                <div class="bg-gray-50 rounded-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                            <i class="fas fa-stethoscope mr-2 text-medical-green"></i>Active Conditions
                        </h4>
                        <button onclick="app.addDiseaseHistory('${patient.id}')" class="bg-medical-green text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                            <i class="fas fa-plus mr-1"></i>Add
                        </button>
                    </div>
                    ${patientDiseases.filter(d => d.status === 'Active' || d.status === 'Under Treatment').length > 0 ? `
                        <div class="space-y-2">
                            ${patientDiseases.filter(d => d.status === 'Active' || d.status === 'Under Treatment').map(disease => `
                                <div class="flex justify-between items-center p-2 bg-white rounded border">
                                    <div>
                                        <div class="font-medium text-sm">${disease.disease_name}</div>
                                        <div class="text-xs text-gray-500">${disease.status} • ${disease.severity || 'N/A'}</div>
                                    </div>
                                    <span class="px-2 py-1 text-xs rounded ${this.getStatusColor(disease.status)}">${disease.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p class="text-gray-500 text-sm">No active conditions</p>
                    `}
                </div>

                <div class="bg-gray-50 rounded-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                            <i class="fas fa-pills mr-2 text-medical-purple"></i>Current Medications
                        </h4>
                        <button onclick="app.showAddMedicationModal('${patient.id}')" class="bg-medical-purple text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                            <i class="fas fa-plus mr-1"></i>Add
                        </button>
                    </div>
                    ${this.renderCurrentMedications(patient.id)}
                </div>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="app.editPatient('${patient.id}')" class="bg-medical-blue text-white px-4 py-2 rounded hover:bg-blue-700">
                    <i class="fas fa-edit mr-2"></i>Edit Patient
                </button>
                <button onclick="app.schedulePatientAppointment('${patient.id}')" class="bg-medical-green text-white px-4 py-2 rounded hover:bg-green-700">
                    <i class="fas fa-calendar-plus mr-2"></i>Schedule Appointment
                </button>
            </div>
        `;
    }

    renderCurrentMedications(patientId) {
        const currentMedications = this.medications.filter(med => 
            med.patient_id === patientId && med.status === 'Active'
        );

        if (currentMedications.length === 0) {
            return '<p class="text-gray-500 text-sm">No current medications</p>';
        }

        return `
            <div class="space-y-2 max-h-40 overflow-y-auto">
                ${currentMedications.map(med => `
                    <div class="flex justify-between items-center p-2 bg-white rounded border">
                        <div>
                            <div class="font-medium text-sm">${med.medication_name}</div>
                            <div class="text-xs text-gray-500">${med.dosage} • ${med.frequency}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs ${this.getAdherenceColor(med.adherence_level)}">${med.adherence_level || 'Unknown'}</div>
                            <div class="text-xs text-gray-500">${med.refills_remaining || 0} refills</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPatientVitals(patient) {
        const patientVitals = this.vitals.filter(v => v.patient_id === patient.id)
            .sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date));

        return `
            <div class="flex justify-between items-center mb-6">
                <h4 class="text-lg font-semibold text-gray-800">Vital Signs History</h4>
                <button onclick="app.showRecordVitalsModal('${patient.id}')" class="bg-medical-red text-white px-4 py-2 rounded hover:bg-red-700">
                    <i class="fas fa-plus mr-2"></i>Record New Vitals
                </button>
            </div>

            ${patientVitals.length === 0 ? 
                '<div class="text-center py-8"><p class="text-gray-500">No vital signs recorded for this patient.</p></div>' :
                `<div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BP</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HR</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BMI</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">O2 Sat</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${patientVitals.map(vital => `
                                <tr>
                                    <td class="px-4 py-3 text-sm">${new Date(vital.recorded_date).toLocaleDateString()}</td>
                                    <td class="px-4 py-3 text-sm">${vital.blood_pressure_systolic || '-'}/${vital.blood_pressure_diastolic || '-'}</td>
                                    <td class="px-4 py-3 text-sm">${vital.heart_rate || '-'}</td>
                                    <td class="px-4 py-3 text-sm">${vital.temperature || '-'}°F</td>
                                    <td class="px-4 py-3 text-sm">${vital.weight || '-'} lbs</td>
                                    <td class="px-4 py-3 text-sm">${vital.bmi || '-'}</td>
                                    <td class="px-4 py-3 text-sm">${vital.oxygen_saturation || '-'}%</td>
                                    <td class="px-4 py-3 text-sm">
                                        <button onclick="app.editVitals('${vital.id}')" class="text-medical-blue hover:text-blue-700 mr-2">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="app.deleteVitals('${vital.id}')" class="text-medical-red hover:text-red-700">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        `;
    }

    showRecordVitalsModal(patientId) {
        this.currentPatientId = patientId;
        this.showModal('vitalsFormModal');
    }

    async handleVitalsFormSubmit(e) {
        e.preventDefault();

        const vitalsData = {
            patient_id: this.currentPatientId,
            recorded_date: new Date().toISOString(),
            blood_pressure_systolic: document.getElementById('vitalsBloodPressureSystolic').value || null,
            blood_pressure_diastolic: document.getElementById('vitalsBloodPressureDiastolic').value || null,
            heart_rate: document.getElementById('vitalsHeartRate').value || null,
            temperature: document.getElementById('vitalsTemperature').value || null,
            weight: document.getElementById('vitalsWeight').value || null,
            height: document.getElementById('vitalsHeight').value || null,
            respiratory_rate: document.getElementById('vitalsRespiratoryRate').value || null,
            oxygen_saturation: document.getElementById('vitalsOxygenSaturation').value || null,
            blood_sugar: document.getElementById('vitalsBloodSugar').value || null,
            pain_level: document.getElementById('vitalsPainLevel').value || null,
            recorded_by: document.getElementById('vitalsRecordedBy').value || null,
            notes: document.getElementById('vitalsNotes').value || null
        };

        // Calculate BMI if height and weight are provided
        if (vitalsData.weight && vitalsData.height) {
            const heightInMeters = vitalsData.height * 0.0254;
            const weightInKg = vitalsData.weight * 0.453592;
            vitalsData.bmi = Math.round((weightInKg / (heightInMeters * heightInMeters)) * 10) / 10;
        }

        try {
            this.showLoading();
            
            const response = await fetch('tables/vitals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vitalsData)
            });

            if (response.ok) {
                this.showNotification('Vital signs recorded successfully', 'success');
                this.hideModal('vitalsFormModal');
                this.loadAllData();
                if (this.currentEHRTab === 'vitals') {
                    this.switchEHRTab('vitals');
                }
            } else {
                throw new Error('Failed to record vital signs');
            }
        } catch (error) {
            console.error('Error recording vitals:', error);
            this.showNotification('Error recording vital signs', 'error');
        } finally {
            this.hideLoading();
        }
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 'Unknown';
        const birth = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    getStatusColor(status) {
        const colors = {
            'Active': 'bg-red-100 text-red-800',
            'Recovered': 'bg-green-100 text-green-800',
            'Chronic': 'bg-yellow-100 text-yellow-800',
            'Under Treatment': 'bg-blue-100 text-blue-800',
            'Remission': 'bg-purple-100 text-purple-800',
            'Scheduled': 'bg-blue-100 text-blue-800',
            'Confirmed': 'bg-green-100 text-green-800',
            'Completed': 'bg-gray-100 text-gray-800',
            'Cancelled': 'bg-red-100 text-red-800',
            'In Progress': 'bg-yellow-100 text-yellow-800',
            'No Show': 'bg-orange-100 text-orange-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    getAdherenceColor(adherence) {
        const colors = {
            'Excellent': 'text-green-600',
            'Good': 'text-blue-600',
            'Fair': 'text-yellow-600',
            'Poor': 'text-red-600',
            'Unknown': 'text-gray-600'
        };
        return colors[adherence] || 'text-gray-600';
    }

    showAddPatientModal() {
        this.currentPatientId = null;
        document.getElementById('patientFormTitle').innerHTML = '<i class="fas fa-user-plus mr-2 text-medical-green"></i>Add New Patient';
        document.getElementById('patientForm').reset();
        this.showModal('patientFormModal');
    }

    async showScheduleAppointmentModal() {
        // Load patient options
        const patientSelect = document.getElementById('appointmentPatient');
        patientSelect.innerHTML = '<option value="">Select Patient</option>' +
            this.patients.map(patient => 
                `<option value="${patient.id}">${patient.first_name} ${patient.last_name}</option>`
            ).join('');
        
        this.showModal('appointmentFormModal');
    }

    async handlePatientFormSubmit(e) {
        e.preventDefault();

        const patientData = {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            date_of_birth: document.getElementById('dateOfBirth').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            blood_type: document.getElementById('bloodType').value,
            emergency_contact: document.getElementById('emergencyContact').value,
            insurance_info: document.getElementById('insuranceInfo').value,
            allergies: document.getElementById('allergies').value,
            notes: document.getElementById('notes').value
        };

        try {
            this.showLoading();
            
            const url = this.currentPatientId ? 
                `tables/patients/${this.currentPatientId}` : 
                'tables/patients';
            
            const method = this.currentPatientId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientData)
            });

            if (response.ok) {
                const message = this.currentPatientId ? 'Patient updated successfully' : 'Patient added successfully';
                this.showNotification(message, 'success');
                this.hideModal('patientFormModal');
                this.loadAllData();
            } else {
                throw new Error('Failed to save patient');
            }
        } catch (error) {
            console.error('Error saving patient:', error);
            this.showNotification('Error saving patient', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleAppointmentFormSubmit(e) {
        e.preventDefault();

        const appointmentDate = new Date(
            document.getElementById('appointmentDate').value + 'T' + 
            document.getElementById('appointmentTime').value
        ).toISOString();

        const appointmentData = {
            patient_id: document.getElementById('appointmentPatient').value,
            appointment_date: appointmentDate,
            duration: parseInt(document.getElementById('appointmentDuration').value),
            appointment_type: document.getElementById('appointmentType').value,
            doctor_name: document.getElementById('appointmentDoctor').value,
            chief_complaint: document.getElementById('appointmentComplaint').value,
            notes: document.getElementById('appointmentNotes').value,
            status: 'Scheduled',
            reminder_sent: false,
            created_by: 'Current User'
        };

        try {
            this.showLoading();
            
            const response = await fetch('tables/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            if (response.ok) {
                this.showNotification('Appointment scheduled successfully', 'success');
                this.hideModal('appointmentFormModal');
                this.loadAllData();
            } else {
                throw new Error('Failed to schedule appointment');
            }
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            this.showNotification('Error scheduling appointment', 'error');
        } finally {
            this.hideLoading();
        }
    }

    searchPatients() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        
        if (!query) {
            this.displayPatients(this.patients);
            return;
        }

        const filteredPatients = this.patients.filter(patient => 
            patient.first_name.toLowerCase().includes(query) ||
            patient.last_name.toLowerCase().includes(query) ||
            (patient.email && patient.email.toLowerCase().includes(query)) ||
            (patient.phone && patient.phone.includes(query))
        );

        this.displayPatients(filteredPatients);
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.displayPatients(this.patients);
    }

    initializeCharts() {
        // Initialize empty charts - will be populated when analytics section is loaded
    }

    loadAnalytics() {
        this.createDemographicsChart();
        this.createConditionsChart();
        this.createAppointmentTrendsChart();
        this.createAdherenceChart();
    }

    createDemographicsChart() {
        const ctx = document.getElementById('demographicsChart');
        if (!ctx) return;

        const genderData = this.patients.reduce((acc, patient) => {
            acc[patient.gender] = (acc[patient.gender] || 0) + 1;
            return acc;
        }, {});

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(genderData),
                datasets: [{
                    data: Object.values(genderData),
                    backgroundColor: ['#0284c7', '#059669', '#dc2626', '#7c3aed']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    createConditionsChart() {
        const ctx = document.getElementById('conditionsChart');
        if (!ctx) return;

        const conditionData = this.diseaseHistory.reduce((acc, disease) => {
            acc[disease.disease_name] = (acc[disease.disease_name] || 0) + 1;
            return acc;
        }, {});

        const topConditions = Object.entries(conditionData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topConditions.map(([name]) => name),
                datasets: [{
                    label: 'Number of Cases',
                    data: topConditions.map(([,count]) => count),
                    backgroundColor: '#059669'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createAppointmentTrendsChart() {
        // Implementation for appointment trends
    }

    createAdherenceChart() {
        const ctx = document.getElementById('adherenceChart');
        if (!ctx) return;

        const adherenceData = this.medications.reduce((acc, med) => {
            acc[med.adherence_level || 'Unknown'] = (acc[med.adherence_level || 'Unknown'] || 0) + 1;
            return acc;
        }, {});

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(adherenceData),
                datasets: [{
                    data: Object.values(adherenceData),
                    backgroundColor: ['#059669', '#0284c7', '#eab308', '#dc2626', '#64748b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        }`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Placeholder methods for other features
    async loadAppointments() {
        // Implementation for loading appointments
    }

    async loadLabResults() {
        // Implementation for loading lab results
    }

    async loadMessages() {
        // Implementation for loading messages
    }

    async editPatient(patientId) {
        // Implementation for editing patient
    }

    async deletePatient(patientId) {
        // Implementation for deleting patient
    }

    async schedulePatientAppointment(patientId) {
        // Implementation for scheduling patient appointment
    }
}

// Initialize the application
const app = new ComprehensiveEHRApp();
