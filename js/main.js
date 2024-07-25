const API_LINK = "https://min-api.cryptocompare.com/data/";
const API_KEY = "fff72045f9c06497ff6c4fb4fa17c3f4be95c6ddd7481e81612f66a2617e2855";

const inputCoin = document.querySelector('.input-coin');
const errorMessage = document.querySelector('.error_message');
const addCoinButton = document.querySelector('.add-coin');
const coinsSection = document.querySelector('.coins-section');
const coinCards = document.querySelector('.coin-cards');
const settingsButton = document.querySelector('.settings-button');
const settingsMenu = document.querySelector('.settings-menu');
const themeSelect = document.querySelector('.theme-select');
const currencySelect = document.querySelector('.currency-select');
const offeredCoins = document.querySelector('.offered-coins');
const searchedCoinsInput = document.querySelector('.searched-coins');
const coinsDescendButton = document.querySelector('.coins-descend');
const coinsAscendButton = document.querySelector('.coins-ascend');

const coinIntervals = new Map();

const systemTheme = 'system';
let savedTheme = getCookie('theme') || systemTheme;
themeSelect.value = savedTheme;

setTheme(savedTheme);

let currency = getCookie('currency') || 'USD';
currencySelect.value = currency;

let allCoins = [];
let currentPage = 1;
const coinsPerPage = 6;


async function fetchALLCoins() {
    const response = await fetch(`${API_LINK}all/coinlist?summary=true&api_key=${API_KEY}`);
    const data = await response.json();

    allCoins = Object.keys(data.Data);
}

function createCoinCard(coin, price) {
    const card = document.createElement('div');

    card.classList.add('coin-card');
    card.innerHTML = `
        <div class="coin-values">
            <dt class="coin-name">${coin} - ${currency}</dt>
            <dd class="coin-price">${price}</dd>
        </div>
        <button class="coin-delete">Видалити</button>
    `;

    const coinDelete = card.querySelector('.coin-delete');

    coinDelete.addEventListener('click', () => {
        card.remove();
        removeCoinFromLocalStorage(coin);

        if (coinCards.children.length === 0) {
            coinsSection.classList.add('hidden');
        }

        clearInterval(coinIntervals.get(coin));
        coinIntervals.delete(coin);
        updateCoinDisplay();
        updateURL();
    });

    return card;
}

function getCoinsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('coins')) || [];
}

function addCoinToLocalStorage(coin) {
    const coins = getCoinsFromLocalStorage();

    if (coins.includes(coin)) {
        return false;
    }

    coins.push(coin);
    localStorage.setItem('coins', JSON.stringify(coins));

    return true;
}

function removeCoinFromLocalStorage(coin) {
    let coins = getCoinsFromLocalStorage();

    coins = coins.filter(currentCoin => currentCoin !== coin);
    localStorage.setItem('coins', JSON.stringify(coins));
}

function checkCoinError(coin, priceElement) {
    priceElement.textContent = "Не знайдено";
    priceElement.parentElement.classList.add('bg-red-200');

    clearInterval(coinIntervals.get(coin));
    coinIntervals.delete(coin);
}

async function getCoinPrice(coin, priceElement) {
    try {
        const response = await fetch(`${API_LINK}price?fsym=${coin}&tsyms=${currency}&api_key=${API_KEY}`);
        const data = await response.json();

        if (data.Response === "Error") {
            checkCoinError(coin, priceElement);
        } else {
            priceElement.textContent = data[currency];
            priceElement.parentElement.classList.remove('bg-red-200');
        }
    } catch (error) {
        checkCoinError(coin, priceElement);
    }
}

async function addCoinCard(coin) {
    const coinCard = createCoinCard(coin, 'Завантаження...');
    const coinPrice = coinCard.querySelector('.coin-price');

    coinCards.appendChild(coinCard);
    coinsSection.classList.remove('hidden');

    await getCoinPrice(coin, coinPrice);

    const intervalId = setInterval(() => getCoinPrice(coin, coinPrice), 10000);

    coinIntervals.set(coin, intervalId);
}

function loadCoinsFromLocalStorage() {
    const coins = getCoinsFromLocalStorage();

    coins.forEach(coin => addCoinCard(coin));

    if (coins.length > 0) {
        coinsSection.classList.remove('hidden');
    }
}

async function checkCoinInLocalStorage(coin) {
    if (addCoinToLocalStorage(coin)) {
        errorMessage.classList.add('hidden');
        await addCoinCard(coin);
    } else {
        errorMessage.classList.remove('hidden');
    }
}

function clearValues() {
    offeredCoins.innerHTML = '';
    inputCoin.value = '';
    searchedCoinsInput.value = '';
}

async function addCoin() {
    const inputCoinValue = inputCoin.value.trim().toUpperCase();

    if (inputCoinValue === '') {
        return;
    }

    await checkCoinInLocalStorage(inputCoinValue);
    clearValues();
    updateCoinDisplay();
    updateURL();
}

addCoinButton.addEventListener('click', addCoin);

inputCoin.addEventListener('input', () => {
    const inputCoinValue = inputCoin.value.trim().toUpperCase();

    if (inputCoinValue === '') {
        return;
    }

    const filteredCoins = allCoins.filter(coin => coin.includes(inputCoinValue)).slice(0, 5);

    offeredCoins.innerHTML = '';

    filteredCoins.forEach(coin => {
        const span = document.createElement('span');

        span.classList.add('offered-coin');
        span.textContent = coin;

        span.addEventListener('click', async () => {
            await checkCoinInLocalStorage(coin);
            clearValues();
            updateCoinDisplay();
            updateURL();
        });
        offeredCoins.appendChild(span);
    });
});

