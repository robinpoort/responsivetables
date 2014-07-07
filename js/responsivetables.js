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
                wrapper: {
                    'class': 'tablewrapper',
                    'position': 'relative'
                },
                toggle_box: 'toggle_box',
                toggle: {
                    'class': 'arrow',
                    text:  '&raquo;'
                }
            },
            plugin = this,
            $element = $(element);

        plugin.settings = {};

        plugin.buildOutput = function(row, headers) {
            var output  = [],
                colspan = row.find('td:visible').length,
                html;

            row.find('td:hidden').each(function() {
                var $this = $(this),
                    content = $this.html(), // Copy all html
                    index   = $this.index(),
                    title   = headers.eq(index).text(), // Only copy the text (so no sorting arrows etc.)
                    klass   = 'td'+(index+1);

                output[index] = '<div class="'+klass+'"><strong>'+title+'</strong><br />'+content+'</div>';
            });

            html = '<tr class="'+plugin.settings.toggle_box+'"><td colspan="'+colspan+'">'+output.join('')+'</td></tr>';

            row.after(html);
        };

        plugin.debounce = function(func, wait) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    timeout = null;
                    func.apply(context, args);
                }, wait);
            };
        };

        plugin.init = function() {
            plugin.settings = $.extend({}, defaults, options);

            // Wrap the table in a div initially
            $element.wrap('<div class="' + plugin.settings.wrapper['class'] + '"></div>').css('position', plugin.settings.wrapper.position);

            // Setting vars
            var previous_window_width = $(window).width(),
                wrapper = $element.parent('.' + plugin.settings.wrapper['class']),
                headers = $element.find('th'),
                toggle  = headers.filter('[data-content="toggle"]'),
                toggle_index = toggle.length ? toggle[0].cellIndex : 0,
                toggle_box = '.' + plugin.settings.toggle_box,
                cells = $element.find('tr > td:nth-child('+ (toggle_index+1) +')'),
                i = 0,
                columns = [],
                buildOutput = function(row) {
                    return plugin.buildOutput(row, headers);
                };

            headers.each(function(index) {
                var $this = $(this),
                    leaveindex = $this.attr('data-toggle');

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

            cells.prepend('<div style="display: none;" class="'+plugin.settings.toggle['class']+'">'+plugin.settings.toggle.text+'</div>');

            // Toggle area on mouse click
            $element.on('click', '.'+plugin.settings.toggle['class'], function(event) {
                var $this = $(event.target),
                    parent = $this.parents('tr');

                if (parent.hasClass('open')) {
                    parent.removeClass('open')
                        .next(toggle_box).remove();

                    $this.removeClass('open');

                } else {
                    buildOutput(parent);

                    parent.addClass('open');
                    $this.addClass('open');
                }
            });

            // The actual function
            function toggleCells() {
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

                        $element.find('.'+plugin.settings.toggle['class']).show();

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
                });

                // Recreate the toggle area output
                if (hide.length) {
                    var open = $element.find('tr.open');
                    open.each(function() {
                        var row = $(this);
                        row.next(toggle_box).remove();

                        buildOutput(row);
                    });
                }

                // Set the colspan and hide the toggle area if possible
                if (show.length) {
                    var boxes = $element.find('tr'+toggle_box),
                        colspan = headers.filter(':visible').length;

                    if (colspan === columns.length) {
                        $element.find('.'+plugin.settings.toggle['class']).removeClass('open').hide();
                        $element.children('tr').removeClass('open');
                        boxes.remove();
                    } else {
                        boxes.children('td').attr('colSpan', colspan);
                    }
                }

                // Set the new width after iteration
                previous_window_width = window_width;
            }

            toggleCells();

            // Run again on window resize
            $(window).on('resize', plugin.debounce(toggleCells, 200));

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