document.addEventListener('DOMContentLoaded', function () {
    // Pendeklarasian variabel untuk masing masing chart
    let monthlyChart = null;
    let variationChart = null;
    let aovChart = null;
    let revenueChart = null;
    let paymentChart = null;
    let categoryChart = null;

    // Pendeklarsian variabel untuk data
    let data = null;

    //Pendeklarasian inisialisasi array periode date
    let monthsFilter = [true, true, true, true, true, true, true, true, true, true, true, true]

    //Pendeklarasian warna
    const colors = {
        red: "rgba(255, 0, 0, 0.6)",
        yellow: "rgba(255, 255, 0, 0.6)",
        blue: "rgba(0, 0, 255, 0.6)",
        green: "rgba(0, 128, 0, 0.6)"
    };

    const borderColors = {
        red: "rgba(255, 0, 0, 1)",
        yellow: "rgba(255, 255, 0, 1)",
        blue: "rgba(0, 0, 255, 1)",
        green: "rgba(0, 128, 0, 1)"
    };

    //Pendeklarasian inisialisasi lokasi, kategori dan bulan
    const locations = ["GuttenPlans", "EB Public Library", "Brunswick Sq Mall", "Earle Asphalt"];
    const categories = ["Food", "Carbonated", "Non Carbonated", "Water"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    //Filterisasi Periode date
    function selectedMonth(idx) {
        // Toggle the selected month filter
        monthsFilter[idx] = !monthsFilter[idx]
        fetch('./vending_machine_sales.json').then(response => response.json()).then(data =>
            updateChartAndTable(data)
        )
    }

    let els = document.getElementsByClassName('monthsFilter')
    for (let i = 0; i < els.length; i++) {
        els[i].addEventListener('click', () => {
            selectedMonth(i)
        })
    }

    async function fetchData() {
        let response = await fetch('./vending_machine_sales.json');
        data = await response.json();
        updateChartAndTable(data);
    }

    function updateChartAndTable(data) {
        let filteredData = filterDataByLocation(data);
        updateChart(filteredData);
    }

    // Function to filter data by location
    function filterDataByLocation(data) {
        let selectedLocation = document.getElementById('location').value;
        return selectedLocation === 'all' ? data : data.filter(item => item.Location === selectedLocation);
    }

    function updateChart(data) {
        // Inisialisasi variabel untuk scorecard chart
        let revenue = 0;
        let averageMonthlyGrowth = 0;
        let totalProductsSold = 0;
        let totalCustomers = 0;

        // Inisialisasi total penjualan bulanan untuk setiap lokasi
        let monthlyTotals = {};
        locations.forEach(location => {
            monthlyTotals[location] = new Array(12).fill(0);
        });

        // Inisialisasi total penjualan per kategori untuk setiap lokasi
        let categoryTotals = {};
        locations.forEach(location => {
            categoryTotals[location] = {};
            categories.forEach(category => {
                categoryTotals[location][category] = 0;
            });
        });

        // Inisialisasi variasi produk per kategori untuk setiap lokasi
        let variationCounts = {};
        locations.forEach(location => {
            variationCounts[location] = {};
            categories.forEach(category => {
                variationCounts[location][category] = new Set();
            });
        });

        // Inisialisasi AOV bulanan untuk setiap lokasi
        let aovMonthlyTotals = {};
        let aovMonthlyCounts = {};
        locations.forEach(location => {
            aovMonthlyTotals[location] = new Array(12).fill(0);
            aovMonthlyCounts[location] = new Array(12).fill(0);
        });

        // Inisialisasi total pendapatan bulanan
        let monthlyRevenues = new Array(12).fill(0);

        // Inisialisasi payment
        let payment = { "Cash": 0, "Credit": 0 };

        // Proses data
        data.forEach(entry => {
            let date = new Date(entry.TransDate);
            let month = date.getMonth(); // 0 untuk Januari, 1 untuk Februari, dll.
            if (!monthsFilter[month]) return; // Skip data if month is not selected

            let location = entry.Location;
            let total = parseFloat(entry.LineTotal);
            let category = entry.Category;
            let product = entry.Product;
            let paymentStatus = entry.Type;
            let quantity = parseInt(entry.MQty);

            monthlyRevenues[month] += total;
            revenue += total;
            totalProductsSold += quantity;
            totalCustomers += 1;

            if (locations.includes(location)) {
                monthlyTotals[location][month] += total;
                aovMonthlyTotals[location][month] += total;
                aovMonthlyCounts[location][month]++;
            }

            if (locations.includes(location) && categories.includes(category)) {
                categoryTotals[location][category] += total;
                variationCounts[location][category].add(product);
            }

            if (paymentStatus == "Cash" || paymentStatus == "Credit") {
                payment[paymentStatus]++;
            }
        });

        // Hitung rata-rata peningkatan bulanan
        averageMonthlyGrowth = calculateAverage(calculateMonthlyGrowthRate(monthlyRevenues)) * 100;

        // Menampilkan scorecard
        document.getElementById('revenue').innerHTML = "$" + revenue.toFixed(2);
        document.getElementById('avg-monthly-growth').innerHTML = averageMonthlyGrowth.toFixed(2) + "%";
        document.getElementById('total-products-sold').innerHTML = totalProductsSold;
        document.getElementById('total-customers').innerHTML = totalCustomers;

        // Siapkan datasets untuk total penjualan bulanan
        let monthlyDatasets = locations.map((location, index) => {
            return {
                label: location,
                backgroundColor: colors[index],
                borderColor: borderColors[index],
                borderWidth: 1,
                data: monthlyTotals[location]
            };
        });

        // Siapkan datasets untuk total penjualan per kategori
        let categoryDatasets = categories.map((category, index) => {
            return {
                label: category,
                backgroundColor: colors[index],
                borderColor: borderColors[index],
                borderWidth: 1,
                data: locations.map(location => categoryTotals[location][category])
            };
        });

        // Siapkan datasets untuk variasi produk per kategori
        let variationDatasets = categories.map((category, index) => {
            return {
                label: category,
                backgroundColor: colors[index],
                borderColor: borderColors[index],
                borderWidth: 1,
                data: locations.map(location => variationCounts[location][category].size)
            };
        });

        // Siapkan datasets untuk tren AOV berdasarkan lokasi
        let aovDatasets = locations.map((location, index) => {
            return {
                label: location,
                backgroundColor: colors[index],
                borderColor: borderColors[index],
                borderWidth: 2,
                data: aovMonthlyTotals[location].map((total, month) => {
                    return (total / aovMonthlyCounts[location][month]).toFixed(2);
                }),
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: colors[index],
                pointBorderColor: '#fff'
            };
        });

        // Siapkan dataset untuk total pendapatan bulanan
        let revenueDataset = {
            label: 'Total Revenue',
            data: monthlyRevenues,
            backgroundColor: 'rgba(255, 0, 0, 0.6)',
            borderColor: 'rgba(255, 0, 0, 0.6)',
            borderWidth: 2,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: 'rgba(255, 0, 0, 0.6)',
            pointBorderColor: '#fff'
        };

        // Siapkan dataset untuk pie chart payment
        var paymentLabels = Object.keys(payment);
        var paymentData = paymentLabels.map(label => payment[label]);

        const legendMargin = {
            id: 'legendMargin',
            beforeInit(chart, legend, options) {
                const fitvalue = chart.legend.fit;
                chart.legend.fit = function fit() {
                    fitvalue.bind(chart.legend)();
                    return this.height += 15;
                }
            }
        };

        // Buat grafik total penjualan bulanan
        if (monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart("monthlyChart", {
            type: "bar",
            data: {
                labels: months,
                datasets: monthlyDatasets
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value >= 1000 ? (value / 1000) + 'K' : value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Buat grafik total penjualan per kategori
        if (categoryChart) categoryChart.destroy();
        categoryChart = new Chart("categoryChart", {
            type: "bar",
            data: {
                labels: locations,
                datasets: categoryDatasets
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value >= 1000 ? (value / 1000) + 'K' : value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Buat grafik variasi produk per kategori
        if (variationChart) variationChart.destroy();
        variationChart = new Chart("variationChart", {
            type: "bar",
            data: {
                labels: locations,
                datasets: variationDatasets
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Buat grafik tren AOV berdasarkan lokasi
        if (aovChart) aovChart.destroy();
        aovChart = new Chart("aovChart", {
            type: 'line',
            data: {
                labels: months,
                datasets: aovDatasets
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Buat grafik total pendapatan bulanan
        if (revenueChart) revenueChart.destroy();
        revenueChart = new Chart("revenueChart", {
            type: "line",
            data: {
                labels: months,
                datasets: [revenueDataset]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Buat grafik pie chart untuk payment
        if (paymentChart) paymentChart.destroy();
        paymentChart = new Chart("paymentChart", {
            type: "pie",
            data: {
                labels: paymentLabels,
                datasets: [{
                    data: paymentData,
                    backgroundColor: [colors.red, colors.blue]
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                }
            },
            plugins: [legendMargin]
        });
    }

    function calculateMonthlyGrowthRate(monthlyRevenues) {
        let growthRates = [];
        for (let i = 1; i < monthlyRevenues.length; i++) {
            let growthRate = (monthlyRevenues[i] - monthlyRevenues[i - 1]) / monthlyRevenues[i - 1];
            growthRates.push(growthRate);
        }
        return growthRates;
    }

    function calculateAverage(arr) {
        let validValues = arr.filter(value => isFinite(value));
        if (validValues.length === 0) return 0; 
        let sum = validValues.reduce((acc, val) => acc + val, 0);
        return sum / validValues.length;
    }

    // Fetch data from JSON and update chart
    fetchData();

    // Attach event listener to dropdown for location filter
    document.getElementById('location').addEventListener('change', function () {
        let filteredData = filterDataByLocation(data);
        updateChart(filteredData);
    });
});
