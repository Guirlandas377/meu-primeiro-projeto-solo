
// =====================================
// 1. SELECIONAR ELEMENTOS HTML
// =====================================

const form = document.getElementById("transaction-form");

const typeInput = document.getElementById("transaction-type");
const nameInput = document.getElementById("transaction-name");
const categoryInput = document.getElementById("transaction-category");
const amountInput = document.getElementById("transaction-amount");
const dateInput = document.getElementById("transaction-date");

const balanceElement = document.getElementById("balance-value");
const incomeElement = document.getElementById("income-value");
const expenseElement = document.getElementById("expense-value");

const transactionsList = document.querySelector(".transactions-card");


// =====================================
// 2. CONFIGURAÇÃO DO ARMAZENAMENTO
// =====================================

const STORAGE_KEY = "fincontrol_dados";

const initialData = {
    balance: 2450,
    income: 3000,
    expense: 550,
    transactions: []
};

function loadData() {

    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
            const data = JSON.parse(savedData);

            if (
                typeof data.balance === "number" &&
                typeof data.income === "number" &&
                typeof data.expense === "number" &&
                Array.isArray(data.transactions)
            ) {
                return data;
            }
        }

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }

    return { ...initialData };
}

let financialData = loadData();


// =====================================
// 3. SALVAR DADOS
// =====================================

function saveData() {

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(financialData)
        );

    } catch (error) {
        console.error("Erro ao salvar dados:", error);
        alert("Não foi possível salvar os dados no navegador.");
    }

}


// =====================================
// 4. FORMATAR VALORES
// =====================================

function formatCurrency(value) {

    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

}


// =====================================
// 5. ATUALIZAR DASHBOARD
// =====================================

function updateDashboard() {

    balanceElement.textContent =
        formatCurrency(financialData.balance);

    incomeElement.textContent =
        formatCurrency(financialData.income);

    expenseElement.textContent =
        formatCurrency(financialData.expense);

}


// =====================================
// 6. CRIAR ELEMENTO DE TRANSAÇÃO
// =====================================

function createTransactionElement(transaction) {

    const item = document.createElement("div");
    item.classList.add("transaction-item");

    const info = document.createElement("div");
    info.classList.add("transaction-info");

    const icon = document.createElement("div");
    icon.classList.add("transaction-icon");

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = transaction.name;

    const category = document.createElement("span");
    category.textContent = transaction.category;

    const dateElement = document.createElement("div");
    dateElement.classList.add("transaction-date");

    dateElement.textContent = new Date(
        transaction.date + "T12:00:00"
    ).toLocaleDateString("pt-BR");

    const value = document.createElement("div");
    value.classList.add("transaction-value");

    if (transaction.type === "income") {

        icon.textContent = "↗";
        icon.classList.add("income");

        value.textContent =
            "+ " + formatCurrency(transaction.amount);

        value.classList.add("positive");

    } else {

        icon.textContent = "↙";

        value.textContent =
            "- " + formatCurrency(transaction.amount);

        value.classList.add("expense");

    }

    details.appendChild(title);
    details.appendChild(category);

    info.appendChild(icon);
    info.appendChild(details);

    item.appendChild(info);
    item.appendChild(dateElement);
    item.appendChild(value);

    return item;
}


// =====================================
// 7. RECUPERAR TRANSAÇÕES SALVAS
// =====================================

function renderTransactions() {

    [...financialData.transactions].reverse().forEach(transaction => {

        const element = createTransactionElement(transaction);

        transactionsList.prepend(element);

    });

}


// =====================================
// 8. CADASTRAR MOVIMENTAÇÃO
// =====================================

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const type = typeInput.value;
    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const amount = Number(amountInput.value);
    const date = dateInput.value;

    if (
        !name ||
        !date ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    const transaction = {
        id: Date.now(),
        type: type,
        name: name,
        category: category,
        amount: amount,
        date: date
    };


    // Atualizar valores financeiros

    if (type === "income") {

        financialData.income += amount;
        financialData.balance += amount;

    } else {

        financialData.expense += amount;
        financialData.balance -= amount;

    }


    // Salvar movimentação

    financialData.transactions.unshift(transaction);

    saveData();


    // Atualizar interface

    updateDashboard();

    const element = createTransactionElement(transaction);

    transactionsList.prepend(element);


    // Limpar formulário

    form.reset();

    alert("Movimentação cadastrada com sucesso!");

});


// =====================================
// 9. INICIALIZAR DASHBOARD
// =====================================

updateDashboard();

renderTransactions();


// =================================
// NAVEGAÇÃO DA BARRA LATERAL
// =================================

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        // Remove a classe active de todos os links
        navLinks.forEach(item => {
            item.classList.remove("active");
        });

        // Adiciona active ao link clicado
        this.classList.add("active");

        // Encontra a seção correspondente
        const targetId = this.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId);

        // Rola até a seção
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});
