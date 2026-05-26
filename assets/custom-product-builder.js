

document.addEventListener('DOMContentLoaded', function () {
  // Variant selection logic
  document.querySelectorAll('.cpb-card').forEach(function(card) {
    var form = card.querySelector('[data-product-form]');
    var variantSelect = card.querySelector('[data-variant-select]');
    var priceEl = card.querySelector('[data-price]');
    var compareEl = card.querySelector('[data-compare]');
    var saleBadge = card.querySelector('.cpb-card__badge--sale');
    var addBtn = card.querySelector('[data-add-to-cart]');
    var loadingEl = card.querySelector('.cpb-card__loading');
    var successEl = card.querySelector('.cpb-card__success');
    var errorEl = card.querySelector('.cpb-card__error');
    var availabilityEl = card.querySelector('[data-availability]');

    if (variantSelect) {
      // @ts-ignore
      variantSelect.addEventListener('change', function(e) {
        // @ts-ignore
        var selected = variantSelect.options[variantSelect.selectedIndex];
        var price = selected.getAttribute('data-price');
        var compare = selected.getAttribute('data-compare');
        var onSale = selected.getAttribute('data-sale') === 'true';
        var available = selected.getAttribute('data-available') === 'true';

        // Update price
        // @ts-ignore
        if (priceEl) priceEl.textContent = Shopify.formatMoney(price);
        // Update compare-at
        if (compareEl) {
          if (compare && parseInt(compare) > parseInt(price)) {
            // @ts-ignore
            compareEl.textContent = Shopify.formatMoney(compare);
            // @ts-ignore
            compareEl.style.display = '';
          } else {
            // @ts-ignore
            compareEl.style.display = 'none';
          }
        }
        // Update sale badge
        if (saleBadge) {
          // @ts-ignore
          if (onSale) saleBadge.style.display = '';
          // @ts-ignore
          else saleBadge.style.display = 'none';
        }
        // Update add button
        // @ts-ignore
        if (addBtn) addBtn.disabled = !available;
        // Update availability
        if (availabilityEl) availabilityEl.textContent = available ? 'In stock' : 'Sold out';
      });
      // Trigger change on load
      variantSelect.dispatchEvent(new Event('change'));
    }

    // AJAX add to cart
    if (form && addBtn) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        // @ts-ignore
        if (addBtn.disabled) return;
        // @ts-ignore
        var formData = new FormData(form);
        var variantId = formData.get('id');
        var quantity = formData.get('quantity') || 1;
        // UI states
        // @ts-ignore
        addBtn.disabled = true;
        // @ts-ignore
        loadingEl.hidden = false;
        // @ts-ignore
        successEl.hidden = true;
        // @ts-ignore
        errorEl.hidden = true;
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          // @ts-ignore
          body: new URLSearchParams({
            id: variantId,
            quantity: quantity
          })
        })
        .then(function(res) {
          if (!res.ok) throw new Error('Add to cart failed');
          return res.json();
        })
        // @ts-ignore
        .then(function(data) {
          // @ts-ignore
          loadingEl.hidden = true;
          // @ts-ignore
          successEl.hidden = false;
          // @ts-ignore
          setTimeout(function() { successEl.hidden = true; }, 2000);
          // @ts-ignore
          addBtn.disabled = false;
          // Update cart count in header if possible
          updateCartCount();
        })
        .catch(function() {
          // @ts-ignore
          loadingEl.hidden = true;
          // @ts-ignore
          errorEl.hidden = false;
          // @ts-ignore
          setTimeout(function() { errorEl.hidden = true; }, 2500);
          // @ts-ignore
          addBtn.disabled = false;
        });
      });
    }
  });
});

// Format money using Shopify's formatMoney if available, fallback otherwise
if (typeof Shopify === 'undefined') {
  // @ts-ignore
  window.Shopify = {};
}
// @ts-ignore
Shopify.formatMoney = Shopify.formatMoney || function(cents) {
  cents = parseInt(cents, 10);
  if (isNaN(cents)) return '';
  return '$' + (cents / 100).toFixed(2);
};

// Update cart count in header (Dawn theme compatible)
function updateCartCount() {
  fetch('/cart.js')
    .then(function(res) { return res.json(); })
    .then(function(cart) {
      var countEls = document.querySelectorAll('[id^="cart-icon-bubble"], .cart-count-bubble, .header__icon--cart .count');
      countEls.forEach(function(el) {
        el.textContent = cart.item_count;
        // @ts-ignore
        el.style.display = cart.item_count > 0 ? '' : 'none';
      });
    });
}
