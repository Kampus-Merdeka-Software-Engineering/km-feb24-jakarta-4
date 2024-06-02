document.addEventListener('DOMContentLoaded', function () {
    // Pendeklarasian variabel untuk masing masing chart
    let myChart = null;
    let variationChart = null;
    let aovChart = null;
    let revenueChart = null;
    let paymentChart = null;

    // Pendeklarsian variabel untuk data
    let data = null;

    //Pendeklarasian inisialisasi array periode date
    let monthsFilter = [true, true, true, true, true, true, true, true, true, true, true, true]

    // // Warna untuk chart
    // const chartColors = {
    //     red: "rgba(255, 0, 0, 0.6)",
    //     yellow: "rgba(255, 255, 0, 0.6)",
    //     blue: "rgba(0, 0, 255, 0.6)",
    //     green: "rgba(0, 128, 0, 0.6)",
    //     redBorder: "rgba(255, 0, 0, 1)",
    //     yellowBorder: "rgba(255, 255, 0, 1)",
    //     blueBorder: "rgba(0, 0, 255, 1)",
    //     greenBorder: "rgba(0, 128, 0, 1)"
    // };

    //Filterisasi Periode date
    function selectedMonth(idx) {
        // Toggle the selected month filter
        monthsFilter[idx] = !monthsFilter[idx]
        fetch('./vending_machine_sales.json').then(response => response.json()).then(data =>
            updateChart(data)
        )

    }

    let els = document.getElementsByClassName('monthsFilter')
    for (let i = 0; i < els.length; i++) {
        els[i].addEventListener('click', () => {
            selectedMonth(i)
        })
    }

    //

    async function fetchData() {
        let response = await fetch('./vending_machine_sales.json');
        data = await response.json();
        updateChartAndTable(data);
    }

    function updateChartAndTable(data) {
        let filteredData = filterDataByLocation(data);
        updateChart(filteredData)
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
        let locations = ["GuttenPlans", "EB Public Library", "Brunswick Sq Mall", "Earle Asphalt"];
        let monthlyTotals = {};
        locations.forEach(location => {
            monthlyTotals[location] = new Array(12).fill(0);
        });

        // Inisialisasi total penjualan per kategori untuk setiap lokasi
        let categories = ["Food", "Carbonated", "Non Carbonated", "Water"];
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
            let month = date.getMonth(); // 0 untuk     Januari, 1 untuk Februari, dll.
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
                monthlyTotals[location][month] += monthsFilter[month] ? total : null;
                aovMonthlyTotals[location][month] += monthsFilter[month] ? total : 0;
                monthsFilter[month] ? aovMonthlyCounts[location][month]++ : 0;
            }

            if (locations.includes(location) && categories.includes(category)) {
                categoryTotals[location][category] += monthsFilter[month] ? total : 0;
                monthsFilter[month] ? variationCounts[location][category].add(product) : null;
            }

            if (paymentStatus == "Cash" || paymentStatus == "Credit") {
                monthsFilter[month] ? payment[paymentStatus]++ : 0;
            }

        });

        // Hitung rata-rata peningkatan bulanan
        averageMonthlyGrowth = calculateAverage(calculateMonthlyGrowthRate(monthlyRevenues)) * 100;
        console.log(monthlyTotals, aovMonthlyTotals, aovMonthlyCounts);

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Menampilkan scorecard
        document.getElementById('revenue').innerHTML = "$" + revenue;
        document.getElementById('avg-monthly-growth').innerHTML = averageMonthlyGrowth.toFixed(2) + "%";
        document.getElementById('total-products-sold').innerHTML = totalProductsSold;
        document.getElementById('total-customers').innerHTML = totalCustomers;

        // Siapkan datasets untuk total penjualan bulanan
        let monthlyDatasets = locations.map((location, index) => {
            let colors = ["rgba(255, 0, 0, 0.6)", "rgba(255, 255, 0, 0.6)", "rgba(0, 0, 255, 0.6)", "rgba(0, 128, 0, 0.6)"];
            let borderColors = ["rgba(255, 0, 0, 1)", "rgba(255, 255, 0, 1)", "rgba(0, 0, 255, 1)", "rgba(0, 128, 0, 1)"];

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
            let colors = ["rgba(255, 0, 0, 0.6)", "rgba(255, 255, 0, 0.6)", "rgba(0, 0, 255, 0.6)", "rgba(0, 128, 0, 0.6)"];
            let borderColors = ["rgba(255, 0, 0, 1)", "rgba(255, 255, 0, 1)", "rgba(0, 0, 255, 1)", "rgba(0, 128, 0, 1)"];

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
            let colors = ["rgba(255, 0, 0, 0.6)", "rgba(255, 255, 0, 0.6)", "rgba(0, 0, 255, 0.6)", "rgba(0, 128, 0, 0.6)"];
            let borderColors = ["rgba(255, 0, 0, 1)", "rgba(255, 255, 0, 1)", "rgba(0, 0, 255, 1)", "rgba(0, 128, 0, 1)"];

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
            let color;
            switch (location) {
                case "Earle Asphalt":
                    color = "rgba(0, 128, 0, 0.6)"; // Hijau
                    break;
                case "GuttenPlans":
                    color = "rgba(255, 0, 0, 0.6)"; // Merah
                    break;
                case "EB Public Library":
                    color = "rgba(255, 255, 0, 0.6)"; // Kuning
                    break;
                case "Brunswick Sq Mall":
                    color = "rgba(0, 0, 255, 0.6)"; // Biru
                    break;
                default:
                    color = "rgba(0, 0, 0, 0.6)"; // Default hitam
            }

            return {
                label: location,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 2,
                data: aovMonthlyTotals[location].map((total, month) => {
                    return (total / aovMonthlyCounts[location][month]).toFixed(2);
                }),
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: color,
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
        // Data label untuk pie chart
        // var paymentLabels = ["Pembayaran Lunas", "Pembayaran Tertunda"];
        // // Data nilai untuk pie chart
        // var paymentData = [75, 25]; // Contoh data, ubah sesuai kebutuhan


        const legendMargin = {
            id: 'legendMargin',
            beforeInit(chart, legend, options) {
                // console.log(chart.legend.fit)
                const fitvalue = chart.legend.fit;

                chart.legend.fit = function fit() {
                    fitvalue.bind(chart.legend)();
                    return this.height += 15;
                }
            }
        };



        // Buat grafik total penjualan bulanan
        if (myChart) myChart.destroy();
        myChart = new Chart("myChart", {
            type: "bar",
            data: {
                labels: months,
                datasets: monthlyDatasets
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    x: {

                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'TransDate (Month)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Transaction'
                        },
                        grid: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            },
            plugins: [legendMargin]
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
                indexAxis: 'y',
                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Product'
                        },
                        grid: {
                            color: 'white'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Location'
                        },
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            },
            plugins: [legendMargin]
        });

        // Buat grafik tren AOV
        if (aovChart) aovChart.destroy();
        aovChart = new Chart("aovChart", {
            type: "line",
            data: {
                labels: months,
                datasets: aovDatasets
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'TransDate (Month)'
                        },
                        // grid: {
                        //     color: 'white'
                        // }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'AOV'
                        },
                        grid: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            },
            plugins: [legendMargin]
        });

        // Buat line chart untuk total pendapatan bulanan
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
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Transaction Date (Month)'
                        },
                        grid: {
                            color: 'white'
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Line Total'
                        },
                        grid: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            },
            plugins: [legendMargin]
        });

        //Buat pie chart
        if (paymentChart) paymentChart.destroy();
        paymentChart = new Chart("paymentChart", {
            type: "pie",
            data: {
                labels: paymentLabels,
                datasets: [{
                    backgroundColor: ["rgba(255, 99, 132, 0.6)", "rgba(54, 162, 235, 0.6)"],
                    data: paymentData
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                title: {
                    display: true,
                    text: "Payment Status"
                }
            },
            plugins: [legendMargin]
        });
    }

    document.getElementById('location').addEventListener('change', () => {
        updateChartAndTable(data);
        console.log(document.getElementById('location').value);
    });

    fetchData();
});

// list function tambahan
// Fungsi untuk menghitung growth rate bulanan
function calculateMonthlyGrowthRate(monthlySales) {
    const months = Object.keys(monthlySales);
    const growthRates = [];
    for (let i = 1; i < months.length; i++) {
        const previousMonth = months[i - 1];
        const currentMonth = months[i];
        const growthRate = monthlySales[i - 1] === 0 ? 0 : (monthlySales[currentMonth] - monthlySales[previousMonth]) / monthlySales[previousMonth];
        growthRates.push(growthRate);
    }
    return growthRates;
}

// Fungsi untuk menghitung rata-rata dari array
function calculateAverage(array) {
    const sum = array.reduce((acc, value) => acc + value, 0);
    return sum / array.length;
}