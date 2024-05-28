// Function to fetch data from JSON file
async function getData() {
  const response = await fetch('./vending_machine_sales.json');
  const data = await response.json();
  return data;
}

// Function to calculate total sales
function calculateTotalSales(sales) {
  return parseFloat(sales.RPrice || 0) * parseInt(sales.RQty || 0, 10);
}

// Function to get top 5 products by location
function getTop5ProductsByLocation(salesData) {
  let topSalesByLocation = {};

  salesData.forEach(function (sale) {
    if (!topSalesByLocation[sale.Location]) {
      topSalesByLocation[sale.Location] = {};
    }
    if (!topSalesByLocation[sale.Location][sale.Product]) {
      topSalesByLocation[sale.Location][sale.Product] = {
        'Category': sale.Category,
        'Quantity': 0,
        'TotalSales': 0
      };
    }
    topSalesByLocation[sale.Location][sale.Product].Quantity += parseInt(sale.RQty || 0, 10);
    topSalesByLocation[sale.Location][sale.Product].TotalSales += calculateTotalSales(sale);
  });

  let top5SalesByLocation = {};

  for (const [location, products] of Object.entries(topSalesByLocation)) {
    let sortedProducts = Object.entries(products).sort((a, b) => b[1].TotalSales - a[1].TotalSales).slice(0, 5);
    top5SalesByLocation[location] = sortedProducts.map(([product, info]) => ({
      'Location': location,
      'Product': product,
      'Category': info.Category,
      'Quantity': info.Quantity,
      'TotalSales': info.TotalSales.toFixed(2)
    }));
  }

  return top5SalesByLocation;
}

// Function to create the table
async function createTable() {
  let data = await getData();
  let top5SalesByLocation = getTop5ProductsByLocation(data);
  let tableData = [];

  let locations = Object.keys(top5SalesByLocation);
  locations.forEach(location => {
    top5SalesByLocation[location].forEach(productData => {
      tableData.push([
        productData.Location,
        productData.Product,
        productData.Category,
        productData.Quantity,
        productData.TotalSales
      ]);
    });
  });

  // Populate location filter
  let locationFilter = $('#locationFilter');
  locationFilter.append(new Option("All", "All")); // Add option to show all locations
  locations.forEach(location => {
    locationFilter.append(new Option(location, location));
  });

  // Initialize DataTable
  let table = $('#table').DataTable({
    data: tableData,
    columns: [
      { title: "Location" },
      { title: "Product" },
      { title: "Category" },
      { title: "Quantity" },
      { title: "Total Sales" }
    ],
    lengthMenu: [5, 10, 25, 50], // Pagination options
    pageLength: 5 // Default pagination limit
  });

  // Filter functionality
  locationFilter.on('change', function () {
    let selectedLocation = $(this).val();
    if (selectedLocation === "All") {
      table.column(0).search('').draw();
    } else {
      table.column(0).search('^' + selectedLocation + '$', true, false).draw();
    }
  });
}

// Initialize the table on document ready
$(document).ready(function () {
  createTable();
});
