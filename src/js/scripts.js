const hostName = document.location.hostname === "localhost" ? "" : "https://cmcknight.github.io/central-supply-catalog";

// ----- Shopping Cart-related functionality -----
const cartKey = "csc-cart"; // key for localStorage shopping cart

// powers of 10 multipliers
const unitMultiplier = { Cr: 0, KCr: 3, MCr: 6, BCr: 9, TCr: 12 };

// Apply units to values
const setUnitLabel = (value) => {
  let text = "";

  if (value > 999999999999) {
    text = `${value / 10 ** 12} TCr`;
  } else if (value > 999999999) {
    text = `${value / 10 ** 9} BCr`;
  } else if (value > 999999) {
    text = `${value / 10 ** 6} MCr`;
  } else if (value > 999) {
    text = `${value / 10 ** 3} KCr`;
  } else {
    text = `${value} Cr`;
  }
  return text;
};

// ----------------- add item to cart -----------------
const addItem = () => {
  // retrieve the cart from localStorage
  let cart = localStorage.getItem(cartKey);

  // get image src attribute
  const productImage = document.getElementById("prod-img").src;

  // get the price and units
  const [price, units] = document.getElementById("unit-price").textContent.split(" ");
  const unitPrice = parseInt(price) * 10 ** unitMultiplier[units];

  // get the product name
  const productName = document.getElementById("product-name").textContent;

  // get the quantity
  const productQty = parseInt(document.getElementById("product-qty").value);

  // get the sku
  const productSku = document.getElementById("product-name").getAttribute("data-sku");

  cart = cart === null || cart === undefined ? (cart = []) : (cart = JSON.parse(cart));

  // attempt to get the item from the cart
  let cartProd = cart.find((s) => s.sku === productSku);

  if (cartProd === null || cartProd === undefined) {
    // product not in cart, add to cart
    cart.push({ sku: productSku, qty: productQty, name: productName, unitPrice: unitPrice, image: productImage });
  } else {
    // product is already in cart, update quantity
    cartProd.qty += productQty;
  }

  cart = cart.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  // save cart to localStorage
  localStorage.setItem(cartKey, JSON.stringify(cart));

  // update shopping cart badge
  updateCartBadge();

  M.toast({ html: "Item added to cart", displayLength: 8000 });
};

// ----------------- remove item from cart ----------------------
const removeItem = (sku) => {
  let cart = JSON.parse(localStorage.getItem(cartKey));
  cart = cart.filter((item) => item.sku !== sku);
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartUI();
  updateCartBadge();
};

// ---------------- modify quantity of item ----------------------
const updateItemQty = (sku, qty) => {
  let cart = JSON.parse(localStorage.getItem(cartKey));
  let item = cart.find((s) => s.sku === sku);

  if ((item === null) | (item === undefined)) {
    console.log(`Sku: ${sku} is not in cart`);
  } else {
    item.qty = (qty < 0) ? 0 : qty
  }
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartUI();
};

// -------------------- update the cart ui -------------------------
const updateCartUI = () => {
  let cart = JSON.parse(localStorage.getItem(cartKey));
  let itemContainer = document.querySelector(".cart-items-container");
  let cartTotal = document.querySelector(".cart-total");
  let text = "";
  let total = 0;

  if (cart === null || cart === undefined || cart.length === 0) {
    console.log("No items in cart");
    text = `<div class="row">
              <h5 class="center">No items in cart</h5>
            </div>`;
  } else {
    cart.forEach((item) => {
      text += `
      <div class="row product-row">
        <div class="prod-img col s3 m2 l2">
          <a href="#">
            <img src="${item.image}" class="responsive-img" alt="${item.name}">
          </a>
        </div>

        <div class="prod-details col s5 m7 l7">

          <div class="prod-title">
              <a href="{{ ../products/${item.name} | url }}" data-sku="${item.sku}" class="item-name">${item.name}</a>
          </div>

          <div class="prod-qty">
            <form>
                <button><i class="fa fa-minus subtract-btn"></i></button>
                <input type="number" class="qty" value="${item.qty}">
                <button><i class="fa fa-plus add-btn"></i></button>
                <button class="remove-item"><i class="fa fa-trash"></i></button>
            </form>
          </div>
        </div>

      <div class="prod-total col s3 m2 l2 right-align right">
        ${setUnitLabel(item.qty * item.unitPrice)}
      </div>

      </div>
      `;
      total += item.unitPrice * item.qty;
    });
  }

  if (cart.length === 0) {
    // cart is empty, no display
    cartTotal.innerHTML = "";
  } else {
    // set cart total
    cartTotal.innerHTML = `Total: ${setUnitLabel(total)}`;
  }

  itemContainer.innerHTML = text;
};

// --------- set up listener for click events on cart items --------------
const cartItemsList = document.querySelector(".cart-items-container");
if (cartItemsList !== null && cartItemsList !== undefined) {
  // event for manually changing quantity
  cartItemsList.addEventListener("change", (e) => {
    e.preventDefault;
    if (e.target.className === "qty") {
      let qtyNode = e.target.parentNode.parentNode.querySelector(".qty");
      let qty = Number(qtyNode.value);
      let sku = e.target.parentNode.parentNode.parentNode.parentNode.querySelector(".item-name").dataset.sku;
      updateItemQty(sku, qty);
    }
  });

  // event for handling button clicks
  cartItemsList.addEventListener("click", (e) => {
    e.preventDefault;

    let qtyNode = e.target.parentNode.parentNode.querySelector(".qty");
    let qty = Number(qtyNode.value);
    let sku = e.target.parentNode.parentNode.parentNode.parentNode.querySelector(".item-name").dataset.sku;

    if (e.target.className.includes("fa-minus")) {
      // update the cart
      updateItemQty(sku, qty - 1);
    } else if (e.target.className.includes("fa-plus")) {
      // update the cart
      updateItemQty(sku, qty + 1);
    } else if (e.target.className.includes("fa-trash")) {
      removeItem(sku);
    }
  });
}

// ------------------ Remove all items from cart ----------------------
const removeAllItemsBtn = document.getElementById("empty-cart");
if (removeAllItemsBtn !== null && removeAllItemsBtn !== undefined) {
  removeAllItemsBtn.addEventListener("click", () => {
    localStorage.setItem(cartKey, JSON.stringify([]));
    document.querySelector(".cart-total").textContent = "";
    updateCartUI();
    updateCartBadge();
  });
}

// ---- End of Shopping Cart-related Functionality --------

// ---------- Manage Cart Count Badge ---------------------

const updateCartBadge = () => {
  const cartCountSpan = document.getElementById("cart-badge");
  let cartCount = JSON.parse(localStorage.getItem(cartKey)).length;

  if (cartCount === 0) {
    cartCountSpan.style.display = "none";
  } else {
    cartCountSpan.textContent = cartCount;
    cartCountSpan.style.display = "block";
  }
};

// --------- initialize MaterializeCSS components ---------
document.addEventListener("DOMContentLoaded", function () {
  // sidenav
  const sideNav = document.querySelector(".sidenav");
  M.Sidenav.init(sideNav, {});

  // modal cards
  const modals = document.querySelectorAll(".modal");
  M.Modal.init(modals, {});

  // set listener on product page add button
  const addItemBtn = document.getElementById("add-to-cart");
  if (addItemBtn !== null && addItemBtn !== undefined) {
    addItemBtn.addEventListener("click", addItem);
  }

  // update the cart badge
  updateCartBadge();

  // update shopping cart ui if on shopping cart page
  if (window.location.href.includes("shopping-cart")) {
    updateCartUI();
  }
});
