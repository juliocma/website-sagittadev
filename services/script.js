// Script Principal do Gerenciador de Atendimentos SagittaDev

// Default Initial Data
const initialCompanyInfo = {
    name: "SagittaDev",
    subtitle: "Soluções e Serviços de TI"
};

const initialClients = [
    { name: "See" }
];

const initialRequestors = [
    { client: "See", name: "Nivea" }
];

const initialTechnicians = [
    { name: "Priscilla" },
    { name: "Júlio" }
];

const initialPixList = [
    { bank: "inter", holder: "Priscilla Ramos de Miranda Oliveira Amaral", key: "53.375.537/0001-00", qrCode: "" }
];

const initialServices = [
    {
        name: "Formatação",
        desc: "Backup (quando possível), limpeza do sistema, reinstalação do Windows ou Linux, restauração do backup (quando possível) e instalação de softwares solicitados (somente originais).",
        value: "R$ 150,00",
        numericValue: 150.00,
        type: "fixed"
    },
    {
        name: "Abrir notebooks",
        desc: "Mediante aprovação do cliente, quando necessário, para identificar problemas em hardwares, modelos de peça para a troca e etc. Obs.: esse valor é retirado caso o cliente prossiga com a manutenção.",
        value: "R$ 50,00",
        numericValue: 50.00,
        type: "fixed"
    },
    {
        name: "Compra de peças",
        desc: "Não fazemos compra de peças, o link é enviado para o cliente que será responsável pelo pagamento, recebimento e troca da peça com o vendedor, quando necessário.",
        value: "-",
        numericValue: 0.00,
        type: "fixed"
    },
    {
        name: "Montagem de Computador",
        desc: "Levantamento da necessidade, pesquisa de melhores preços, envio da proposta, compra das peças (pelo cliente) e montagem. Formatação é opcional e cobrada à parte.",
        value: "R$ 160,00",
        numericValue: 160.00,
        type: "fixed"
    },
    {
        name: "Atendimento Remoto (06h00 às 18h00)",
        desc: "Atendimento de demandas relacionadas à TI via WhatsApp, ligação e acesso remoto em horário comercial.",
        value: "R$ 70,00/h",
        numericValue: 70.00,
        type: "hourly"
    },
    {
        name: "Atendimento Remoto (18h01 às 05h59)",
        desc: "Atendimento de demandas relacionadas à TI via WhatsApp, ligação e acesso remoto fora do horário comercial.",
        value: "R$ 100,00/h",
        numericValue: 100.00,
        type: "hourly"
    },
    {
        name: "Atendimento Presencial (06h00 às 18h00)",
        desc: "Atendimento de demandas relacionadas à TI de forma presencial durante horário comercial.",
        value: "R$ 100,00/h",
        numericValue: 100.00,
        type: "hourly"
    },
    {
        name: "Atendimento Presencial (18h01 às 05h59)",
        desc: "Atendimento de demandas relacionadas à TI de forma presencial fora do horário comercial.",
        value: "R$ 130,00/h",
        numericValue: 130.00,
        type: "hourly"
    }
];

// App State
let companyInfo = JSON.parse(localStorage.getItem('app_company')) || initialCompanyInfo;
let clients = JSON.parse(localStorage.getItem('app_clients')) || initialClients;
let requestors = JSON.parse(localStorage.getItem('app_requestors')) || initialRequestors;
let technicians = JSON.parse(localStorage.getItem('app_technicians')) || initialTechnicians;
let pixList = JSON.parse(localStorage.getItem('app_pix')) || initialPixList;
let services = JSON.parse(localStorage.getItem('app_services')) || initialServices;
let attendances = JSON.parse(localStorage.getItem('attendances')) || [];
let nextAttId = parseInt(localStorage.getItem('app_next_att_id')) || (attendances.length + 1);

// Pagination State
let currentAttPage = 1;
let attPageSize = 10;

// Retrofit existing attendances without codes or type
attendances.forEach((a, i) => {
    if (!a.code) {
        a.code = "#" + String(i + 1).padStart(3, '0');
    }
    if (!a.attType) {
        a.attType = "Remoto";
    }
});

// Dynamic Paid Toggle Listener for form
const attPaidCheckbox = document.getElementById('attPaid');
if (attPaidCheckbox) {
    attPaidCheckbox.addEventListener('change', function (e) {
        document.getElementById('attPaidLabel').innerText = e.target.checked ? "✅ Pago" : "⏳ Pendente de Pagamento";
    });
}

function saveAllState() {
    localStorage.setItem('app_company', JSON.stringify(companyInfo));
    localStorage.setItem('app_clients', JSON.stringify(clients));
    localStorage.setItem('app_requestors', JSON.stringify(requestors));
    localStorage.setItem('app_technicians', JSON.stringify(technicians));
    localStorage.setItem('app_pix', JSON.stringify(pixList));
    localStorage.setItem('app_services', JSON.stringify(services));
    localStorage.setItem('attendances', JSON.stringify(attendances));
    localStorage.setItem('app_next_att_id', nextAttId);
}

// Update Header Branding
function renderCompanyHeader() {
    const el = document.getElementById('appHeaderCompanyName');
    if (el) el.innerText = companyInfo.name || 'SagittaDev';
}

// Populate Searchable Datalists
function populateDatalists() {
    const clientOptionsHtml = clients.map(c => `<option value="${c.name}">`).join('');

    const dlAttClients = document.getElementById('dl-att-clients');
    if (dlAttClients) dlAttClients.innerHTML = clientOptionsHtml;

    const dlReqClients = document.getElementById('dl-req-clients');
    if (dlReqClients) dlReqClients.innerHTML = clientOptionsHtml;

    const dlReportClients = document.getElementById('dl-report-clients');
    if (dlReportClients) dlReportClients.innerHTML = clientOptionsHtml;

    const dlBillingClients = document.getElementById('dl-billing-clients');
    if (dlBillingClients) dlBillingClients.innerHTML = clientOptionsHtml;

    const dlAttTechs = document.getElementById('dl-att-techs');
    if (dlAttTechs) dlAttTechs.innerHTML = technicians.map(t => `<option value="${t.name}">`).join('');

    const dlAttServices = document.getElementById('dl-att-services');
    if (dlAttServices) dlAttServices.innerHTML = services.map(s => `<option value="${s.name}"> ${s.value}</option>`).join('');
}

