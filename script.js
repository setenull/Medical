// Sistema de Atendimento Médico
class MedicalQueueSystem {
    constructor() {
        this.patients = [];
        this.nextTicketNumber = 1;
        this.loadData();
    }

    // Carregar dados do localStorage
    loadData() {
        const savedPatients = localStorage.getItem('medical-queue-patients');
        const savedTicketNumber = localStorage.getItem('medical-queue-next-ticket');

        if (savedPatients) {
            this.patients = JSON.parse(savedPatients);
        }
        if (savedTicketNumber) {
            this.nextTicketNumber = parseInt(savedTicketNumber);
        }
    }

    // Salvar dados no localStorage
    saveData() {
        localStorage.setItem('medical-queue-patients', JSON.stringify(this.patients));
        localStorage.setItem('medical-queue-next-ticket', this.nextTicketNumber.toString());
    }

    // Adicionar paciente
    addPatient(name, type) {
        if (!name.trim()) return false;

        const patient = {
            id: Date.now().toString(),
            name: name.trim(),
            ticketNumber: this.nextTicketNumber,
            type: type,
            status: 'aguardando',
            timestamp: Date.now()
        };

        this.patients.push(patient);
        this.nextTicketNumber++;
        this.saveData();
        return true;
    }

    // Remover paciente
    removePatient(id) {
        this.patients = this.patients.filter(p => p.id !== id);
        this.saveData();
    }

    // Atualizar status do paciente
    updatePatientStatus(id, status) {
        const patient = this.patients.find(p => p.id === id);
        if (patient) {
            patient.status = status;
            this.saveData();
        }
    }

    // Obter pacientes por status
    getPatientsByStatus(status) {
        return this.patients.filter(p => p.status === status);
    }

    // Obter estatísticas
    getStats() {
        return {
            waiting: this.getPatientsByStatus('aguardando').length,
            calling: this.getPatientsByStatus('chamando').length,
            service: this.getPatientsByStatus('atendimento').length,
            total: this.patients.length
        };
    }
}

// Instância global do sistema
const queueSystem = new MedicalQueueSystem();

