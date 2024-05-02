
$(document).ready(function () {
    loadContent('currencies');
    loadCoins();
    createAboutButton();
});

$(document).ready(function () {
    $('.nav-link[data-target="realtime"]').on('click', function () {
        loadContent('realtime');
    });
    createRealTimeReportsButton();
    loadCoins();
});

function createRealTimeReportsButton() {
    const realtimeButton = $('<a>', {
        'class': 'nav-link',
        'href': '#',
        'data-target': 'realtime',
        'text': 'Real-time Reports'
    });

    realtimeButton.on('click', function () {
        loadContent('realtime');
    });

    $('.navbar-nav').append(realtimeButton);
}
function createAboutButton() {
    const aboutButton = document.createElement('a');
    aboutButton.classList.add('nav-link');
    aboutButton.setAttribute('href', '#');
    aboutButton.textContent = 'About';

    aboutButton.addEventListener('click', function () {
        loadContent('about');
    });

    const navBar = document.querySelector('.navbar-nav');
    navBar.appendChild(aboutButton);
}

function loadRealTimeReport() {
    $('#coins-container').css('display', 'none');
    $('#chartContainer').css('display', 'block');
    updateGraph();
}

function loadContent(target) {
    const aboutContent = document.getElementById('about-content');

    if (target === 'currencies') {
        aboutContent.style.display = 'none';
        $('#coins-container').css('display', 'block');
        $('#chartContainer').css('display', 'none');
    } else if (target === 'realtime') {
        aboutContent.style.display = 'none';
        loadRealTimeReport();
    } else if (target === 'about') {
        aboutContent.style.display = 'block';
        $('#coins-container').css('display', 'none');
        $('#chartContainer').css('display', 'none');
    } else {
        aboutContent.style.display = 'none';
    }
}

let selectedCurrencies = [];