// Tab Navigation
function switchTab(tab) {
    document.getElementById('section-attendances').classList.add('hidden');
    document.getElementById('section-faturamento').classList.add('hidden');
    document.getElementById('section-cadastros').classList.add('hidden');
    document.getElementById('section-report').classList.add('hidden');

    const inactiveBtnClass = 'px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium transition hover:bg-slate-200 flex items-center gap-2';
    const activeBtnClass = 'px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium transition hover:bg-indigo-700 shadow-sm flex items-center gap-2';

    document.getElementById('tab-btn-attendances').className = inactiveBtnClass;
    document.getElementById('tab-btn-faturamento').className = inactiveBtnClass;
    document.getElementById('tab-btn-cadastros').className = inactiveBtnClass;
    document.getElementById('tab-btn-report').className = inactiveBtnClass;

    if (tab === 'attendances') {
        document.getElementById('section-attendances').classList.remove('hidden');
        document.getElementById('tab-btn-attendances').className = activeBtnClass;
        populateAttendanceFormDropdowns();
        updateNextAttCodeDisplay();
        renderAttendanceTable();
    } else if (tab === 'faturamento') {
        document.getElementById('section-faturamento').classList.remove('hidden');
        document.getElementById('tab-btn-faturamento').className = activeBtnClass;
        populateDatalists();
        renderBillingTab();
    } else if (tab === 'cadastros') {
        document.getElementById('section-cadastros').classList.remove('hidden');
        document.getElementById('tab-btn-cadastros').className = activeBtnClass;
        switchSubTab('clientes');
    } else if (tab === 'report') {
        document.getElementById('section-report').classList.remove('hidden');
        document.getElementById('tab-btn-report').className = activeBtnClass;
        populateReportDropdowns();
        generateReport();
    }
}

// Atendimentos SubTab Navigation
function switchAttSubTab(sub) {
    document.getElementById('att-subtab-form').classList.add('hidden');
    document.getElementById('att-subtab-list').classList.add('hidden');

    document.getElementById('subtab-btn-att-form').className = 'px-4 py-2 rounded-xl text-sm font-medium transition bg-slate-100 text-slate-600 hover:bg-slate-200';
    document.getElementById('subtab-btn-att-list').className = 'px-4 py-2 rounded-xl text-sm font-medium transition bg-slate-100 text-slate-600 hover:bg-slate-200';

    if (sub === 'form') {
        document.getElementById('att-subtab-form').classList.remove('hidden');
        document.getElementById('subtab-btn-att-form').className = 'px-4 py-2 rounded-xl text-sm font-medium transition bg-indigo-600 text-white shadow-sm';
    } else if (sub === 'list') {
        document.getElementById('att-subtab-list').classList.remove('hidden');
        document.getElementById('subtab-btn-att-list').className = 'px-4 py-2 rounded-xl text-sm font-medium transition bg-indigo-600 text-white shadow-sm';
        renderAttendanceTable();
    }
}

// SubTab Navigation inside Cadastros
function switchSubTab(sub) {
    const subtabs = ['clientes', 'solicitantes', 'servicos', 'atendentes', 'pix', 'empresa', 'backup'];
    subtabs.forEach(s => {
        const el = document.getElementById(`subtab-${s}`);
        if (el) el.classList.add('hidden');
        const btn = document.getElementById(`subtab-btn-${s}`);
        if (btn) btn.className = 'px-4 py-2 rounded-xl text-sm font-medium transition bg-slate-100 text-slate-600 hover:bg-slate-200';
    });

    const activeSub = document.getElementById(`subtab-${sub}`);
    if (activeSub) activeSub.classList.remove('hidden');
    const activeBtn = document.getElementById(`subtab-btn-${sub}`);
    if (activeBtn) activeBtn.className = 'px-4 py-2 rounded-xl text-sm font-medium transition bg-indigo-600 text-white shadow-sm';

    if (sub === 'clientes') renderClients();
    if (sub === 'solicitantes') renderRequestors();
    if (sub === 'servicos') renderServices();
    if (sub === 'atendentes') renderTechnicians();
    if (sub === 'pix') renderPix();
    if (sub === 'empresa') renderCompanyForm();
}

// --- CLIENTES ---
function saveClient(e) {
    e.preventDefault();
    const idx = document.getElementById('clientEditIndex').value;
    const name = document.getElementById('clientNameInput').value.trim();

    if (idx === "") {
        clients.push({ name });
    } else {
        clients[idx].name = name;
    }
    saveAllState();
    resetClientForm();
    renderClients();
    populateDatalists();
}

function editClient(idx) {
    document.getElementById('clientEditIndex').value = idx;
    document.getElementById('clientNameInput').value = clients[idx].name;
    document.getElementById('clientFormTitle').innerText = "✏️ Editar Cliente";
}

function deleteClient(idx) {
    if (confirm(`Deseja excluir o cliente ${clients[idx].name}?`)) {
        clients.splice(idx, 1);
        saveAllState();
        renderClients();
        populateDatalists();
    }
}

function resetClientForm() {
    document.getElementById('clientForm').reset();
    document.getElementById('clientEditIndex').value = "";
    document.getElementById('clientFormTitle').innerText = "➕ Novo Cliente";
}

