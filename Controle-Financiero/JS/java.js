
// ==========================================
// 1. ELEMENTOS HTML
// ==========================================

const form = document.getElementById("transaction-form");

const typeInput = document.getElementById("transaction-type");
const nameInput = document.getElementById("transaction-name");
const categoryInput = document.getElementById("transaction-category");
const amountInput = document.getElementById("transaction-amount");
const dateInput = document.getElementById("transaction-date");

const balanceValue = document.getElementById("balance-value");
const incomeValue = document.getElementById("income-value");
const expenseValue = document.getElementById("expense-value");

const transactionsList = document.querySelector(".transactions-card");

const monthFilter = document.getElementById("period-month");
const yearFilter = document.getElementById("period-year");

const STORAGE_KEY = "fincontrol_dados";


// ==========================================
// 2. DADOS INICIAIS E LOCALSTORAGE
// ==========================================

const initialData = {
    openingBalance: 2450,
    transactions: []
};

function loadData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return {
                ...initialData,
                transactions: []
            };
        }

        const data = JSON.parse(savedData);

        const transactions = Array.isArray(data.transactions)
            ? data.transactions.filter(transaction =>
                transaction &&
                (transaction.type === "income" || transaction.type === "expense") &&
                Number.isFinite(Number(transaction.amount)) &&
                transaction.date
            ).map(transaction => ({
                ...transaction,
                amount: Number(transaction.amount)
            }))
            : [];

        // Compatibilidade com a estrutura antiga
        if (Number.isFinite(Number(data.openingBalance))) {
            return {
                openingBalance: Number(data.openingBalance),
                transactions
            };
        }

        const transactionBalance = transactions.reduce((total, transaction) => {
            return total + (
                transaction.type === "income"
                    ? transaction.amount
                    : -transaction.amount
            );
        }, 0);

        const oldBalance = Number.isFinite(Number(data.balance))
            ? Number(data.balance)
            : initialData.openingBalance;

        return {
            openingBalance: oldBalance - transactionBalance,
            transactions
        };

    } catch (error) {
        console.error("Erro ao carregar os dados:", error);

        return {
            ...initialData,
            transactions: []
        };
    }
}

let financialData = loadData();

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(financialData));
        return true;
    } catch (error) {
        console.error("Erro ao salvar os dados:", error);
        alert("Não foi possível salvar os dados.");
        return false;
    }
}


// ==========================================
// 3. FORMATAÇÃO DE VALORES
// ==========================================

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


// ==========================================
// 4. CONFIGURAÇÃO DO FILTRO DE ANO
// ==========================================

function setupYearFilter() {
    if (!yearFilter) return;

    const currentYear = new Date().getFullYear();

    const years = new Set();

    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
        years.add(year);
    }

    financialData.transactions.forEach(transaction => {
        const year = Number(transaction.date.slice(0, 4));

        if (Number.isInteger(year)) {
            years.add(year);
        }
    });

    const selectedYear = yearFilter.value || String(currentYear);

    yearFilter.innerHTML = "";

    [...years].sort((a, b) => b - a).forEach(year => {
        const option = document.createElement("option");

        option.value = String(year);
        option.textContent = String(year);

        yearFilter.appendChild(option);
    });

    yearFilter.value = years.has(Number(selectedYear))
        ? selectedYear
        : String(currentYear);
}


// ==========================================
// 5. FILTRAR TRANSAÇÕES
// ==========================================

function getFilteredTransactions() {
    const selectedMonth = monthFilter?.value || "all";
    const selectedYear = yearFilter?.value || String(new Date().getFullYear());

    return financialData.transactions.filter(transaction => {
        const transactionYear = transaction.date.slice(0, 4);
        const transactionMonth = transaction.date.slice(5, 7);

        const matchesYear = transactionYear === selectedYear;
        const matchesMonth =
            selectedMonth === "all" || transactionMonth === selectedMonth;

        return matchesYear && matchesMonth;
    });
}


// ==========================================
// 6. CALCULAR RESUMO FINANCEIRO
// ==========================================

