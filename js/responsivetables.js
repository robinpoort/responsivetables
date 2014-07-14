/* @preserve
 * Responsive tables the right way
 * Copyright 2014 Robin Poort
 * http://www.robinpoort.com
 * http://www.timble.net
 */

"use strict";

(function($) {

    $.fn.getNonColSpanIndex = function() {
        if(! $(this).is('td') && ! $(this).is('th'))
            return -1;

        var allCells = this.parent('tr').children();
        var normalIndex = allCells.index(this);
        var nonColSpanIndex = 0;

        allCells.each(
            function(i, item)
            {
                if(i == normalIndex)
                    return false;

                var colspan = $(this).attr('colspan');
                colspan = colspan ? parseInt(colspan) : 1;
                nonColSpanIndex += colspan;
            }
        );

        return nonColSpanIndex;
    };

    $.responsiveTable = function(element, options) {
        var defaults = {
                wrapper: {
                    'class': 'rttablewrapper',
                    'position': 'relative'
                },
                table: {
                    'initiatedclass': 'rttable--initiated',
                    'activetoggleclass': 'rttable--active_toggle'
                },
                toggle_box: {
                    'class': 'rttoggle_box'
                },
                toggle: {
                    'element': '',
                    'class': 'rttoggler',
                    'openclass': 'rtopen',
                    'text': '&raquo;'
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

                if ( title != '' ) {
                    output[index] = '<div class="'+klass+'"><strong>'+title+'</strong><br />'+content+'</div>';
                } else {
                    output[index] = '<div class="'+klass+'">'+content+'</div>';
                }
            });

            html = '<tr class="'+plugin.settings.toggle_box['class']+'"><td colspan="'+colspan+'">'+output.join('')+'</td></tr>';

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
            plugin.settings = $.extend(true, {}, defaults, options);

            // Wrap the table in a div initially and setting necessary table styles
            $element.addClass(plugin.settings.table['initiatedclass']).wrap('<div class="' + plugin.settings.wrapper['class'] + '" style="overflow:hidden;"></div>').css({'position': plugin.settings.wrapper.position, 'width': '100%'});

            // Setting vars
            var previous_window_width = $(window).width(),
                wrapper = $element.parent('.' + plugin.settings.wrapper['class']),
                headers = $element.find('th'),
                toggle_box = '.' + plugin.settings.toggle_box['class'],
                buildOutput = function(row) {
                    return plugin.buildOutput(row, headers);
                },
                toggles_added = false,
                showToggles = function() {
                    if (toggles_added === false) {
                        var toggle  = headers.filter('[data-has-toggle]'),
                            toggle_index = toggle.length ? toggle[0].cellIndex : 0,
                            cells = $element.find('tr > td:nth-child('+ (toggle_index+1) +') '+plugin.settings.toggle['element']);

                        cells.prepend('<div class="'+plugin.settings.toggle['class']+'">'+plugin.settings.toggle.text+'</div>');

                        toggles_added = true;
                    }

                    $element.find('.'+plugin.settings.toggle['class']).show();
                },
                hideToggles = function() {
                    $element.find('.'+plugin.settings.toggle['class']).removeClass(plugin.settings.toggle['openclass']).hide();
                },
                donttoggle = $('[data-has-toggle], [data-dont-toggle]').length,
                columns = [];

            headers.each(function(index) {
                var $this = $(this),
                    order = $this.is('[data-has-toggle], [data-dont-toggle]') ? '1000' : $this.attr('data-toggle-order');

                if (order == undefined) {
                    order = '999';
                }

                columns.push({
                    index: index+1,
                    width: $this.outerWidth(),
                    leave: '',
                    order: parseInt(order, 10),
                    left: $this.position().left,
                    sibling: 'td'+(index+1),
                    enabled: true
                });
            });

            // Reordering the array
            columns = columns.slice(0).reverse().sort(function(a, b) {
                return a.order - b.order;
            });










            function colspanner() {
                var colspancells = [];

                $('td[colspan]').each(function() {
                    colspancells.push(this);
                });

                $.each(colspancells, function(index) {
                    var colspanamount = parseInt($(this).attr('colSpan'));
                    var allcells = headers.filter(':visible').length;
                    var tdindex = $(this).index();
                    var diffrence = (tdindex+colspanamount)-allcells;

                    //console.log(tdindex, colspanamount, allcells, diffrence);

                    if ( diffrence >= 1 ) {
                        $(this).attr('colSpan', colspanamount-diffrence);
                    }

                });
            }
















            // Toggle area on mouse click
            $element.on('click', '.'+plugin.settings.toggle['class'], function(event) {
                var $this = $(event.target),
                    parent = $this.parents('tr');

                if (parent.hasClass(plugin.settings.toggle['openclass'])) {
                    parent.removeClass(plugin.settings.toggle['openclass'])
                        .next(toggle_box).remove();

                    $this.removeClass(plugin.settings.toggle['openclass']);

                } else {
                    buildOutput(parent);

                    parent.addClass(plugin.settings.toggle['openclass']);
                    $this.addClass(plugin.settings.toggle['openclass']);
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

                    if (column.enabled && width > wrapper_width && window_width <= previous_window_width && column.order != 1000 ) {
                        hide.push(column.index);

                        cells.hide();

                        // Set the leave value
                        column.enabled = false;
                        column.leave = $element.outerWidth();

                    }
                    else if (!column.enabled && wrapper_width >= (column.leave + column.width - 10)) {
                        show.push(column.index);

                        // Remove the visible siblings
                        $element.find('div.' + column.sibling).remove();

                        cells.show();

                        column.enabled = true;
                    }
                });

                // Setting vars after removing columns
                var visibleheaders = headers.filter(':visible').length;

                // Set wrapper to overflow
                if (visibleheaders==donttoggle) {
                    wrapper.css('overflow', 'auto');
                }

                // Recreate the toggle area output
                if (hide.length) {
                    showToggles();

                    var open = $element.find('tr.'+plugin.settings.toggle['openclass']);
                    open.each(function() {
                        var row = $(this);
                        row.find('.'+plugin.settings.toggle['class']).addClass(plugin.settings.toggle['openclass']);
                        row.next(toggle_box).remove();

                        buildOutput(row);
                    });

                    $element.addClass(plugin.settings.table['activetoggleclass']);
                }

                // Set the colspan and hide the toggle area if possible
                if (show.length) {
                    var boxes = $element.find('tr'+toggle_box),
                        colspan = headers.filter(':visible').length;

                    if (colspan === columns.length) {
                        hideToggles();
                        $element.children('tr').removeClass(plugin.settings.toggle['openclass']);
                        boxes.remove();
                        $element.removeClass(plugin.settings.table['activetoggleclass']);
                    } else {
                        boxes.children('td').attr('colSpan', colspan);
                    }
                }

                // Set the new width after iteration
                previous_window_width = window_width;
            }

            toggleCells();
            colspanner();

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