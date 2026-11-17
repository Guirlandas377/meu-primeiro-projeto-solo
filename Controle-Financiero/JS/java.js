
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

const monthFilter = document.getElementById("period-month");
const yearFilter = document.getElementById("period-year");


// =====================================
// 2. CONFIGURAÇÃO DO ARMAZENAMENTO
// =====================================

const STORAGE_KEY = "fincontrol_dados";

const initialData = {
    openingBalance: 2450,
    initialIncome: 3000,
    initialExpense: 550,
    transactions: []
};

function loadData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
            const data = JSON.parse(savedData);

            if (Array.isArray(data.transactions)) {

                // Compatibilidade com dados da versão anterior
                if (
                    typeof data.openingBalance !== "number" ||
                    typeof data.initialIncome !== "number" ||
                    typeof data.initialExpense !== "number"
                ) {
                    const transactionIncome = data.transactions
                        .filter(t => t.type === "income")
                        .reduce((total, t) => total + Number(t.amount), 0);

                    const transactionExpense = data.transactions
                        .filter(t => t.type === "expense")
                        .reduce((total, t) => total + Number(t.amount), 0);

                    const oldIncome = Number(data.income) || 3000;
                    const oldExpense = Number(data.expense) || 550;
                    const oldBalance = Number(data.balance) || 2450;

                    return {
                        openingBalance:
                            oldBalance - transactionIncome + transactionExpense,

                        initialIncome: oldIncome - transactionIncome,
                        initialExpense: oldExpense - transactionExpense,

                        transactions: data.transactions
                    };
                }

                return data;
            }
        }

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }

    return {
        ...initialData,
        transactions: []
    };
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

        return true;

    } catch (error) {
        console.error("Erro ao salvar dados:", error);
        alert("Não foi possível salvar os dados no navegador.");

        return false;
    }
}


// =====================================
// 4. FORMATAR VALORES
// =====================================

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


// =====================================
// 5. CONFIGURAR FILTROS
// =====================================

function setupYearFilter() {
    if (!yearFilter) return;

    const currentYear = new Date().getFullYear();

    const years = new Set();

    // Anos das transações cadastradas
    financialData.transactions.forEach(transaction => {
        if (transaction.date) {
            years.add(Number(transaction.date.substring(0, 4)));
        }
    });

    // Ano atual e alguns anos próximos
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
        years.add(year);
    }

    const selectedYear = yearFilter.value;

    yearFilter.innerHTML = "";

    [...years].sort((a, b) => b - a).forEach(year => {
        const option = document.createElement("option");

        option.value = year;
        option.textContent = year;

        yearFilter.appendChild(option);
    });

    if (years.has(Number(selectedYear))) {
        yearFilter.value = selectedYear;
    } else {
        yearFilter.value = currentYear;
    }
}


// =====================================
// 6. FILTRAR TRANSAÇÕES
// =====================================

function getFilteredTransactions() {
    let transactions = [...financialData.transactions];

    const selectedMonth = monthFilter
        ? monthFilter.value
        : "all";

    const selectedYear = yearFilter
        ? Number(yearFilter.value)
        : null;

    if (selectedYear) {
        transactions = transactions.filter(transaction => {
            return Number(transaction.date.substring(0, 4)) === selectedYear;
        });
    }

    if (selectedMonth !== "all") {
        transactions = transactions.filter(transaction => {
            return transaction.date.substring(5, 7) === selectedMonth;
        });
    }

    return transactions;
}


// =====================================
// 7. ATUALIZAR DASHBOARD
// =====================================

function updateDashboard() {
    const selectedTransactions = getFilteredTransactions();

    const selectedMonth = monthFilter
        ? monthFilter.value
        : "all";

    const selectedYear = yearFilter
        ? Number(yearFilter.value)
        : null;

    let income = 0;
    let expense = 0;
    let balance = financialData.openingBalance;

    // Soma todas as transações até o período selecionado
    financialData.transactions.forEach(transaction => {
        const transactionYear = Number(transaction.date.substring(0, 4));
        const transactionMonth = Number(transaction.date.substring(5, 7));

        const isBeforeOrInSelectedPeriod =
            !selectedYear ||
            transactionYear < selectedYear ||
            (
                transactionYear === selectedYear &&
                (
                    selectedMonth === "all" ||
                    transactionMonth <= Number(selectedMonth)
                )
            );

        if (isBeforeOrInSelectedPeriod) {
            if (transaction.type === "income") {
                balance += Number(transaction.amount);
            } else {
                balance -= Number(transaction.amount);
            }
        }
    });

    // Calcula receitas e despesas do período filtrado
    income = financialData.initialIncome;
    expense = financialData.initialExpense;

    if (selectedMonth === "all" && selectedYear) {
        // Mostra o histórico total daquele ano, sem incluir os valores iniciais
        income = 0;
        expense = 0;
    }

    selectedTransactions.forEach(transaction => {
        if (transaction.type === "income") {
            income += Number(transaction.amount);
        } else {
            expense += Number(transaction.amount);
        }
    });

    // Valores iniciais representam um histórico sem data específica.
    // Eles só entram na visualização geral.
    if (selectedYear && selectedMonth !== "all") {
        income = 0;
        expense = 0;

        selectedTransactions.forEach(transaction => {
            if (transaction.type === "income") {
                income += Number(transaction.amount);
            } else {
                expense += Number(transaction.amount);
            }
        });
    }

    balanceElement.textContent = formatCurrency(balance);
    incomeElement.textContent = formatCurrency(income);
    expenseElement.textContent = formatCurrency(expense);
}


// =====================================
// 8. CRIAR ELEMENTO DE TRANSAÇÃO
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

        value.textContent = "+ " + formatCurrency(transaction.amount);
        value.classList.add("positive");

    } else {
        icon.textContent = "↙";

        value.textContent = "- " + formatCurrency(transaction.amount);
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
// 9. EXIBIR TRANSAÇÕES
// =====================================

function renderTransactions() {
    if (!transactionsList) return;

    // Remove os itens anteriores
    transactionsList
        .querySelectorAll(".transaction-item")
        .forEach(item => item.remove());

    const selectedTransactions = getFilteredTransactions();

    if (selectedTransactions.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent = "Nenhuma movimentação neste período.";

        transactionsList.appendChild(emptyMessage);
        return;
    }

    selectedTransactions.reverse().forEach(transaction => {
        const element = createTransactionElement(transaction);
        transactionsList.appendChild(element);
    });
}


// =====================================
// 10. ATUALIZAR TODA A INTERFACE
// =====================================

function refreshDashboard() {
    updateDashboard();
    renderTransactions();
}


// =====================================
// 11. CADASTRAR MOVIMENTAÇÃO
// =====================================

if (form) {
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

        financialData.transactions.push(transaction);

        if (!saveData()) {
            financialData.transactions.pop();
            return;
        }

        setupYearFilter();
        refreshDashboard();

        form.reset();

        alert("Movimentação cadastrada com sucesso!");
    });
}


// =====================================
// 12. EVENTOS DOS FILTROS
// =====================================

if (monthFilter) {
    monthFilter.addEventListener("change", refreshDashboard);
}

if (yearFilter) {
    yearFilter.addEventListener("change", refreshDashboard);
}


// =====================================
// 13. NAVEGAÇÃO DA BARRA LATERAL
// =====================================

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(link => {
    link.addEventListener("click", function(event) {
        const targetId = this.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId);

        if (!targetSection) return;

        event.preventDefault();

        navLinks.forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");

        targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});


// =====================================
// 14. INICIALIZAR DASHBOARD
// =====================================

setupYearFilter();
refreshDashboard();