function updateDashboard() {
    const selectedMonth = monthFilter?.value || "all";
    const selectedYear = Number(
        yearFilter?.value || new Date().getFullYear()
    );

    const filteredTransactions = getFilteredTransactions();

    let income = 0;
    let expense = 0;

    filteredTransactions.forEach(transaction => {
        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expense += transaction.amount;
        }
    });

    // Saldo acumulado até o fim do período selecionado
    const cutoffDate = selectedMonth === "all"
        ? `${selectedYear}-12-31`
        : new Date(selectedYear, Number(selectedMonth), 0)
            .toISOString()
            .slice(0, 10);

    const accumulatedTransactions = financialData.transactions.filter(
        transaction => transaction.date <= cutoffDate
    );

    let balance = financialData.openingBalance;

    accumulatedTransactions.forEach(transaction => {
        if (transaction.type === "income") {
            balance += transaction.amount;
        } else {
            balance -= transaction.amount;
        }
    });

    if (balanceValue) {
        balanceValue.textContent = formatCurrency(balance);
    }

    if (incomeValue) {
        incomeValue.textContent = formatCurrency(income);
    }

    if (expenseValue) {
        expenseValue.textContent = formatCurrency(expense);
    }
}


// ==========================================
// 7. CRIAR ELEMENTO DE TRANSAÇÃO
// ==========================================

function createTransactionElement(transaction) {
    const item = document.createElement("div");
    item.classList.add("transaction-item");

    const info = document.createElement("div");
    info.classList.add("transaction-info");

    const title = document.createElement("h4");
    title.textContent = transaction.name;

    const details = document.createElement("p");

    const date = transaction.date.split("-").reverse().join("/");

    details.textContent = `${transaction.category} • ${date}`;

    info.appendChild(title);
    info.appendChild(details);

    const amount = document.createElement("span");
    amount.classList.add("transaction-amount");

    if (transaction.type === "income") {
        amount.textContent = `+ ${formatCurrency(transaction.amount)}`;
        amount.classList.add("income");
    } else {
        amount.textContent = `- ${formatCurrency(transaction.amount)}`;
        amount.classList.add("expense");
    }

    item.appendChild(info);
    item.appendChild(amount);

    return item;
}


// ==========================================
// 8. MOSTRAR TRANSAÇÕES NA TELA
// ==========================================

function renderTransactions() {
    if (!transactionsList) return;

    // Remove os exemplos estáticos do HTML e a lista anterior
    transactionsList.querySelectorAll(
        ".transaction-item, .empty-message"
    ).forEach(element => element.remove());

    const transactions = getFilteredTransactions();

    // Mais recentes primeiro
    transactions.sort((a, b) => {
        if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
        }

        return Number(b.id || 0) - Number(a.id || 0);
    });

    if (transactions.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent = "Nenhuma transação encontrada neste período.";

        transactionsList.appendChild(emptyMessage);
        return;
    }

    transactions.forEach(transaction => {
        transactionsList.appendChild(
            createTransactionElement(transaction)
        );
    });
}


// ==========================================
// 9. ATUALIZAR TODA A DASHBOARD
// ==========================================

function refreshDashboard() {
    updateDashboard();
    renderTransactions();
}


// ==========================================
// 10. CADASTRAR NOVA TRANSAÇÃO
// ==========================================

if (form) {
    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const type = typeInput.value;
        const name = nameInput.value.trim();
        const category = categoryInput.value;
        const amount = Number(amountInput.value);
        const date = dateInput.value;

        if (!name || !date || !Number.isFinite(amount) || amount <= 0) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        if (type !== "income" && type !== "expense") {
            alert("Selecione um tipo de transação válido.");
            return;
        }

        const transaction = {
            id: Date.now(),
            type,
            name,
            category,
            amount,
            date
        };

        financialData.transactions.push(transaction);

        if (!saveData()) {
            financialData.transactions.pop();
            return;
        }

        // Atualiza o filtro de ano caso seja um ano novo
        const transactionYear = date.slice(0, 4);
        const availableYears = [...yearFilter.options].map(option => option.value);

        if (yearFilter && !availableYears.includes(transactionYear)) {
            setupYearFilter();
        }

        // Mostra o período da nova transação
        if (yearFilter) {
            yearFilter.value = transactionYear;
        }

        if (monthFilter) {
            monthFilter.value = date.slice(5, 7);
        }

        refreshDashboard();

        form.reset();

        alert("Transação cadastrada com sucesso!");
    });
}


// ==========================================
// 11. EVENTOS DOS FILTROS
// ==========================================

if (monthFilter) {
    monthFilter.addEventListener("change", refreshDashboard);
}

if (yearFilter) {
    yearFilter.addEventListener("change", refreshDashboard);
}


// ==========================================
// 12. NAVEGAÇÃO LATERAL
// ==========================================

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(link => {
    link.addEventListener("click", function() {
        navLinks.forEach(item => item.classList.remove("active"));

        this.classList.add("active");
    });
});


// ==========================================
// 13. INICIALIZAÇÃO
// ==========================================

setupYearFilter();

if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
}

refreshDashboard();