inputCoin.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        await addCoin();
    }
});

inputCoin.addEventListener('focus', () => {
    errorMessage.classList.add('hidden');
});

function setCookie(name, value, daysToLive) {
    const date = new Date();

    date.setTime(date.getTime() + (daysToLive * 24 * 60 * 60 * 1000));

    const expires = `expires=${date.toUTCString()}`;

    document.cookie = `${name}=${value}; ${expires}; path=/`;
}

function getCookie(name) {
    const cookieDecoded = decodeURIComponent(document.cookie);
    const cookieArray = cookieDecoded.split("; ");
    let result = null;

    cookieArray.forEach(element => {
        if (element.indexOf(name) === 0) {
            result = element.substring(name.length + 1);
        }
    });

    return result;
}

settingsButton.addEventListener('click', () => {
    settingsMenu.classList.toggle('hidden');
});

document.addEventListener('click', (event) => {
    if (settingsButton.contains(event.target) || settingsMenu.contains(event.target)) {
        return;
    }

    settingsMenu.classList.add('hidden');
});

function setTheme(theme) {
    if (theme === systemTheme) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setCookie('theme', '', -1);
    } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        setCookie('theme', theme, 365);
    }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = themeSelect.value;

    if (currentTheme === systemTheme) {
        setTheme(systemTheme);
    }
});

themeSelect.addEventListener('change', (event) => {
    const selectedTheme = event.target.value;
    setTheme(selectedTheme);
});

currencySelect.addEventListener('change', (event) => {
    currency = event.target.value;
    setCookie('currency', currency, 365);
    location.reload();
});

function paginateCoins(coins, pageNumber) {
    const start = (pageNumber - 1) * coinsPerPage;
    const end = start + coinsPerPage;

    return coins.slice(start, end);
}

function updateCoinDisplay() {
    const allCoinCards = document.querySelectorAll('.coin-card');
    const searchedValue = searchedCoinsInput.value.trim().toUpperCase();

    const filteredCoins = Array.from(allCoinCards).filter(card => {
        const coinName = card.querySelector('.coin-name').textContent.split(' - ')[0];

        return coinName.includes(searchedValue);
    });

    const totalPages = Math.ceil(filteredCoins.length / coinsPerPage);

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    allCoinCards.forEach(card => card.classList.add('hidden'));

    const paginatedCoins = paginateCoins(filteredCoins, currentPage);

    paginatedCoins.forEach(card => card.classList.remove('hidden'));

    createPagination(totalPages);
}

function updateURL() {
    const filter = searchedCoinsInput.value.trim();
    const url = new URL(window.location);

    if (filter) {
        url.searchParams.set('filter', filter);
    } else {
        url.searchParams.delete('filter');
    }

    if (currentPage > 1) {
        url.searchParams.set('page', currentPage);
    } else {
        url.searchParams.delete('page');
    }

    window.history.pushState({}, '', url);
}

searchedCoinsInput.addEventListener('input', () => {
    updateCoinDisplay();
    updateURL();
});

function createPagination(totalPages) {
    const pagination = document.querySelector('.coins-pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }

    const previousPageButton = document.createElement('li');

    previousPageButton.innerHTML = '<a href="#" class="coins-previous-page">Назад</a>';
    pagination.appendChild(previousPageButton);

    previousPageButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            updateCoinDisplay();
            updateURL();
        }
    });

    const createPageButton = (page) => {
        const listItem = document.createElement('li');
        const paginationItem = document.createElement('a');

        paginationItem.href = "#";
        paginationItem.classList.add('coins-page');
        paginationItem.textContent = page;

        if (page === currentPage) {
            paginationItem.classList.add('text-blue-700');
        }

        paginationItem.addEventListener('click', (event) => {
            event.preventDefault();
            currentPage = page;
            updateCoinDisplay();
            updateURL();
        });

        listItem.appendChild(paginationItem);

        return listItem;
    };

    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage <= 3) {
            startPage = 1;
            endPage = Math.min(maxPagesToShow, totalPages);
        } else if (currentPage + 2 >= totalPages) {
            startPage = Math.max(totalPages - maxPagesToShow + 1, 1);
            endPage = totalPages;
        } else {
            startPage = currentPage - 2;
            endPage = currentPage + 2;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pagination.appendChild(createPageButton(i));
    }

    const nextPageButton = document.createElement('li');

    nextPageButton.innerHTML = '<a href="#" class="coins-next-page">Вперед</a>';
    pagination.appendChild(nextPageButton);

    nextPageButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
        } else {
            currentPage = 1;
        }
        updateCoinDisplay();
        updateURL();
    });

    pagination.classList.remove('hidden');
}

function sortCoins(order) {
    const coinCardsArray = Array.from(coinCards.children);

    coinCardsArray.sort((value, nextValue) => {
        const number = +value.querySelector('.coin-price').textContent || 0;
        const nextNumber = +nextValue.querySelector('.coin-price').textContent || 0;
        const ascendSort = 'ascend';

        return order === ascendSort ? number - nextNumber : nextNumber - number;
    });

    coinCardsArray.forEach(card => coinCards.appendChild(card));
    updateCoinDisplay();
}

coinsDescendButton.addEventListener('click', () => sortCoins('descend'));
coinsAscendButton.addEventListener('click', () => sortCoins('ascend'));

document.addEventListener('DOMContentLoaded', async () => {
    await fetchALLCoins();
    loadCoinsFromLocalStorage();

    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter') || '';
    const page = +urlParams.get('page') || 1;

    searchedCoinsInput.value = filter;
    currentPage = page;

    updateCoinDisplay();
});