/* @preserve
 * Responsive tables the right way
 * Copyright 2014 Robin Poort
 * http://www.robinpoort.com
 * http://www.timble.net
 */

"use strict";

(function($) {

    $.responsiveTable = function(element, options) {

        var defaults = {
                wrapperclass: 'tablewrapper',
                wrapperposition: 'relative',
                duplicateclass: 'duplicaterow',
                togglebuttonclass: 'arrow',
                togglebuttoncontent: '&raquo;'
            },
            plugin = this,
            $element = $(element);

        plugin.settings = {};

        plugin.init = function() {

            plugin.settings = $.extend({}, defaults, options);


            // Wrap the table in a div initially
            $element.wrap('<div class="' + plugin.settings.wrapperclass + '"></div>').css('position', plugin.settings.wrapperposition);


            // Setting vars
            var previouswindowwidth = $(window).width(),
                wrapper = $element.parent('.' + plugin.settings.wrapperclass),
                duplicaterow = '.' + plugin.settings.duplicateclass,
                nextitem = '',
                // Check if data-content="toggle" is set
                toggleset = $element.find('tr > th[data-content="toggle"]').length,
                // Create the array
                columns = [],
                prevwidth = 0,
                i = 0;

            $element.find('th').each(function() {
                var $this = $(this),
                    index = $element.find($this).index(),
                    leaveindex = $element.find($this).attr('data-toggle');

                prevwidth = $this.outerWidth() + $this.position().left;

                if ( leaveindex == undefined ) {
                    leaveindex = "99"
                }

                columns[i] = {
                    index: i+1,
                    name: ':nth-child('+(index+1)+')',
                    width: $this.outerWidth(),
                    leave: '',
                    leaveindex: parseInt(leaveindex, 10),
                    left: $this.position().left,
                    sibling: 'td'+(index+1)
                };

                i++;
            });


            // Reordering the array
            columns = columns.slice(0).reverse().sort(function(a, b) {
                return a.leaveindex - b.leaveindex;
            });


            // The actual function
            function responsivetable() {

                // Setting vars inside function
                var wrapperwidth = wrapper.outerWidth(),
                    currentwindowwidth = $(window).width(),
                    elementindex = 0;


                // Iterate through each item
                $.each(columns, function(index, object) {

                    // Setting vars
                    var elem = $element.find('tr>' + object.name);

                    // Loop through each elem separately
                    $(elem).each(function() {

                        if ( $element.width() > wrapperwidth && currentwindowwidth <= previouswindowwidth ) {

                            // Check if item is already hidden or not
                            if ( !$(this).hasClass('hidden') ) {

                                // Loop through each item separately again to make sure all td's are hidden before the window resizes
                                $(elem).each(function() {
                                    var toggleheader, toggleelements;

                                    // Set the toggle button to the right td
                                    if ( toggleset == 1 ) {
                                        toggleheader = $element.find('tr > th[data-content="toggle"]').index() + 1;
                                    } else {
                                        toggleheader = 1; // Just the first column
                                    }

                                    toggleelements = $element.find('td:nth-child('+toggleheader+')');

                                    if ( !$element.find(toggleelements).find('.'+plugin.settings.togglebuttonclass).length ) {
                                        $element.find(toggleelements).prepend('<div class="'+plugin.settings.togglebuttonclass+'">'+plugin.settings.togglebuttoncontent+'</div>');
                                    }

                                    // Showing the siblings when toggle is open
                                    var parent = $(this).parent('tr'),
                                        cloned = parent.next(duplicaterow);

                                    // Check if the toggle is opened and add content to toggle area
                                    if ( cloned.length ) {
                                        var thistd = $(this);
                                        addcontent(thistd, cloned, parent);
                                    }
                                });

                                // Hide the element
                                $element.find('tr>:nth-child('+object.index+')').addClass('hidden');

                                // Set the leave value
                                object.leave = $element.outerWidth();

                            }

                        } else if ( wrapperwidth >= (object.leave + object.width - 10 ) ) {


                            // Only check hidden elements
                            if ( $(elem).hasClass('hidden') ) {

                                // Hiding the siblings when toggle is open
                                var parent = $(this).parent('tr');

                                // Remove the hidden class and visible siblings
                                $(this).removeClass('hidden');
                                $element.find('.' + plugin.settings.duplicateclass + ' div.' + object.sibling).remove();

                                // Fixing the colspan
                                var colspan = $(this).parents('tr').find('td:visible').length;
                                $(this).parents('tr').next(duplicaterow).find('td').attr('colSpan', colspan);

                                // If it's the last element remove the arrow and the toggle area
                                if ( elementindex == 0 ) {
                                    $element.find($('.'+plugin.settings.togglebuttonclass)).remove();
                                    parent.removeClass('open');
                                    $element.find($(duplicaterow)).remove();
                                }
                            }
                        }

                    });

                    nextitem = object.name;
                    elementindex++;

                });

                // Set the new width after iteration
                previouswindowwidth = currentwindowwidth;

                var headers = $element.find('th');
                var buildOutput = function(parent) {
                    var output  = [],
                        colspan = parent.find('td:visible').length,
                        html;

                    parent.find('td:hidden').each(function() {
                        var $this = $(this),
                            content = $this.html(), // Copy all html
                            index   = $this.index(),
                            title   = headers.eq(index).text(), // Only copy the text (so no sorting arrows etc.)
                            klass   = 'td'+(index+1);

                        output[index] = '<div class="'+klass+'"><strong>'+title+'</strong><br />'+content+'</div>';

                        colspan++;
                    });

                    html = '<tr class="'+plugin.settings.duplicateclass+'"><td colspan="'+colspan+'">'+output.join('')+'</td></tr>';

                    parent.after(html);
                };

                // Toggle area on mouse click
                $element.on('click', '.'+plugin.settings.togglebuttonclass, function(event) {
                    var $this = $(event.target),
                        parent = $this.parents('tr');

                    if (parent.hasClass('open')) {
                        parent.removeClass('open')
                              .next(duplicaterow).remove();

                        $this.removeClass('open');

                    } else {
                        buildOutput(parent);

                        parent.addClass('open');
                        $this.addClass('open');
                    }
                });
            }


            responsivetable();


            var debouncer = function(func, timeout) {
                var id = null;
                timeout = timeout || 100;
                return function() {
                    var self = this, args = arguments;
                    clearTimeout(id);
                    id = setTimeout(function() {
                        func.apply(self, Array.prototype.slice.call(args));
                    }, timeout);
                };
            };

            // Run again on window resize
            $(window).on('resize', debouncer(function() {
                responsivetable();
            }));

        };

        plugin.init();

    };


    // add the plugin to the jQuery.fn object
    $.fn.responsiveTable = function(options) {
        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function() {
            // if plugin has not already been attached to the element
            if (undefined == $(this).data('responsiveTable')) {
                // create a new instance of the plugin
                var plugin = new $.responsiveTable(this, options);
                // in the jQuery version of the element
                // store a reference to the plugin object
                $(this).data('responsiveTable', plugin);
            }
        });
    }

})(jQuery);