function loadCoins() {
    $.ajax({
        url: 'https://api.coingecko.com/api/v3/coins/markets',
        data: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100, 
            page: 1, 
        },
        success: function (data) {
            const coinsContainer = $('#coins-container');
            coinsContainer.empty();

            let row = $('<div class="row"></div>');
            data.forEach(coin => {
                const coinCard = `
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <div class="card-body">
                            <div class="card-footer d-flex justify-content-end">
                                <div class="form-check form-switch text-right">
                                    <input class="form-check-input toggleButton" type="checkbox" role="switch" id="toggleButton${coin.id}" data-id="${coin.id}" data-name="${coin.name}" onchange="toggleReport('${coin.id}')">
                                    <label class="form-check-label" for="toggleButton${coin.id}"></label>
                                </div>
                            </div>
                                <h5 class="card-title">${coin.name}</h5>
                                <p class="card-text">${coin.symbol.toUpperCase()}</p>
                                <button class="btn btn-primary" data-toggle="collapse" data-target="#collapse${coin.id}" aria-expanded="false" aria-controls="collapse${coin.id}" onclick="loadMoreInfo('${coin.id}')">More Info</button>
                                <div class="collapse" id="collapse${coin.id}">
                                    <div class="mt-3">
                                        <div id="moreInfoContent${coin.id}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                row.append(coinCard);

                if (row.children().length === 3) {
                    coinsContainer.append(row);
                    row = $('<div class="row"></div>');
                }
            });

            if (row.children().length > 0) {
                coinsContainer.append(row);
            }
        },
        error: function (error) {
            console.error('Error fetching coins:', error);
        }
    });
}

function loadMoreInfo(coinId) {
    const cachedData = localStorage.getItem(coinId);
    if (cachedData) {
        const cachedInfo = JSON.parse(cachedData);
        const currentTime = new Date().getTime();
        if (currentTime - cachedInfo.timestamp < 120000) {
            displayCachedInfo(coinId, cachedInfo);
            return;
        }
    }

    $.ajax({
        url: `https://api.coingecko.com/api/v3/coins/${coinId}`,
        success: function (data) {
            const currentTime = new Date().getTime();
            const coinInfo = {
                data: data,
                timestamp: currentTime
            };
            localStorage.setItem(coinId, JSON.stringify(coinInfo));
            displayInfoAndUpdateUI(coinId, coinInfo);
        },
        error: function (error) {
            console.error('Error fetching more info:', error);
            const moreInfoContent = $(`#moreInfoContent${coinId}`);
            moreInfoContent.html('<p>Error fetching data. Please try again.</p>');
        }
    });
}

function displayInfoAndUpdateUI(coinId, coinInfo) {
    const moreInfoContent = $(`#moreInfoContent${coinId}`);
    moreInfoContent.empty();

    const imageUrl = coinInfo.data.image.large;
    const usdPrice = coinInfo.data.market_data.current_price.usd;
    const eurPrice = coinInfo.data.market_data.current_price.eur;
    const ilsPrice = coinInfo.data.market_data.current_price.ils;

    const additionalInfo = `
        <h5>${coinInfo.data.name}</h5>
        <img src="${imageUrl}" alt="${coinInfo.data.name} Image" style="max-width: 100px;">
        <p>Price (USD): $${usdPrice}</p>
        <p>Price (EUR): €${eurPrice}</p>
        <p>Price (ILS): ₪${ilsPrice}</p>
    `;
    moreInfoContent.html(additionalInfo);
}

function displayCachedInfo(coinId, cachedInfo) {
    displayInfoAndUpdateUI(coinId, cachedInfo);
}

function removeReport(coinId) {
    selectedCurrencies = selectedCurrencies.filter(currency => currency.id !== coinId);
    updateReportButtons();
    $('#manageReportsModal').modal('hide');
}

function updateReportButtons() {
    const toggleButtons = $('.toggleButton');
    toggleButtons.each(function () {
        const coinId = $(this).data('id');
        if (selectedCurrencies.some(currency => currency.id === coinId)) {
            $(this).removeClass('btn-outline-primary').addClass('btn-primary');
        } else {
            $(this).removeClass('btn-primary').addClass('btn-outline-primary');
        }
    });
}
function toggleReport(coinId) {
    const coinIndex = selectedCurrencies.findIndex(currency => currency.id === coinId);
    if (coinIndex === -1) {
        if (selectedCurrencies.length >= 5) {
            displaySelectedCoinsModal();
            return;
        }
        const coinName = $(`#toggleButton${coinId}`).data('name');
        selectedCurrencies.push({ id: coinId, name: coinName });
    } else {
        selectedCurrencies.splice(coinIndex, 1);
    }
    updateReportButtons();
    updateGraph(); 
}

function displaySelectedCoinsModal() {
    const modalBody = $('#selectedCurrenciesList');
    modalBody.empty();

    selectedCurrencies.forEach(currency => {
        const listItem = $('<div>', {
            'class': 'form-check',
            'html': `
                <input class="form-check-input removeCheckbox" type="checkbox" value="${currency.id}" id="removeCheckbox${currency.id}">
                <label class="form-check-label" for="removeCheckbox${currency.id}">${currency.name}</label>
            `
        });
        modalBody.append(listItem);
    });

    const modalFooter = $('.modal-footer');
    modalFooter.empty();
    const removeButton = $('<button>', {
        'type': 'button',
        'class': 'btn btn-danger',
        'text': 'Remove',
        'click': function () {
            removeSelectedCoins();
            $('#manageReportsModal').modal('hide');
        }
    });
    modalFooter.append(removeButton);

    $('#manageReportsModal').modal('show');
}

function removeSelectedCoins() {
    const selectedIds = [];
    $('.removeCheckbox:checked').each(function () {
        selectedIds.push($(this).val());
    });

    selectedIds.forEach(id => {
        selectedCurrencies = selectedCurrencies.filter(currency => currency.id !== id);
        $(`#toggleButton${id}`).prop('checked', false);
    });

    updateReportButtons();
}

function updateGraph() {
    const dataPoints = [];
    const coinIds = selectedCurrencies.map(currency => currency.id).join(',');
    const apiUrl = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinIds}&tsyms=USD`;

    $.ajax({
        url: apiUrl,
        success: function (data) {
            selectedCurrencies.forEach(currency => {
                const coinData = data[currency.id];
                if (coinData && coinData.usd) {
                    const price = coinData.usd;
                    dataPoints.push({ label: currency.name, y: price });
                }
            });

            updateChart(dataPoints);
        },
        error: function (error) {
            console.error('Error fetching data:', error);
        }
    });
}


function updateChart(dataPoints) {
    const chart = new CanvasJS.Chart("chartContainer", {
        title: {
            text: "Real-time Crypto Prices"
        },
        data: [{
            type: "line",
            dataPoints: dataPoints.map(point => ({ x: point.label, y: point.y }))
        }]
    });
    
    chart.render();
}

setInterval(updateGraph, 2000);

function searchCurrencies(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
    if (searchInput === '') {
        alert('Please enter a valid cryptocurrency name.');
        return;
    }

    $.ajax({
        url: 'https://api.coingecko.com/api/v3/coins/list',
        success: function (data) {
            const searchedCoin = data.find(coin => coin.name.toLowerCase() === searchInput || coin.symbol.toLowerCase() === searchInput);
            if (searchedCoin) {
                displaySearchedCoin(searchedCoin);
            } else {
                alert('Cryptocurrency not found. Please try again.');
            }
        },
        error: function (error) {
            console.error('Error fetching coins:', error);
            alert('An error occurred while fetching cryptocurrency data. Please try again later.');
        }
    });
    document.getElementById('searchInput').value = '';
}

function displaySearchedCoin(data) {
    const coinsContainer = $('#coins-container');
    coinsContainer.empty();

    if (!data) {
        alert('Cryptocurrency not found. Please try again.');
        return;
    }

    const coinCard = `
    //     <div class="col-md-4 mb-4">
    //         <div class="card">
           
    //             <div class="card-body">
    //                 <h5 class="card-title">${data.name}</h5>
    //                 <p class="card-text">${data.symbol}</p>
    //                 <button class="btn btn-primary" data-toggle="collapse" data-target="#collapse${data.id}" aria-expanded="false" aria-controls="collapse${data.id}" onclick="loadMoreInfo('${data.id}')">More Info</button>
    //                 <div class="collapse" id="collapse${data.id}">
    //                     <div class="mt-3">
    //                         <div id="moreInfoContent${data.id}">
    //                             <h5>${data.name}</h5>
    //                             <img src="${data.image && data.image.large ? data.image.large : ''}" alt="${data.name} Image" style="max-width: 100px;">
    //                             <p>Price (USD): $${data.market_data ? data.market_data.current_price.usd : ''}</p>
    //                             <p>Price (EUR): €${data.market_data ? data.market_data.current_price.eur : ''}</p>
    //                             <p>Price (ILS): ₪${data.market_data ? data.market_data.current_price.ils : ''}</p>
    //                         </div>
    //                     </div>
    //                 </div>
                   
    //             </div>
    //         </div>
    //     </div>
    // `;
    

    coinsContainer.append(coinCard);
    const showFullListButton = $('<button>', {
        'class': 'btn btn-secondary',
        'text': 'Show Full Coins List',
        'click': function () {
            loadFullCoinList();
        }
    });

    coinsContainer.append(showFullListButton);
}
function loadFullCoinList() {
    $.ajax({
        url: 'https://api.coingecko.com/api/v3/coins/list',
        success: function (data) {
            loadCoins(data);
        },
        error: function (error) {
            console.error('Error fetching coins:', error);
            alert('An error occurred while fetching cryptocurrency data. Please try again later.');
        }
    });
}