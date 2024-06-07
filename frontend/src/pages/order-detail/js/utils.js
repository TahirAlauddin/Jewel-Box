// Function to get the date 7 days after today in 'YYYY-MM-DD' format
function getDateAfterSevenDays() {
    const today = new Date();
    today.setDate(today.getDate() + 7); // Add 7 days
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function addEvents () {
    document.querySelectorAll('.delete-row').each(function() {
        this.on('click', deleteRow);
    });   
}

// Function to apply paste event listeners
function applyPasteEventListeners() {
    document.querySelectorAll('td[contenteditable="true"]').forEach(td => {
        td.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertHTML', false, text);
        });
    });
}

function deleteRow(args) {
    this.closest('tr').remove();
}
   

(function($) {
    $.fn.currencyInput = function() {
      this.each(function() {
        var wrapper = $("<div class='currency-input' />");
        $(this).wrap(wrapper);
        $(this).before("<span class='currency-symbol'>$</span>");
        $(this).change(function() {
          var min = parseFloat($(this).attr("min"));
          var max = parseFloat($(this).attr("max"));
          var value = this.valueAsNumber;
          if(value < min)
            value = min;
          else if(value > max)
            value = max;
          $(this).val(value.toFixed(2)); 
        });
      });
    };

    $.fn.notCurrencyInput = function() {
      this.each(function() {
        var wrapper = $("<div class='currency-input' />");
        $(this).wrap(wrapper);
        $(this).before("<span></span>");
        $(this).change(function() {
          var min = parseFloat($(this).attr("min"));
          var max = parseFloat($(this).attr("max"));
          var value = this.valueAsNumber;
          if(value < min)
            value = min;
          else if(value > max)
            value = max;
          $(this).val(value.toFixed(2)); 
        });
      });
    };

    $.fn.massInput = function() {
      this.each(function() {
        var wrapper = $("<div class='mass-input' />");
        $(this).wrap(wrapper);
        $(this).before("<span class='mass-symbol'>Ct</span>");
        $(this).change(function() {
          var min = parseFloat($(this).attr("min"));
          var max = parseFloat($(this).attr("max"));
          var value = this.valueAsNumber;
          if(value < min)
            value = min;
          else if(value > max)
            value = max;
          $(this).val(value.toFixed(2)); 
        });
      });
    };


    $.fn.percentageInput = function() {
      this.each(function() {
          var wrapper = $("<div class='percent-input' />");
          $(this).wrap(wrapper);
          $(this).before("<span class='percent-symbol'>%</span>");
          $(this).change(function() {
              var min = parseFloat($(this).attr("min"));
              var max = parseFloat($(this).attr("max"));
              var value = this.valueAsNumber;
              if (value < min) value = min;
              else if (value > max) value = max;
              $(this).val(value.toFixed(2));
          });
      });
  };
 
})(jQuery);

// Operations 
function addEvents () {
  $('.delete-row').each(function() {
    $(this).on('click', deleteRow);
  });   
}

function deleteRow(args) {
  $(this).closest('tr').remove();
}

function addRow(args) {
  let row = `
  <tr class="table-row">
  <td style="display: none;" id="new" ></td>
  <td contenteditable=true class="table-column"></td>
  <td contenteditable=true class="table-column"></td>
  <td contenteditable=true class="table-column"></td>
  <td contenteditable=true class="table-column"></td>
  <td contenteditable=true class="table-column"></td>
  <td contenteditable=true class="table-column"></td>
  <td contenteditable=true class="table-column"></td>
  <td contenteditable=true class="table-column"></td>
  <td><button class="delete-row"><img src="svg/minus.svg" alt=""></button></td>
  </tr>
  `;
  
  // Function to apply paste event listeners
  function applyPasteEventListeners() {
    document.querySelectorAll('td[contenteditable="true"]').forEach(td => {
      td.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertHTML', false, text);
      });
    });
  }
  
  
  let table = $('table.table-container');
  table.append(row)
  // Initial call to bind event listeners to existing editable cells
  applyPasteEventListeners();
  
  // Add listeners on new objects
  addEvents()
}


document.getElementById('sale-price-input').addEventListener('input', function () {
  updateRevenuePercent();
});

document.getElementById('revenue-percent-input').addEventListener('input', function () {
  updateSalePrice();
});

function updateRevenuePercent() {
  const totalCost = parseFloat(document.getElementById('total-cost-input').value);
  const salePrice = parseFloat(document.getElementById('sale-price-input').value);
  if (!isNaN(totalCost) && !isNaN(salePrice) && totalCost !== 0) {
      const revenuePercent = ((salePrice - totalCost) / totalCost) * 100;
      document.getElementById('revenue-percent-input').value = revenuePercent.toFixed(2);
  }
}

function updateSalePrice() {
  const totalCost = parseFloat(document.getElementById('total-cost-input').value);
  const revenuePercent = parseFloat(document.getElementById('revenue-percent-input').value);
  if (!isNaN(totalCost) && !isNaN(revenuePercent)) {
      const salePrice = totalCost + (totalCost * (revenuePercent / 100));
      document.getElementById('sale-price-input').value = salePrice.toFixed(2);
  }
}