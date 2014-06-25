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
            plugin = this;

        plugin.settings = {}

        var $element = $(element),
            element = element;

        plugin.init = function() {

            plugin.settings = $.extend({}, defaults, options);


            // Wrap the table in a div initially
            $element.wrap('<div class="' + plugin.settings.wrapperclass + '"></div>').css('position', plugin.settings.wrapperposition);


            // Setting vars
            var previouswindowwidth = $(window).width(),
                wrapper = $element.parent('.' + plugin.settings.wrapperclass),
                duplicaterow = '.' + plugin.settings.duplicateclass,
                nextitem = '';


            // Check if data-content="toggle" is set
            var toggleset = $element.find('tr > th[data-content="toggle"]').length;


            // Create the array
            var columns = [],
                prevwidth = 0,
                i = 0;
            $element.find('th').each(function() {
                prevwidth = $(this).outerWidth() + $(this).position().left;
                var index = $element.find($(this)).index();
                var leaveindex = $element.find($(this)).attr('data-toggle');
                if ( leaveindex == undefined ) { leaveindex = "99" }
                columns[i] = {
                    index: i+1,
                    name: ':nth-child('+(index+1)+')',
                    width: $(this).outerWidth(),
                    leave: '',
                    leaveindex: parseInt(leaveindex),
                    left: $(this).position().left,
                    sibling: 'td'+(index+1)
                };
                i++;
            });


            // Reordering the array
            var columns = columns.slice(0).reverse().sort(function(a, b) {
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
                    var elem = $element.find('tr>' + columns[index].name);

                    // Loop through each elem separately
                    $(elem).each(function() {

                        if ( $element.width() > wrapperwidth && currentwindowwidth <= previouswindowwidth ) {

                            // Check if item is already hidden or not
                            if ( !$(this).hasClass('hidden') ) {

                                // Loop through each item separately again to make sure all td's are hidden before the window resizes
                                $(elem).each(function() {

                                    // Set the toggle button to the right td
                                    if ( toggleset == 1 ) {
                                        var toggleheader = $element.find('tr > th[data-content="toggle"]').index() + 1;
                                    } else {
                                        var toggleheader = 1; // Just the first column
                                    }

                                    var toggleelements = $element.find('td:nth-child('+toggleheader+')');

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
                                $element.find('tr>:nth-child('+columns[index].index+')').addClass('hidden');

                                // Set the leave value
                                columns[index].leave = $element.outerWidth();

                            }

                        } else if ( wrapperwidth >= (columns[index].leave + columns[index].width - 10 ) ) {


                            // Only check hidden elements
                            if ( $(elem).hasClass('hidden') ) {

                                // Hiding the siblings when toggle is open
                                var parent = $(this).parent('tr'),
                                    cloned = parent.next(duplicaterow);

                                // Remove the hidden class and visible siblings
                                $(this).removeClass('hidden');
                                $element.find('.' + plugin.settings.duplicateclass + ' div.' + columns[index].sibling).remove();

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

                    nextitem = columns[index].name;
                    elementindex++;

                });

                // Set the new width after iteration
                previouswindowwidth = currentwindowwidth;


                // Toggle area on mouse click
                $('.'+plugin.settings.togglebuttonclass).each(function() {
                    $(this).unbind().on('click', function() {

                        // Setting variables
                        var parent = $(this).parent('td').parent('tr');

                        // If the area is open
                        if ( parent.hasClass('open') ) {
                            parent.next(duplicaterow).remove();
                            parent.removeClass('open');
                            $(this).removeClass('open');

                        } else { // If the area is closed

                            // Create the toggle area
                            parent.after('<tr class="'+plugin.settings.duplicateclass+'"><td></td></tr>');
                            var cloned = parent.next(duplicaterow);

                            // Find hidden td's
                            parent.find('td:hidden').each(function() {
                                var thistd = $(this);
                                addcontent(thistd, cloned, parent);
                            });

                            // Add the open class
                            parent.addClass('open');
                            $(this).addClass('open');
                        }
                    });
                });
            }


            // The function for copying the content from the hidden td's to the toggle area. And put them in the right order
            function addcontent(thistd, cloned, parent) {

                // Content variables
                var tdcontent = thistd.html(), // Copy all html
                    thtitle = thistd.closest('table').find('th').eq(thistd.index()).text(), // Only copy the text (so no sorting arrows etc.)
                    number = thistd.index() + 1;

                if ( ! cloned.find('td'+number).length ) {

                    // Copy the first item into the toggle area
                    if ( ! cloned.find('td').hasClass('added') ) {
                        // The content to add
                        cloned.find('td').addClass('added').append('<div class="td'+number+'"><strong>'+thtitle+'</strong><br />'+tdcontent+'</div>');

                    } else { // Check where to place the content of the current td in order

                        var target = 0;

                        // Get all cloned item index numbers
                        cloned.find('[class*=td]').each(function() {
                            target = $(this).attr('class').replace('td', '');
                        });

                        // If current number is higher place after() and else place before()
                        if ( number > target ) {
                            cloned.find('td').find('div[class*='+target+']').after('<div class="td'+number+'"><strong>'+thtitle+'</strong><br />'+tdcontent+'</div>');
                        } else if ( number < target ) {
                            cloned.find('td').find('div[class*='+target+']').before('<div class="td'+number+'"><strong>'+thtitle+'</strong><br />'+tdcontent+'</div>');
                        }

                    }
                }

                // Setting the colspan
                var colspan = parent.find('td:visible').length;
                cloned.find('td').attr('colSpan', colspan);

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
            $(window).on('resize', debouncer(function(event) {
                // Get the window width or get the body width as a fallback
                var width = event.target.innerWidth || $('body').width();
                // Functions
                responsivetable();
            }));

        }

        plugin.init();

    }


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