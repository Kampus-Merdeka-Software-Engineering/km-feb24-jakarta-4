//Import JSON
datas();

async function datas() {
    let response = await fetch('./vending_machine_sales.json');
    let data = await response.json();

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

    // Inisialisasi AOV (Average Order Value) bulanan untuk setiap lokasi
    let aovMonthlyTotals = {};
    let aovMonthlyCounts = {};
    locations.forEach(location => {
        aovMonthlyTotals[location] = new Array(12).fill(0);
        aovMonthlyCounts[location] = new Array(12).fill(0);
    });

    // Inisialisasi total pendapatan bulanan
    let monthlyRevenues = new Array(12).fill(0);

    // Proses data
    data.forEach(entry => {
        let date = new Date(entry.TransDate);
        let month = date.getMonth(); // 0 untuk Januari, 1 untuk Februari, dll.
        let location = entry.Location;
        let total = parseFloat(entry.TransTotal);
        let category = entry.Category;
        let product = entry.Product;

        monthlyRevenues[month] += total;

        if (locations.includes(location)) {
            monthlyTotals[location][month] += total;
            aovMonthlyTotals[location][month] += total;
            aovMonthlyCounts[location][month]++;
        }

        if (locations.includes(location) && categories.includes(category)) {
            categoryTotals[location][category] += total;
            variationCounts[location][category].add(product);
        }
    });

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

    // Buat grafik total penjualan bulanan
    new Chart("myChart", {
        type: "bar",
        data: {
            labels: months,
            datasets: monthlyDatasets
        },
        options: {
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
        }
    });

    // Buat grafik total penjualan per kategori
    new Chart("categoryChart", {
        type: "bar",
        data: {
            labels: locations,
            datasets: categoryDatasets
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Transaction'
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
                    },
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });

    // Buat grafik variasi produk per kategori
    new Chart("variationChart", {
        type: "bar",
        data: {
            labels: locations,
            datasets: variationDatasets
        },
        options: {
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
        }
    });

    // Buat grafik tren AOV
    new Chart("aovChart", {
        type: "line",
        data: {
            labels: months,
            datasets: aovDatasets
        },
        options: {
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
        }
    });
    // Buat line chart untuk total pendapatan bulanan
    new Chart("revenueChart", {
        type: "line",
        data: {
            labels: months,
            datasets: [revenueDataset]
        },
        options: {
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
        }
    });

}

