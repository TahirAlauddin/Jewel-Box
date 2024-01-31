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
 
  })(jQuery);
  
  $(document).ready(function() {
    $('input.currency').currencyInput();
  });
  
  $(document).ready(function() {
    $('input.mass').massInput();
  });



function deleteRow(args) {
  $(this).closest('tr').remove();
}
function addRow(args) {
  let row = `
  <tr class="table-row">
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td><button class="delete-row"><img src="minus.svg" alt=""></button></td>
</tr>
`
  let table = $('table.table-container');
  table.append(row)
  // Add listeners on new objects
  addEvents()
  
}

// Add Button
document.getElementById('add-row')
.addEventListener('click', () => addRow())

function addEvents () {
$('.delete-row').each(function() {
  $(this).on('click', deleteRow);
});

}

addEvents()