function renderClients() {
    const tbody = document.getElementById('clientTableBody');
    tbody.innerHTML = '';
    clients.forEach((c, idx) => {
        tbody.innerHTML += `
            <tr>
                <td class="py-2.5 font-medium text-slate-800">${c.name}</td>
                <td class="py-2.5 text-right space-x-2">
                    <button onclick="editClient(${idx})" class="text-xs text-indigo-600 hover:underline">Editar</button>
                    <button onclick="deleteClient(${idx})" class="text-xs text-rose-600 hover:underline">Excluir</button>
                </td>
            </tr>
        `;
    });
}

// --- SOLICITANTES ---
function saveRequestor(e) {
    e.preventDefault();
    const idx = document.getElementById('reqEditIndex').value;
    const item = {
        client: document.getElementById('reqClientInput').value.trim(),
        name: document.getElementById('reqNameInput').value.trim()
    };

    if (idx === "") {
        requestors.push(item);
    } else {
        requestors[idx] = item;
    }
    saveAllState();
    resetReqForm();
    renderRequestors();
}

function editRequestor(idx) {
    const item = requestors[idx];
    document.getElementById('reqEditIndex').value = idx;
    document.getElementById('reqClientInput').value = item.client;
    document.getElementById('reqNameInput').value = item.name;
    document.getElementById('reqFormTitle').innerText = "✏️ Editar Solicitante";
}

function deleteRequestor(idx) {
    if (confirm(`Deseja excluir o solicitante ${requestors[idx].name}?`)) {
        requestors.splice(idx, 1);
        saveAllState();
        renderRequestors();
    }
}

function resetReqForm() {
    document.getElementById('reqForm').reset();
    document.getElementById('reqEditIndex').value = "";
    document.getElementById('reqFormTitle').innerText = "➕ Novo Solicitante";
}

function renderRequestors() {
    populateDatalists();
    const tbody = document.getElementById('reqTableBody');
    tbody.innerHTML = '';
    requestors.forEach((r, idx) => {
        tbody.innerHTML += `
            <tr>
                <td class="py-2.5 font-medium text-slate-800">${r.name}</td>
                <td class="py-2.5 text-slate-600">${r.client}</td>
                <td class="py-2.5 text-right space-x-2">
                    <button onclick="editRequestor(${idx})" class="text-xs text-indigo-600 hover:underline">Editar</button>
                    <button onclick="deleteRequestor(${idx})" class="text-xs text-rose-600 hover:underline">Excluir</button>
                </td>
            </tr>
        `;
    });
}

// --- SERVIÇOS ---
function saveService(e) {
    e.preventDefault();
    const idx = document.getElementById('svcEditIndex').value;
    const valStr = document.getElementById('svcValueInput').value.trim();
    const numMatch = valStr.replace('R$', '').replace('/h', '').replace(',', '.').trim();
    const numericValue = parseFloat(numMatch) || 0;

    const item = {
        name: document.getElementById('svcNameInput').value.trim(),
        desc: document.getElementById('svcDescInput').value.trim(),
        value: valStr,
        numericValue: numericValue
    };

    if (idx === "") {
        services.push(item);
    } else {
        services[idx] = item;
    }
    saveAllState();
    resetSvcForm();
    renderServices();
    populateDatalists();
}

function editService(idx) {
    const item = services[idx];
    document.getElementById('svcEditIndex').value = idx;
    document.getElementById('svcNameInput').value = item.name;
    document.getElementById('svcDescInput').value = item.desc;
    document.getElementById('svcValueInput').value = item.value;
    document.getElementById('svcFormTitle').innerText = "✏️ Editar Serviço";
}

function deleteService(idx) {
    if (confirm(`Deseja excluir o serviço ${services[idx].name}?`)) {
        services.splice(idx, 1);
        saveAllState();
        renderServices();
        populateDatalists();
    }
}

function resetSvcForm() {
    document.getElementById('svcForm').reset();
    document.getElementById('svcEditIndex').value = "";
    document.getElementById('svcFormTitle').innerText = "➕ Novo Serviço";
}

function renderServices() {
    const tbody = document.getElementById('svcTableBody');
    tbody.innerHTML = '';
    services.forEach((s, idx) => {
        tbody.innerHTML += `
            <tr>
                <td class="py-3 px-2 font-semibold text-slate-800 align-top">${s.name}</td>
                <td class="py-3 px-2 text-slate-600 text-xs align-top">${s.desc}</td>
                <td class="py-3 px-2 font-medium text-slate-800 whitespace-nowrap align-top">${s.value}</td>
                <td class="py-3 px-2 text-right space-x-2 align-top whitespace-nowrap">
                    <button onclick="editService(${idx})" class="text-xs text-indigo-600 hover:underline">Editar</button>
                    <button onclick="deleteService(${idx})" class="text-xs text-rose-600 hover:underline">Excluir</button>
                </td>
            </tr>
        `;
    });
}

// --- ATENDENTES ---
function saveTechnician(e) {
    e.preventDefault();
    const idx = document.getElementById('techEditIndex').value;
    const name = document.getElementById('techNameInput').value.trim();

    if (idx === "") {
        technicians.push({ name });
    } else {
        technicians[idx].name = name;
    }
    saveAllState();
    resetTechForm();
    renderTechnicians();
    populateDatalists();
}

function editTechnician(idx) {
    document.getElementById('techEditIndex').value = idx;
    document.getElementById('techNameInput').value = technicians[idx].name;
    document.getElementById('techFormTitle').innerText = "✏️ Editar Atendente";
}

function deleteTechnician(idx) {
    if (confirm(`Deseja excluir o atendente ${technicians[idx].name}?`)) {
        technicians.splice(idx, 1);
        saveAllState();
        renderTechnicians();
        populateDatalists();
    }
}

function resetTechForm() {
    document.getElementById('techForm').reset();
    document.getElementById('techEditIndex').value = "";
    document.getElementById('techFormTitle').innerText = "➕ Novo Atendente";
}

