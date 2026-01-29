class HealthcareApp {
    constructor() {
        this.currentPatientId = null;
        this.currentDiseaseId = null;
        this.patients = [];
        this.diseaseHistory = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPatients();
        this.updateDashboardStats();
    }

    bindEvents() {
        // Navigation events
        document.getElementById('showPatientsBtn').addEventListener('click', () => this.showPatients());
        document.getElementById('addPatientBtn').addEventListener('click', () => this.showAddPatientModal());
        
        // Modal events
        document.getElementById('closePatientModal').addEventListener('click', () => this.hideModal('patientDetailsModal'));
        document.getElementById('closePatientFormModal').addEventListener('click', () => this.hideModal('patientFormModal'));
        document.getElementById('closeDiseaseHistoryModal').addEventListener('click', () => this.hideModal('diseaseHistoryModal'));
        document.getElementById('closeAddDiseaseModal').addEventListener('click', () => this.hideModal('addDiseaseModal'));
        document.getElementById('cancelPatientForm').addEventListener('click', () => this.hideModal('patientFormModal'));
        document.getElementById('cancelDiseaseForm').addEventListener('click', () => this.hideModal('addDiseaseModal'));
        
        // Form events
        document.getElementById('patientForm').addEventListener('submit', (e) => this.handlePatientFormSubmit(e));
        document.getElementById('diseaseForm').addEventListener('submit', (e) => this.handleDiseaseFormSubmit(e));
        
        // Search events
        document.getElementById('searchBtn').addEventListener('click', () => this.searchPatients());
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchPatients();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
                const modals = ['patientDetailsModal', 'patientFormModal', 'diseaseHistoryModal', 'addDiseaseModal'];
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
        if (modalId === 'patientFormModal') {
            this.resetPatientForm();
        } else if (modalId === 'addDiseaseModal') {
            this.resetDiseaseForm();
        }
    }

    async loadPatients() {
        try {
            this.showLoading();
            const response = await fetch('tables/patients');
            const result = await response.json();
            this.patients = result.data || [];
            this.displayPatients(this.patients);
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error loading patients:', error);
            this.showNotification('Error loading patients', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadDiseaseHistory() {
        try {
            const response = await fetch('tables/disease_history');
            const result = await response.json();
            this.diseaseHistory = result.data || [];
        } catch (error) {
            console.error('Error loading disease history:', error);
        }
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
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${patients.map(patient => `
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
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onclick="app.viewPatientDetails('${patient.id}')" class="text-medical-blue hover:text-blue-900">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <button onclick="app.editPatient('${patient.id}')" class="text-medical-green hover:text-green-900">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button onclick="app.viewDiseaseHistory('${patient.id}')" class="text-purple-600 hover:text-purple-900">
                                        <i class="fas fa-clipboard-list"></i> History
                                    </button>
                                    <button onclick="app.deletePatient('${patient.id}')" class="text-medical-red hover:text-red-900">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
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

    async updateDashboardStats() {
        await this.loadDiseaseHistory();
        
        const totalPatients = this.patients.length;
        const activeCases = this.diseaseHistory.filter(disease => 
            disease.status === 'Active' || disease.status === 'Under Treatment'
        ).length;
        const followUpsDue = this.diseaseHistory.filter(disease => {
            if (!disease.follow_up_date) return false;
            const followUpDate = new Date(disease.follow_up_date);
            const today = new Date();
            const diffTime = followUpDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && diffDays >= 0;
        }).length;

        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('activeCases').textContent = activeCases;
        document.getElementById('followUpsDue').textContent = followUpsDue;
    }

    showPatients() {
        this.loadPatients();
    }

    showAddPatientModal() {
        this.currentPatientId = null;
        document.getElementById('patientFormTitle').innerHTML = '<i class="fas fa-user-plus mr-2 text-medical-green"></i>Add New Patient';
        this.resetPatientForm();
        this.showModal('patientFormModal');
    }

    async editPatient(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;

        this.currentPatientId = patientId;
        document.getElementById('patientFormTitle').innerHTML = '<i class="fas fa-user-edit mr-2 text-medical-blue"></i>Edit Patient';
        
        // Populate form with patient data
        document.getElementById('firstName').value = patient.first_name || '';
        document.getElementById('lastName').value = patient.last_name || '';
        document.getElementById('dateOfBirth').value = patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '';
        document.getElementById('gender').value = patient.gender || '';
        document.getElementById('phone').value = patient.phone || '';
        document.getElementById('email').value = patient.email || '';
        document.getElementById('address').value = patient.address || '';
        document.getElementById('bloodType').value = patient.blood_type || '';
        document.getElementById('emergencyContact').value = patient.emergency_contact || '';
        document.getElementById('insuranceInfo').value = patient.insurance_info || '';
        document.getElementById('allergies').value = patient.allergies || '';
        document.getElementById('notes').value = patient.notes || '';

        this.showModal('patientFormModal');
    }

    async deletePatient(patientId) {
        if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading();
            await fetch(`tables/patients/${patientId}`, {
                method: 'DELETE'
            });
            
            // Also delete associated disease history
            const patientDiseases = this.diseaseHistory.filter(d => d.patient_id === patientId);
            for (const disease of patientDiseases) {
                await fetch(`tables/disease_history/${disease.id}`, {
                    method: 'DELETE'
                });
            }

            this.showNotification('Patient deleted successfully', 'success');
            this.loadPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
            this.showNotification('Error deleting patient', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async viewPatientDetails(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;

        await this.loadDiseaseHistory();
        const patientDiseases = this.diseaseHistory.filter(d => d.patient_id === patientId);

        const content = document.getElementById('patientDetailsContent');
        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Personal Information</h4>
                    <div class="space-y-2 text-sm">
                        <div><span class="font-medium">Name:</span> ${patient.first_name} ${patient.last_name}</div>
                        <div><span class="font-medium">Date of Birth:</span> ${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                        <div><span class="font-medium">Age:</span> ${this.calculateAge(patient.date_of_birth)} years</div>
                        <div><span class="font-medium">Gender:</span> ${patient.gender || 'N/A'}</div>
                        <div><span class="font-medium">Blood Type:</span> ${patient.blood_type || 'Unknown'}</div>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Contact Information</h4>
                    <div class="space-y-2 text-sm">
                        <div><span class="font-medium">Phone:</span> ${patient.phone || 'N/A'}</div>
                        <div><span class="font-medium">Email:</span> ${patient.email || 'N/A'}</div>
                        <div><span class="font-medium">Address:</span> ${patient.address || 'N/A'}</div>
                        <div><span class="font-medium">Emergency Contact:</span> ${patient.emergency_contact || 'N/A'}</div>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Medical Information</h4>
                    <div class="space-y-2 text-sm">
                        <div><span class="font-medium">Insurance:</span> ${patient.insurance_info || 'N/A'}</div>
                        <div><span class="font-medium">Allergies:</span> ${patient.allergies || 'None reported'}</div>
                        <div><span class="font-medium">Notes:</span> ${patient.notes || 'No additional notes'}</div>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-lg font-semibold text-gray-800">Disease History (${patientDiseases.length})</h4>
                        <button onclick="app.addDiseaseHistory('${patient.id}')" class="bg-medical-green text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                            <i class="fas fa-plus mr-1"></i>Add
                        </button>
                    </div>
                    ${patientDiseases.length === 0 ? 
                        '<p class="text-gray-500 text-sm">No disease history recorded</p>' :
                        `<div class="space-y-2 max-h-40 overflow-y-auto">
                            ${patientDiseases.map(disease => `
                                <div class="border-l-4 border-medical-blue pl-3">
                                    <div class="text-sm font-medium">${disease.disease_name}</div>
                                    <div class="text-xs text-gray-500">
                                        ${disease.status} • ${disease.diagnosis_date ? new Date(disease.diagnosis_date).toLocaleDateString() : 'No date'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>`
                    }
                </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
                <button onclick="app.editPatient('${patient.id}')" class="bg-medical-blue text-white px-4 py-2 rounded hover:bg-blue-700">
                    <i class="fas fa-edit mr-2"></i>Edit Patient
                </button>
                <button onclick="app.viewDiseaseHistory('${patient.id}')" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    <i class="fas fa-clipboard-list mr-2"></i>View Full History
                </button>
            </div>
        `;

        this.showModal('patientDetailsModal');
    }

    async viewDiseaseHistory(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;

        await this.loadDiseaseHistory();
        const patientDiseases = this.diseaseHistory.filter(d => d.patient_id === patientId);

        const content = document.getElementById('diseaseHistoryContent');
        content.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-lg font-semibold text-gray-800">Disease History for ${patient.first_name} ${patient.last_name}</h4>
                <button onclick="app.addDiseaseHistory('${patientId}')" class="bg-medical-green text-white px-4 py-2 rounded hover:bg-green-700">
                    <i class="fas fa-plus mr-2"></i>Add Disease History
                </button>
            </div>
            
            ${patientDiseases.length === 0 ? 
                '<div class="text-center py-8"><p class="text-gray-500">No disease history recorded for this patient.</p></div>' :
                `<div class="space-y-4">
                    ${patientDiseases.map(disease => `
                        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h5 class="font-semibold text-lg text-gray-800">${disease.disease_name}</h5>
                                    <div class="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                        <span><i class="fas fa-calendar mr-1"></i>${disease.diagnosis_date ? new Date(disease.diagnosis_date).toLocaleDateString() : 'No date'}</span>
                                        <span class="px-2 py-1 rounded-full text-xs ${this.getStatusColor(disease.status)}">${disease.status}</span>
                                        ${disease.severity ? `<span class="px-2 py-1 rounded-full text-xs ${this.getSeverityColor(disease.severity)}">${disease.severity}</span>` : ''}
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <button onclick="app.editDiseaseHistory('${disease.id}')" class="text-medical-blue hover:text-blue-700">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="app.deleteDiseaseHistory('${disease.id}')" class="text-medical-red hover:text-red-700">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                ${disease.symptoms ? `<div><span class="font-medium">Symptoms:</span> ${disease.symptoms}</div>` : ''}
                                ${disease.treatment ? `<div><span class="font-medium">Treatment:</span> ${disease.treatment}</div>` : ''}
                                ${disease.medication ? `<div><span class="font-medium">Medication:</span> ${disease.medication}</div>` : ''}
                                ${disease.doctor_name ? `<div><span class="font-medium">Doctor:</span> ${disease.doctor_name}</div>` : ''}
                                ${disease.follow_up_date ? `<div><span class="font-medium">Follow-up:</span> ${new Date(disease.follow_up_date).toLocaleDateString()}</div>` : ''}
                            </div>
                            
                            ${disease.notes ? `<div class="mt-3 text-sm"><span class="font-medium">Notes:</span> ${disease.notes}</div>` : ''}
                        </div>
                    `).join('')}
                </div>`
            }
        `;

        this.showModal('diseaseHistoryModal');
    }

    getStatusColor(status) {
        const colors = {
            'Active': 'bg-red-100 text-red-800',
            'Recovered': 'bg-green-100 text-green-800',
            'Chronic': 'bg-yellow-100 text-yellow-800',
            'Under Treatment': 'bg-blue-100 text-blue-800',
            'Remission': 'bg-purple-100 text-purple-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    getSeverityColor(severity) {
        const colors = {
            'Mild': 'bg-green-100 text-green-800',
            'Moderate': 'bg-yellow-100 text-yellow-800',
            'Severe': 'bg-orange-100 text-orange-800',
            'Critical': 'bg-red-100 text-red-800'
        };
        return colors[severity] || 'bg-gray-100 text-gray-800';
    }

    addDiseaseHistory(patientId) {
        this.currentPatientId = patientId;
        this.currentDiseaseId = null;
        document.getElementById('diseaseFormTitle').innerHTML = '<i class="fas fa-plus mr-2 text-medical-green"></i>Add Disease History';
        this.resetDiseaseForm();
        this.hideModal('patientDetailsModal');
        this.hideModal('diseaseHistoryModal');
        this.showModal('addDiseaseModal');
    }

    async editDiseaseHistory(diseaseId) {
        const disease = this.diseaseHistory.find(d => d.id === diseaseId);
        if (!disease) return;

        this.currentDiseaseId = diseaseId;
        this.currentPatientId = disease.patient_id;
        document.getElementById('diseaseFormTitle').innerHTML = '<i class="fas fa-edit mr-2 text-medical-blue"></i>Edit Disease History';
        
        // Populate form with disease data
        document.getElementById('diseaseName').value = disease.disease_name || '';
        document.getElementById('diagnosisDate').value = disease.diagnosis_date ? disease.diagnosis_date.split('T')[0] : '';
        document.getElementById('diseaseStatus').value = disease.status || '';
        document.getElementById('diseaseSeverity').value = disease.severity || '';
        document.getElementById('symptoms').value = disease.symptoms || '';
        document.getElementById('treatment').value = disease.treatment || '';
        document.getElementById('medication').value = disease.medication || '';
        document.getElementById('doctorName').value = disease.doctor_name || '';
        document.getElementById('followUpDate').value = disease.follow_up_date ? disease.follow_up_date.split('T')[0] : '';
        document.getElementById('diseaseNotes').value = disease.notes || '';

        this.hideModal('diseaseHistoryModal');
        this.showModal('addDiseaseModal');
    }

    async deleteDiseaseHistory(diseaseId) {
        if (!confirm('Are you sure you want to delete this disease history record?')) {
            return;
        }

        try {
            this.showLoading();
            await fetch(`tables/disease_history/${diseaseId}`, {
                method: 'DELETE'
            });
            
            this.showNotification('Disease history deleted successfully', 'success');
            this.loadDiseaseHistory();
            
            // Refresh the current view
            if (!document.getElementById('diseaseHistoryModal').classList.contains('hidden')) {
                const patientId = this.diseaseHistory.find(d => d.id === diseaseId)?.patient_id;
                if (patientId) {
                    this.viewDiseaseHistory(patientId);
                }
            }
        } catch (error) {
            console.error('Error deleting disease history:', error);
            this.showNotification('Error deleting disease history', 'error');
        } finally {
            this.hideLoading();
        }
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
                this.loadPatients();
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

    async handleDiseaseFormSubmit(e) {
        e.preventDefault();

        const diseaseData = {
            patient_id: this.currentPatientId,
            disease_name: document.getElementById('diseaseName').value,
            diagnosis_date: document.getElementById('diagnosisDate').value,
            status: document.getElementById('diseaseStatus').value,
            severity: document.getElementById('diseaseSeverity').value,
            symptoms: document.getElementById('symptoms').value,
            treatment: document.getElementById('treatment').value,
            medication: document.getElementById('medication').value,
            doctor_name: document.getElementById('doctorName').value,
            follow_up_date: document.getElementById('followUpDate').value,
            notes: document.getElementById('diseaseNotes').value
        };

        try {
            this.showLoading();
            
            const url = this.currentDiseaseId ? 
                `tables/disease_history/${this.currentDiseaseId}` : 
                'tables/disease_history';
            
            const method = this.currentDiseaseId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(diseaseData)
            });

            if (response.ok) {
                const message = this.currentDiseaseId ? 'Disease history updated successfully' : 'Disease history added successfully';
                this.showNotification(message, 'success');
                this.hideModal('addDiseaseModal');
                this.loadDiseaseHistory();
                this.updateDashboardStats();
            } else {
                throw new Error('Failed to save disease history');
            }
        } catch (error) {
            console.error('Error saving disease history:', error);
            this.showNotification('Error saving disease history', 'error');
        } finally {
            this.hideLoading();
        }
    }

    resetPatientForm() {
        document.getElementById('patientForm').reset();
        this.currentPatientId = null;
    }

    resetDiseaseForm() {
        document.getElementById('diseaseForm').reset();
        this.currentDiseaseId = null;
    }

    async searchPatients() {
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

    showNotification(message, type = 'info') {
        // Create notification element
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

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
const app = new HealthcareApp();