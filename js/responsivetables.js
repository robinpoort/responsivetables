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
            var previous_window_width = $(window).width(),
                wrapper = $element.parent('.' + plugin.settings.wrapperclass),
                duplicaterow = '.' + plugin.settings.duplicateclass,
                // Create the array
                columns = [],
                prevwidth = 0,
                i = 0,
                headers = $element.find('th'),
                toggle  = headers.filter('[data-content="toggle"]'),
                toggle_index = toggle.length ? toggle[0].cellIndex : 0;

            var cells = $element.find('tr > td:nth-child('+ (toggle_index+1) +')');
            cells.prepend('<div style="display: none;" class="'+plugin.settings.togglebuttonclass+'">'+plugin.settings.togglebuttoncontent+'</div>');

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

            headers.each(function(index) {
                var $this = $(this),
                    leaveindex = $this.attr('data-toggle');

                prevwidth = $this.outerWidth() + $this.position().left;

                if ( leaveindex == undefined ) {
                    leaveindex = "99"
                }

                columns[i] = {
                    index: index+1,
                    width: $this.outerWidth(),
                    leave: '',
                    leaveindex: parseInt(leaveindex, 10),
                    left: $this.position().left,
                    sibling: 'td'+(index+1),
                    enabled: true
                };

                i++;
            });

            // Reordering the array
            columns = columns.slice(0).reverse().sort(function(a, b) {
                return a.leaveindex - b.leaveindex;
            });

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

            // The actual function
            function responsivetable() {
                // Setting vars inside function
                var window_width = $(window).width();

                var hide = [],
                    show = [];

                $.each(columns, function(index, column) {
                    var width = $element.width(),
                        wrapper_width = wrapper.outerWidth(),
                        cells = $element.find('tr > :nth-child('+ column.index +')');

                    if (column.enabled && width > wrapper_width && window_width <= previous_window_width) {
                        hide.push(column.index);

                        $element.find('.'+plugin.settings.togglebuttonclass).show();

                        cells.addClass('hidden');

                        // Set the leave value
                        column.enabled = false;
                        column.leave = $element.outerWidth();
                    }
                    else if (!column.enabled && wrapper_width >= (column.leave + column.width - 10)) {
                        show.push(column.index);

                        // Remove the visible siblings
                        $element.find('div.' + column.sibling).remove();

                        cells.removeClass('hidden');

                        column.enabled = true;
                    }

                    // Recreate the toggle area output
                    if (hide.length) {
                        var open = $element.find('tr.open');
                        open.each(function() {
                            var row = $(this);
                            row.next(duplicaterow).remove();

                            buildOutput(row);
                        });
                    }

                    // Set the colspan and hide the toggle area if possible
                    if (show.length) {
                        var boxes = $element.find('tr.'+plugin.settings.duplicateclass);
                        boxes.each(function() {
                            var $this = $(this),
                                $tr = $(this).prev('tr'),
                                colspan = $tr.find('td:visible').length;

                            if (colspan === columns.length) {
                                $element.find('.'+plugin.settings.togglebuttonclass).removeClass('open').hide();
                                $tr.removeClass('open');
                                $this.remove();
                            } else {
                                $this.attr('colSpan', colspan);
                            }
                        });
                    }
                });

                // Set the new width after iteration
                previous_window_width = window_width;
            }

            responsivetable();

            function debounce(func, wait, immediate) {
                var timeout;
                return function() {
                    var context = this, args = arguments;
                    clearTimeout(timeout);
                    timeout = setTimeout(function() {
                        timeout = null;
                        func.apply(context, args);
                    }, wait);
                };
            }

            // Run again on window resize
            $(window).on('resize', debounce(responsivetable, 200));

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