function renderTechnicians() {
    const tbody = document.getElementById('techTableBody');
    tbody.innerHTML = '';
    technicians.forEach((t, idx) => {
        tbody.innerHTML += `
            <tr>
                <td class="py-2.5 font-medium text-slate-800">${t.name}</td>
                <td class="py-2.5 text-right space-x-2">
                    <button onclick="editTechnician(${idx})" class="text-xs text-indigo-600 hover:underline">Editar</button>
                    <button onclick="deleteTechnician(${idx})" class="text-xs text-rose-600 hover:underline">Excluir</button>
                </td>
            </tr>
        `;
    });
}

// --- PIX & QR CODE ---
function handleQrUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            const base64 = evt.target.result;
            document.getElementById('pixQrCodeBase64').value = base64;
            document.getElementById('qrPreviewImg').src = base64;
            document.getElementById('qrPreviewContainer').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function removeQrCode() {
    document.getElementById('pixQrCodeBase64').value = "";
    document.getElementById('pixQrFileInput').value = "";
    document.getElementById('qrPreviewContainer').classList.add('hidden');
}

function savePix(e) {
    e.preventDefault();
    const idx = document.getElementById('pixEditIndex').value;
    const item = {
        bank: document.getElementById('pixBankInput').value.trim(),
        holder: document.getElementById('pixHolderInput').value.trim(),
        key: document.getElementById('pixKeyInput').value.trim(),
        qrCode: document.getElementById('pixQrCodeBase64').value
    };

    if (idx === "") {
        pixList.push(item);
    } else {
        pixList[idx] = item;
    }
    saveAllState();
    resetPixForm();
    renderPix();
}

