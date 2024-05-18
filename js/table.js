fetch("vending_machine_sales.json")
.then(function(response) {
  return response.json();
})
.then(function(sellingData) {
  if (sellingData.length === 0) {
    console.error("No data available");
    return;
  }

  // Aggregate data sale nya berdasarkan lokasi dan produk 
  const locationSalesMap = sellingData.reduce((acc, sale) => {
    const locationKey = sale.Location;
    const productKey = sale.Product;
    if (!acc[locationKey]) {
      acc[locationKey] = {};
    }
    if (!acc[locationKey][productKey]) {
      acc[locationKey][productKey] = {
        Location: sale.Location,
        Product: sale.Product,
        Category: sale.Category,
        Quantity: 0,
        TotalSales: 0
      };
    }
    acc[locationKey][productKey].Quantity += parseInt(sale.RQty || 0, 10);
    acc[locationKey][productKey].TotalSales += parseFloat(sale.RPrice || 0) * parseInt(sale.RQty || 0, 10);
    return acc;
  }, {});

  // mencari top selling per lokasi
  const topSellingPerLocation = Object.values(locationSalesMap).map(locationProducts => {
    return Object.values(locationProducts).reduce((max, product) => product.Quantity > max.Quantity ? product : max, {Quantity: 0});
  });

  // masukin data ke barisnya
  let placeholder = document.querySelector("#data-output");
  let out = topSellingPerLocation.map(product => `
    <tr>
      <td>${product.Location}</td>
      <td>${product.Product}</td>
      <td>${product.Category}</td>
      <td>${product.Quantity}</td>
      <td>${product.TotalSales.toFixed(2)}</td>
    </tr>
  `).join("");

  placeholder.innerHTML = out;
})
.catch(function(error) {
  console.error("Error fetching data: ", error);
});