// Funções para o painel administrativo
function initAdminPanel() {
    const patientNameInput = document.getElementById('patient-name');
    const serviceTypeSelect = document.getElementById('service-type');
    const addPatientBtn = document.getElementById('add-patient-btn');
    const nextTicketSpan = document.getElementById('next-ticket');

    // Atualizar número da próxima ficha
    nextTicketSpan.textContent = queueSystem.nextTicketNumber;

    // Event listeners
    addPatientBtn.addEventListener('click', addPatient);
    patientNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addPatient();
        }
    });

    // Função para adicionar paciente
    function addPatient() {
        const name = patientNameInput.value;
        const type = serviceTypeSelect.value;

        if (queueSystem.addPatient(name, type)) {
            patientNameInput.value = '';
            nextTicketSpan.textContent = queueSystem.nextTicketNumber;
            renderPatientsList();
            updateStats();
        } else {
            alert('Por favor, digite o nome do paciente.');
        }
    }

    // Renderizar lista de pacientes
    function renderPatientsList() {
        const patientsList = document.getElementById('patients-list');
        
        if (queueSystem.patients.length === 0) {
            patientsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-eye fa-3x"></i>
                    <p>Nenhum paciente na fila</p>
                </div>
            `;
            return;
        }

        patientsList.innerHTML = queueSystem.patients.map(patient => `
            <div class="patient-item">
                <div class="patient-info">
                    <div class="patient-ticket">
                        <div class="number">#${patient.ticketNumber}</div>
                        <div class="type">${patient.type === 'medico' ? 'Médico' : 'Odonto'}</div>
                    </div>
                    <div class="patient-details">
                        <h3>${patient.name}</h3>
                        <div class="time">${new Date(patient.timestamp).toLocaleTimeString('pt-BR')}</div>
                    </div>
                </div>
                <div class="patient-actions">
                    <div class="status-badge status-${patient.status}">
                        ${getStatusText(patient.status)}
                    </div>
                    <div class="status-buttons">
                        <button class="status-btn ${patient.status === 'aguardando' ? 'active' : ''}" 
                                onclick="updateStatus('${patient.id}', 'aguardando')">
                            Aguardando
                        </button>
                        <button class="status-btn ${patient.status === 'chamando' ? 'active' : ''}" 
                                onclick="updateStatus('${patient.id}', 'chamando')">
                            Chamar
                        </button>
                        <button class="status-btn ${patient.status === 'atendimento' ? 'active' : ''}" 
                                onclick="updateStatus('${patient.id}', 'atendimento')">
                            Atender
                        </button>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removePatient('${patient.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Atualizar estatísticas
    function updateStats() {
        const stats = queueSystem.getStats();
        document.getElementById('patient-count').textContent = stats.total;
        document.getElementById('stat-waiting').textContent = stats.waiting;
        document.getElementById('stat-calling').textContent = stats.calling;
        document.getElementById('stat-service').textContent = stats.service;
        document.getElementById('stat-total').textContent = stats.total;
    }

    // Funções globais para os botões
    window.updateStatus = function(id, status) {
        queueSystem.updatePatientStatus(id, status);
        renderPatientsList();
        updateStats();
    };

    window.removePatient = function(id) {
        if (confirm('Tem certeza que deseja remover este paciente?')) {
            queueSystem.removePatient(id);
            renderPatientsList();
            updateStats();
        }
    };

    // Renderização inicial
    renderPatientsList();
    updateStats();
}

// Funções para o painel público
function initDisplayPanel() {
    // Atualizar relógio
    function updateClock() {
        const now = new Date();
        document.getElementById('current-time').textContent = now.toLocaleTimeString('pt-BR');
    }

    // Renderizar painel público
    function renderDisplayPanel() {
        queueSystem.loadData();
        
        const waitingPatients = queueSystem.getPatientsByStatus('aguardando');
        const callingPatients = queueSystem.getPatientsByStatus('chamando');
        const servicePatients = queueSystem.getPatientsByStatus('atendimento');

        // Atualizar contadores
        document.getElementById('total-patients').textContent = queueSystem.patients.length;

        // Seção de pacientes sendo chamados
        const callingSection = document.getElementById('calling-section');
        const callingPatientsDiv = document.getElementById('calling-patients');
        
        if (callingPatients.length > 0) {
            callingSection.style.display = 'block';
            callingPatientsDiv.innerHTML = callingPatients.map(patient => `
                <div class="calling-patient">
                    <div class="ticket-number">#${patient.ticketNumber}</div>
                    <div class="patient-name">${patient.name}</div>
                    <div class="service-type">
                        <i class="fas fa-${patient.type === 'medico' ? 'stethoscope' : 'tooth'}"></i>
                        <span>${patient.type === 'medico' ? 'Consultório Médico' : 'Consultório Odontológico'}</span>
                    </div>
                </div>
            `).join('');
        } else {
            callingSection.style.display = 'none';
        }

        // Seção de pacientes em atendimento
        const serviceSection = document.getElementById('service-section');
        const servicePatientsDiv = document.getElementById('service-patients');
        
        if (servicePatients.length > 0) {
            serviceSection.style.display = 'block';
            servicePatientsDiv.innerHTML = servicePatients.map(patient => `
                <div class="service-patient">
                    <div class="ticket-number">#${patient.ticketNumber}</div>
                    <div class="patient-name">${patient.name}</div>
                    <div class="service-type">
                        <i class="fas fa-${patient.type === 'medico' ? 'stethoscope' : 'tooth'}"></i>
                        <span>${patient.type === 'medico' ? 'Médico' : 'Odonto'}</span>
                    </div>
                </div>
            `).join('');
        } else {
            serviceSection.style.display = 'none';
        }

        // Fila de espera
        const waitingPatientsDiv = document.getElementById('waiting-patients');
        
        if (waitingPatients.length === 0) {
            waitingPatientsDiv.innerHTML = `
                <div class="empty-waiting">
                    <i class="fas fa-users fa-4x"></i>
                    <p>Nenhum paciente aguardando</p>
                </div>
            `;
        } else {
            waitingPatientsDiv.innerHTML = waitingPatients.map(patient => `
                <div class="waiting-patient">
                    <div class="ticket-number">#${patient.ticketNumber}</div>
                    <div class="patient-name" title="${patient.name}">${patient.name}</div>
                    <div class="service-type">
                        <i class="fas fa-${patient.type === 'medico' ? 'stethoscope' : 'tooth'}"></i>
                        <span>${patient.type === 'medico' ? 'Médico' : 'Odonto'}</span>
                    </div>
                    <div class="status">Aguardando</div>
                </div>
            `).join('');
        }

        // Atualizar estatísticas
        const stats = queueSystem.getStats();
        document.getElementById('display-stat-waiting').textContent = stats.waiting;
        document.getElementById('display-stat-calling').textContent = stats.calling;
        document.getElementById('display-stat-service').textContent = stats.service;
        document.getElementById('display-stat-total').textContent = stats.total;
    }

    // Atualizar relógio a cada segundo
    updateClock();
    setInterval(updateClock, 1000);

    // Atualizar painel a cada 2 segundos
    renderDisplayPanel();
    setInterval(renderDisplayPanel, 2000);
}

// Função auxiliar para obter texto do status
function getStatusText(status) {
    switch (status) {
        case 'aguardando':
            return 'Aguardando';
        case 'chamando':
            return 'CHAMANDO';
        case 'atendimento':
            return 'Em Atendimento';
        default:
            return 'Desconhecido';
    }
}