function editPix(idx) {
    const item = pixList[idx];
    document.getElementById('pixEditIndex').value = idx;
    document.getElementById('pixBankInput').value = item.bank;
    document.getElementById('pixHolderInput').value = item.holder;
    document.getElementById('pixKeyInput').value = item.key;
    document.getElementById('pixQrCodeBase64').value = item.qrCode || "";
    if (item.qrCode) {
        document.getElementById('qrPreviewImg').src = item.qrCode;
        document.getElementById('qrPreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('qrPreviewContainer').classList.add('hidden');
    }
    document.getElementById('pixFormTitle').innerText = "✏️ Editar Dados Pix";
}

function deletePix(idx) {
    if (confirm(`Deseja excluir estes dados de Pix?`)) {
        pixList.splice(idx, 1);
        saveAllState();
        renderPix();
    }
}

function resetPixForm() {
    document.getElementById('pixForm').reset();
    document.getElementById('pixEditIndex').value = "";
    document.getElementById('pixQrCodeBase64').value = "";
    document.getElementById('qrPreviewContainer').classList.add('hidden');
    document.getElementById('pixFormTitle').innerText = "➕ Novos Dados Pix";
}

function renderPix() {
    const tbody = document.getElementById('pixTableBody');
    tbody.innerHTML = '';
    pixList.forEach((p, idx) => {
        const qrImg = p.qrCode ? `<img src="${p.qrCode}" class="w-8 h-8 object-contain border rounded">` : `<span class="text-slate-300 text-xs">-</span>`;
        tbody.innerHTML += `
            <tr>
                <td class="py-2.5">${qrImg}</td>
                <td class="py-2.5 font-medium text-slate-800">${p.bank.toUpperCase()}</td>
                <td class="py-2.5 text-slate-600">${p.holder}</td>
                <td class="py-2.5 text-slate-600 font-mono text-xs">${p.key}</td>
                <td class="py-2.5 text-right space-x-2">
                    <button onclick="editPix(${idx})" class="text-xs text-indigo-600 hover:underline">Editar</button>
                    <button onclick="deletePix(${idx})" class="text-xs text-rose-600 hover:underline">Excluir</button>
                </td>
            </tr>
        `;
    });
}

// --- EMPRESA ---
function saveCompanyInfo(e) {
    e.preventDefault();
    companyInfo.name = document.getElementById('companyNameInput').value.trim() || "SagittaDev";
    companyInfo.subtitle = document.getElementById('companySubtitleInput').value.trim() || "Soluções em TI";
    saveAllState();
    renderCompanyHeader();
    alert('Dados da empresa salvos com sucesso!');
}

function renderCompanyForm() {
    document.getElementById('companyNameInput').value = companyInfo.name || "SagittaDev";
    document.getElementById('companySubtitleInput').value = companyInfo.subtitle || "Soluções em TI";
}

// --- ATENDIMENTOS FORM AUTO-FILL & CALCULATION ---
function updateNextAttCodeDisplay() {
    const editIndex = document.getElementById('attEditIndex').value;
    if (editIndex === "") {
        const code = "#" + String(nextAttId).padStart(3, '0');
        document.getElementById('attCodeDisplay').innerText = code;
        document.getElementById('attCodeInput').value = code;
    }
}

function populateAttendanceFormDropdowns() {
    populateDatalists();
    onClientInputChange();
}

function onClientInputChange() {
    const selectedClient = document.getElementById('attClientInput').value.trim();
    const dlReqs = document.getElementById('dl-att-requestors');
    if (!dlReqs) return;

    const filteredReqs = requestors.filter(r => r.client.toLowerCase() === selectedClient.toLowerCase());
    if (filteredReqs.length > 0) {
        dlReqs.innerHTML = filteredReqs.map(r => `<option value="${r.name}">`).join('');
    } else {
        dlReqs.innerHTML = requestors.map(r => `<option value="${r.name}">${r.client}</option>`).join('');
    }
}

function onServiceInputChange() {
    const svcName = document.getElementById('attServiceInput').value.trim();
    const foundSvc = services.find(s => s.name.toLowerCase() === svcName.toLowerCase());
    if (foundSvc) {
        if (foundSvc.numericValue > 0) {
            document.getElementById('attHourlyRate').value = foundSvc.numericValue.toFixed(2);
        }
        if (foundSvc.desc && !document.getElementById('attSummary').value) {
            document.getElementById('attSummary').value = foundSvc.desc;
        }
        // Sugere tipo presencial/remoto de acordo com o nome do serviço
        if (svcName.toLowerCase().includes('presencial')) {
            document.getElementById('attTypeSelect').value = 'Presencial';
        } else if (svcName.toLowerCase().includes('remoto')) {
            document.getElementById('attTypeSelect').value = 'Remoto';
        }
    }
}

const attDateInput = document.getElementById('attDate');
if (attDateInput) {
    attDateInput.addEventListener('change', function (e) {
        const dateVal = e.target.value;
        if (dateVal) {
            const parts = dateVal.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            document.getElementById('attWeekday').value = weekdays[d.getDay()];
        }
    });
}

function calculateHours() {
    const start = document.getElementById('attStartTime').value;
    const end = document.getElementById('attEndTime').value;
    if (start && end) {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
        if (diffMinutes > 0) {
            let roundedHours = Math.ceil(diffMinutes / 60);
            if (roundedHours < 1) roundedHours = 1;
            document.getElementById('attHours').value = roundedHours;
        }
    }
}

function saveAttendance(e) {
    e.preventDefault();
    const editIndex = document.getElementById('attEditIndex').value;
    const rawDate = document.getElementById('attDate').value;
    const [year, month, day] = rawDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    let code = document.getElementById('attCodeInput').value;
    if (editIndex === "" && !code) {
        code = "#" + String(nextAttId).padStart(3, '0');
    }

    const item = {
        code: code,
        client: document.getElementById('attClientInput').value.trim(),
        requestor: document.getElementById('attRequestorInput').value.trim(),
        attType: document.getElementById('attTypeSelect').value,
        date: formattedDate,
        rawDate: rawDate,
        weekday: document.getElementById('attWeekday').value,
        startTime: document.getElementById('attStartTime').value,
        endTime: document.getElementById('attEndTime').value,
        hours: parseFloat(document.getElementById('attHours').value) || 1,
        hourlyRate: parseFloat(document.getElementById('attHourlyRate').value) || 70.00,
        technician: document.getElementById('attTechnicianInput').value.trim(),
        paid: document.getElementById('attPaid').checked,
        summary: document.getElementById('attSummary').value.trim()
    };

    if (item.client && !clients.some(c => c.name.toLowerCase() === item.client.toLowerCase())) {
        clients.push({ name: item.client });
    }

    if (item.requestor && !requestors.some(r => r.name.toLowerCase() === item.requestor.toLowerCase() && r.client.toLowerCase() === item.client.toLowerCase())) {
        requestors.push({ client: item.client, name: item.requestor });
    }

    if (editIndex === "") {
        attendances.push(item);
        nextAttId++;
    } else {
        attendances[editIndex] = item;
    }

    saveAllState();
    resetAttendanceForm();
    switchAttSubTab('list');
}

function togglePaidStatus(index) {
    attendances[index].paid = !attendances[index].paid;
    saveAllState();
    renderAttendanceTable();
    renderBillingTab();
}

function resetAttendanceForm() {
    document.getElementById('attendanceForm').reset();
    document.getElementById('attEditIndex').value = "";
    document.getElementById('attCodeInput').value = "";
    document.getElementById('attClientInput').value = "";
    document.getElementById('attRequestorInput').value = "";
    document.getElementById('attTypeSelect').value = "Remoto";
    document.getElementById('attServiceInput').value = "";
    document.getElementById('attTechnicianInput').value = "";
    document.getElementById('att-form-title').innerText = "➕ Registrar Novo Atendimento";
    document.getElementById('attHourlyRate').value = "70.00";
    document.getElementById('attPaid').checked = false;
    document.getElementById('attPaidLabel').innerText = "⏳ Pendente de Pagamento";
    updateNextAttCodeDisplay();
}

// --- FILTROS E PAGINAÇÃO DE ATENDIMENTOS ---
function onFilterChange() {
    currentAttPage = 1;
    renderAttendanceTable();
}

function clearAttFilters() {
    document.getElementById('filterClient').value = "";
    document.getElementById('filterStartDate').value = "";
    document.getElementById('filterEndDate').value = "";
    document.getElementById('filterPaidStatus').value = "all";
    currentAttPage = 1;
    renderAttendanceTable();
}

function changePageSize() {
    attPageSize = parseInt(document.getElementById('pageSizeSelect').value) || 10;
    currentAttPage = 1;
    renderAttendanceTable();
}

function goToAttPage(page) {
    currentAttPage = page;
    renderAttendanceTable();
}

function getFilteredAttendances() {
    const filterText = document.getElementById('filterClient').value.toLowerCase();
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const paidFilter = document.getElementById('filterPaidStatus').value;

    return attendances.filter(a => {
        const matchesText = !filterText ||
            a.client.toLowerCase().includes(filterText) ||
            (a.code && a.code.toLowerCase().includes(filterText)) ||
            (a.requestor && a.requestor.toLowerCase().includes(filterText)) ||
            (a.attType && a.attType.toLowerCase().includes(filterText));

        let matchesPaid = true;
        if (paidFilter === 'pending') matchesPaid = !a.paid;
        if (paidFilter === 'paid') matchesPaid = a.paid;

        let matchesDate = true;
        if (startDate && a.rawDate && a.rawDate < startDate) matchesDate = false;
        if (endDate && a.rawDate && a.rawDate > endDate) matchesDate = false;

        return matchesText && matchesPaid && matchesDate;
    });
}

function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = getFilteredAttendances();
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / attPageSize) || 1;

    if (currentAttPage > totalPages) currentAttPage = totalPages;

    const startIdx = (currentAttPage - 1) * attPageSize;
    const endIdx = Math.min(startIdx + attPageSize, totalRecords);
    const pageRecords = filtered.slice(startIdx, endIdx);

    document.getElementById('totalRecordsText').innerText = totalRecords;
    document.getElementById('pageRangeText').innerText = totalRecords > 0 ? `${startIdx + 1}-${endIdx}` : '0-0';

    if (pageRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400">Nenhum atendimento encontrado.</td></tr>`;
        renderPaginationControls(totalPages);
        return;
    }

    pageRecords.forEach((item) => {
        const realIndex = attendances.indexOf(item);
        const total = item.hours * item.hourlyRate;
        const paidBadge = item.paid
            ? `<button onclick="togglePaidStatus(${realIndex})" title="Clique para alterar" class="px-2.5 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full font-medium text-xs transition">✅ Pago</button>`
            : `<button onclick="togglePaidStatus(${realIndex})" title="Clique para alterar" class="px-2.5 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-full font-medium text-xs transition">⏳ Pendente</button>`;

        const typeBadge = (item.attType === 'Presencial')
            ? `<span class="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg text-xs font-semibold">🏢 Presencial</span>`
            : `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200/60 rounded-lg text-xs font-semibold">💻 Remoto</span>`;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition";
        tr.innerHTML = `
            <td class="py-3 px-3 font-mono font-bold text-indigo-600">${item.code || '#-'}</td>
            <td class="py-3 px-3 font-medium text-slate-700">${item.date}</td>
            <td class="py-3 px-3 text-slate-700 font-semibold">${item.client}</td>
            <td class="py-3 px-3 text-slate-600">${item.requestor || '-'}</td>
            <td class="py-3 px-3">${typeBadge}</td>
            <td class="py-3 px-3 text-slate-600">${item.hours}h (${item.startTime} às ${item.endTime})</td>
            <td class="py-3 px-3">${paidBadge}</td>
            <td class="py-3 px-3 font-bold text-slate-800">R$ ${total.toFixed(2).replace('.', ',')}</td>
            <td class="py-3 px-3 text-right space-x-2 no-print">
                <button onclick="editAttendance(${realIndex})" class="text-indigo-600 hover:text-indigo-800 font-medium text-xs">Editar</button>
                <button onclick="deleteAttendance(${realIndex})" class="text-rose-600 hover:text-rose-800 font-medium text-xs">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const container = document.getElementById('paginationButtons');
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = `px-2.5 py-1 rounded-lg text-xs font-medium border transition ${currentAttPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`;
    prevBtn.innerText = '◀ Anterior';
    prevBtn.disabled = currentAttPage === 1;
    prevBtn.onclick = () => goToAttPage(currentAttPage - 1);
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && (i < currentAttPage - 2 || i > currentAttPage + 2) && i !== 1 && i !== totalPages) {
            if (i === currentAttPage - 3 || i === currentAttPage + 3) {
                const dots = document.createElement('span');
                dots.className = 'px-1 text-slate-400 text-xs';
                dots.innerText = '...';
                container.appendChild(dots);
            }
            continue;
        }

        const btn = document.createElement('button');
        btn.className = `px-2.5 py-1 rounded-lg text-xs font-medium border transition ${i === currentAttPage ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`;
        btn.innerText = i;
        btn.onclick = () => goToAttPage(i);
        container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = `px-2.5 py-1 rounded-lg text-xs font-medium border transition ${currentAttPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`;
    nextBtn.innerText = 'Próxima ▶';
    nextBtn.disabled = currentAttPage === totalPages;
    nextBtn.onclick = () => goToAttPage(currentAttPage + 1);
    container.appendChild(nextBtn);
}

function editAttendance(index) {
    const item = attendances[index];
    document.getElementById('attEditIndex').value = index;
    document.getElementById('attCodeInput').value = item.code;
    document.getElementById('attCodeDisplay').innerText = item.code;
    document.getElementById('att-form-title').innerText = "✏️ Editar Atendimento";
    document.getElementById('attClientInput').value = item.client;
    onClientInputChange();
    document.getElementById('attRequestorInput').value = item.requestor;
    document.getElementById('attTypeSelect').value = item.attType || "Remoto";
    document.getElementById('attDate').value = item.rawDate;
    document.getElementById('attWeekday').value = item.weekday;
    document.getElementById('attStartTime').value = item.startTime;
    document.getElementById('attEndTime').value = item.endTime;
    document.getElementById('attHours').value = item.hours;
    document.getElementById('attHourlyRate').value = item.hourlyRate;
    document.getElementById('attTechnicianInput').value = item.technician;
    document.getElementById('attPaid').checked = item.paid || false;
    document.getElementById('attPaidLabel').innerText = item.paid ? "✅ Pago" : "⏳ Pendente de Pagamento";
    document.getElementById('attSummary').value = item.summary;
    switchAttSubTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteAttendance(index) {
    if (confirm('Deseja realmente excluir este atendimento?')) {
        attendances.splice(index, 1);
        saveAllState();
        renderAttendanceTable();
        renderBillingTab();
    }
}

// --- ABA DE FATURAMENTO E CAIXA ---
function clearBillingClientFilter() {
    document.getElementById('billingClientInput').value = "";
    renderBillingTab();
}

function renderBillingTab() {
    populateDatalists();
    const clientFilter = (document.getElementById('billingClientInput')?.value || "").trim().toLowerCase();

    let grandReceived = 0;
    let grandPending = 0;
    let countReceived = 0;
    let countPending = 0;

    const clientMap = {};

    attendances.forEach(a => {
        const clientName = a.client || "Outros";
        if (!clientMap[clientName]) {
            clientMap[clientName] = { received: 0, pending: 0, countReceived: 0, countPending: 0 };
        }

        const totalItem = (a.hours || 0) * (a.hourlyRate || 0);
        if (a.paid) {
            clientMap[clientName].received += totalItem;
            clientMap[clientName].countReceived++;
            grandReceived += totalItem;
            countReceived++;
        } else {
            clientMap[clientName].pending += totalItem;
            clientMap[clientName].countPending++;
            grandPending += totalItem;
            countPending++;
        }
    });

    const grandTotal = grandReceived + grandPending;
    const countTotal = countReceived + countPending;

    document.getElementById('kpiReceivedVal').innerText = `R$ ${grandReceived.toFixed(2).replace('.', ',')}`;
    document.getElementById('kpiReceivedCount').innerText = countReceived;

    document.getElementById('kpiPendingVal').innerText = `R$ ${grandPending.toFixed(2).replace('.', ',')}`;
    document.getElementById('kpiPendingCount').innerText = countPending;

    document.getElementById('kpiTotalVal').innerText = `R$ ${grandTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('kpiTotalCount').innerText = countTotal;

    const tbody = document.getElementById('billingTableBody');
    const tfoot = document.getElementById('billingTableFooter');
    tbody.innerHTML = '';

    const clientEntries = Object.keys(clientMap)
        .filter(c => !clientFilter || c.toLowerCase().includes(clientFilter))
        .sort((a, b) => a.localeCompare(b));

    if (clientEntries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400">Nenhum registro de faturamento para os filtros selecionados.</td></tr>`;
        tfoot.innerHTML = '';
        return;
    }

    clientEntries.forEach(cName => {
        const cData = clientMap[cName];
        const cTotal = cData.received + cData.pending;
        const pendingBadge = cData.pending > 0
            ? `<span class="text-amber-600 font-bold">R$ ${cData.pending.toFixed(2).replace('.', ',')}</span> <span class="text-xs text-slate-400">(${cData.countPending})</span>`
            : `<span class="text-slate-300">R$ 0,00</span>`;

        const receivedBadge = cData.received > 0
            ? `<span class="text-emerald-600 font-bold">R$ ${cData.received.toFixed(2).replace('.', ',')}</span> <span class="text-xs text-slate-400">(${cData.countReceived})</span>`
            : `<span class="text-slate-300">R$ 0,00</span>`;

        const statusBadge = cData.pending === 0
            ? `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs">✅ 100% Quitado</span>`
            : `<span class="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-bold text-xs">⏳ Pendência</span>`;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition";
        tr.innerHTML = `
            <td class="py-3 px-3 font-semibold text-slate-800">${cName}</td>
            <td class="py-3 px-3">${pendingBadge}</td>
            <td class="py-3 px-3">${receivedBadge}</td>
            <td class="py-3 px-3 font-bold text-indigo-900">R$ ${cTotal.toFixed(2).replace('.', ',')}</td>
            <td class="py-3 px-3 text-right">${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });

    tfoot.innerHTML = `
        <tr>
            <td class="py-3 px-3 uppercase tracking-wider text-xs">Total Consolidado</td>
            <td class="py-3 px-3 text-amber-600 font-bold">R$ ${grandPending.toFixed(2).replace('.', ',')}</td>
            <td class="py-3 px-3 text-emerald-600 font-bold">R$ ${grandReceived.toFixed(2).replace('.', ',')}</td>
            <td class="py-3 px-3 text-indigo-900 font-black">R$ ${grandTotal.toFixed(2).replace('.', ',')}</td>
            <td class="py-3 px-3 text-right text-xs text-slate-500 font-normal">Geral</td>
        </tr>
    `;
}

// --- GERADOR DE RELATÓRIO COM SOLICITANTE, TIPO E LOGO FIXA (img/logo_2.png) ---
function populateReportDropdowns() {
    populateDatalists();
    const pixSelect = document.getElementById('reportPixSelect');
    if (pixSelect) {
        pixSelect.innerHTML = '';
        pixList.forEach((p, idx) => {
            pixSelect.innerHTML += `<option value="${idx}">${p.bank.toUpperCase()} - ${p.holder.split(' ')[0]}</option>`;
        });
    }
}

function generateReport() {
    const client = (document.getElementById('reportClientInput')?.value || "").trim();
    const pixIdx = document.getElementById('reportPixSelect').value;
    const discount = parseFloat(document.getElementById('reportDiscount').value) || 0;
    const includePaid = document.getElementById('reportIncludePaid').checked;

    let clientAttendances = attendances.filter(a => a.client.toLowerCase() === client.toLowerCase());
    if (!includePaid) {
        clientAttendances = clientAttendances.filter(a => !a.paid);
    }

    const container = document.getElementById('reportContent');

    if (!client) {
        container.innerHTML = `<p class="text-center text-slate-400 py-12">Selecione ou digite o nome de um cliente no campo acima para gerar o relatório.</p>`;
        return;
    }

    if (clientAttendances.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-slate-500 font-medium text-base">🎉 Nenhum atendimento pendente de pagamento encontrado para ${client}!</p>
                <p class="text-slate-400 text-xs mt-1">Marque a opção "Incluir pagamentos já concluídos" caso deseje visualizar o histórico completo.</p>
            </div>
        `;
        return;
    }

    const pixData = pixList[pixIdx] || pixList[0] || { bank: 'inter', holder: 'Priscilla Ramos de Miranda Oliveira Amaral', key: '53.375.537/0001-00', qrCode: '' };
    let subtotal = 0;

    // Logo Fixa do Relatório: img/logo_2.png (1200x600 px)
    const logoHtml = `<img src="img/logo_2.png" alt="SagittaDev Logo" class="h-14 max-w-[240px] object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<span class='text-2xl font-black text-slate-900'>${companyInfo.name || 'SagittaDev'}</span>';">`;

    let html = `
        <!-- Cabeçalho de Marca SagittaDev no Relatório -->
        <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
            <div class="flex items-center gap-4">
                <div class="flex items-center justify-center">
                    ${logoHtml}
                </div>
                <div>
                    <h1 class="text-2xl font-black text-slate-900 tracking-tight">${companyInfo.name || 'SagittaDev'}</h1>
                    <p class="text-xs font-semibold text-slate-500 tracking-wide uppercase">${companyInfo.subtitle || 'Soluções e Serviços de TI'}</p>
                </div>
            </div>
            <div class="text-right">
                <span class="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-wider">Relatório Técnico</span>
            </div>
        </div>

        <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-6 text-sm text-slate-700">
            <p><strong>Cliente:</strong> ${client}</p>
        </div>

        <div class="space-y-6">
    `;

    clientAttendances.forEach((item, idx) => {
        const totalItem = item.hours * item.hourlyRate;
        subtotal += totalItem;
        const formattedSummary = (item.summary || '').replaceAll('\n', '<br>').replaceAll('\\n', '<br>');
        const typeLabel = item.attType === 'Presencial' ? '🏢 Presencial' : '💻 Remoto';

        html += `
            <div class="bg-white p-4 rounded-xl border border-slate-200">
                <div class="flex justify-between items-center mb-2">
                    <p class="font-bold text-slate-800">Atendimento ${idx + 1} <span class="text-slate-400 font-normal text-xs font-mono">(${item.code || '#-'})</span>:</p>
                    <span class="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">${typeLabel}</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-slate-600 mb-3">
                    <div><strong>Data:</strong> ${item.date}</div>
                    <div><strong>Solicitante:</strong> ${item.requestor || 'N/A'}</div>
                    <div><strong>Qtd horas:</strong> ${item.hours}</div>
                    <div><strong>Horário:</strong> ${item.startTime} às ${item.endTime}</div>
                    <div><strong>Dia:</strong> ${item.weekday}</div>
                    <div><strong>Valor hora:</strong> R$ ${item.hourlyRate.toFixed(2).replace('.', ',')}</div>
                    <div><strong>Atendente:</strong> ${item.technician}</div>
                    <div class="font-semibold text-slate-900">Total: R$ ${totalItem.toFixed(2).replace('.', ',')}</div>
                </div>
                <div class="text-sm text-slate-700 border-t border-slate-100 pt-2">
                    <strong>Resumo das Ações Executadas:</strong><br>${formattedSummary}
                </div>
            </div>
        `;
    });

    const finalTotal = Math.max(0, subtotal - discount);

    // Ocultar linha de desconto se discount == 0
    const discountLineHtml = discount > 0 ? `
        <div class="flex justify-between text-rose-600">
            <span>Desconto</span>
            <span>R$ ${discount.toFixed(2).replace('.', ',')}</span>
        </div>
    ` : '';

    html += `
        </div>
        <div class="mt-8 pt-6 border-t border-slate-200">
            <h3 class="font-bold text-slate-900 mb-3">Resumo Financeiro</h3>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
    `;

    clientAttendances.forEach((item, idx) => {
        const totalItem = item.hours * item.hourlyRate;
        html += `
            <div class="flex justify-between text-slate-600">
                <span>Atendimento ${idx + 1} (${item.code || '#-'})</span>
                <span>R$ ${totalItem.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    });

    html += `
                <div class="flex justify-between font-semibold text-slate-800 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                ${discountLineHtml}
                <div class="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-200">
                    <span>Valor a pagar:</span>
                    <span>R$ ${finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-slate-600">
            <div>
                <p class="font-bold text-slate-800 mb-1">${pixData.bank.toUpperCase()}</p>
                <p><strong>Nome:</strong> ${pixData.holder}</p>
                <p><strong>Chave Pix:</strong> ${pixData.key}</p>
            </div>
            ${pixData.qrCode ? `<div class="flex flex-col items-center"><img src="${pixData.qrCode}" class="w-28 h-28 object-contain border border-slate-200 rounded-lg shadow-sm"><span class="text-[10px] text-slate-400 mt-1">Pague via QR Code</span></div>` : ''}
        </div>
    `;

    container.innerHTML = html;
}

// ABRIR RELATÓRIO EM NOVA ABA PARA IMPRESSÃO/PDF
function openReportInNewTab() {
    const reportContent = document.getElementById('reportContent').innerHTML;
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Atendimento - ${companyInfo.name || 'SagittaDev'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { background: white; padding: 2rem; font-family: system-ui, -apple-system, sans-serif; }
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body class="bg-white text-slate-800">
            <div class="max-w-3xl mx-auto">
                <div class="no-print flex justify-end mb-6">
                    <button onclick="window.print()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition shadow-md flex items-center gap-2">
                        <span>🖨️ Imprimir / Salvar em PDF</span>
                    </button>
                </div>
                ${reportContent}
            </div>
        </body>
        </html>
    `);
    newWindow.document.close();
}

// Export / Import
function exportData() {
    const dataToExport = {
        companyInfo,
        clients,
        requestors,
        technicians,
        pixList,
        services,
        attendances,
        nextAttId
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "sagittadev_atendimentos_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed.attendances || parsed.clients || parsed.services) {
                companyInfo = parsed.companyInfo || companyInfo;
                clients = parsed.clients || clients;
                requestors = parsed.requestors || requestors;
                technicians = parsed.technicians || technicians;
                pixList = parsed.pixList || pixList;
                services = parsed.services || services;
                attendances = parsed.attendances || [];
                nextAttId = parsed.nextAttId || (attendances.length + 1);
                saveAllState();
                renderCompanyHeader();
                populateDatalists();
                switchTab('attendances');
                alert('Backup completo do SagittaDev importado com sucesso!');
            } else {
                alert('Arquivo de backup inválido.');
            }
        } catch (err) {
            alert('Erro ao ler o arquivo JSON.');
        }
    };
    reader.readAsText(file);
}

// Initialize App
renderCompanyHeader();
populateDatalists();
populateAttendanceFormDropdowns();
updateNextAttCodeDisplay();
renderAttendanceTable();
