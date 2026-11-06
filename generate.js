const fs = require('fs');

const base = [
  { name: "Aso Oke Gown", price: 85000, sizes: [["10",2],["12",2],["14",1]] },
  { name: "Ankara Maxi Dress", price: 45000, sizes: [["10",3],["12",3],["14",2]] },
  { name: "Lace Bubu Gown", price: 60000, sizes: [["12",2],["14",2],["16",1]] },
  { name: "Two Piece Set", price: 55000, sizes: [["10",2],["12",2],["14",2]] },
  { name: "Sequin Evening Gown", price: 95000, sizes: [["10",1],["12",2],["14",1]] },
  { name: "Ankara Peplum Dress", price: 50000, sizes: [["10",2],["12",3],["14",2]] },
  { name: "Lace Corset Gown", price: 75000, sizes: [["12",2],["14",2],["16",2]] },
  { name: "Chiffon Maxi Dress", price: 48000, sizes: [["10",3],["12",3],["14",3]] },
  { name: "Velvet Gown", price: 70000, sizes: [["10",2],["12",2],["14",2]] },
  { name: "Adire Maxi Dress", price: 52000, sizes: [["10",2],["12",3],["14",2]] }
];

const colors = ["Red", "Gold", "Blue", "Green", "Pink", "Wine", "Purple", "White", "Black", "Peach"];

let dresses = [];

// FIXED: Only 10, not 1500
for (let i = 1; i <= 10; i++) {
  let b = base[i - 1];
  let color = colors[i - 1];
  dresses.push({
    id: i,
    name: b.name + " " + color,
    price: b.price,
    photo: "",
    sizes: b.sizes.map(s => ({ size: s[0], total: s[1], sold: 0 }))
  });
}

fs.writeFileSync('dresses.json', JSON.stringify({ dresses, sales: [] }, null, 2));
console.log('DONE - Created 10 dresses, IDs 1 to 10');