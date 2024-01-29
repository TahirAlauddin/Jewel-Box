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