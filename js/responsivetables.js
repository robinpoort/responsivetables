/* @preserve
 * Responsive tables the right way
 * Copyright 2014 Robin Poort
 * http://www.robinpoort.com
 * http://www.timble.net
 */

"use strict";

(function($) {

    var getNonColspanIndex = function(element) {
        var index = -1;

        if(element.is('td') || element.is('th')) {
            index = 0;
            var cells = element.parent('tr').children(),//siblings(),
                self_index = cells.index(element);

            cells.each(function(i) {
                if (i == self_index) {
                    return false;
                }

                index += parseInt($(this).attr('colspan') || 1);
            });
        }

        return index;
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
                    'selector': '',
                    'element': 'button',
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
                colspan = headers.filter(':visible').length,
                html;

            row.find('td:hidden').each(function() {
                var $this = $(this),
                    content = $this.html(), // Copy all html
                    index   = $this.index(),
                    title   = headers.eq(index).text(), // Only copy the text (so no sorting arrows etc.)
                    klass   = 'td'+(index+1);

                if ( title != '' && content != '' ) {
                    output[index] = '<div class="'+klass+'"><strong>'+title+'</strong><br />'+content+'</div>';
                } else if ( content != '' ) {
                    output[index] = '<div class="'+klass+'">'+content+'</div>';
                } else {
                    output[index] = '';
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
                            cells = $element.find('tr > td:nth-child('+ (toggle_index+1) +')').siblings(':hidden'),
                            togglecells = cells.siblings(':nth-child('+ (toggle_index+1) +')'),
                            attributes = '';

                        if ( plugin.settings.toggle['selector'] != '' ) {
                            togglecells = cells.siblings(':nth-child('+ (toggle_index+1) +')').find(plugin.settings.toggle['selector']);
                        }

                        if (plugin.settings.toggle['element'] == 'button') {
                            attributes = ' aria-hidden="true" aria-pressed="false"';
                        }

                        togglecells.prepend('<'+plugin.settings.toggle['element']+' class="'+plugin.settings.toggle['class']+'"'+attributes+'>'+plugin.settings.toggle.text+'</'+plugin.settings.toggle['element']+'>');

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

            // Toggle area on mouse click
            $element.on('click', '.'+plugin.settings.toggle['class'], function(event) {
                var $this = $(event.target),
                    parent = $this.parents('tr');

                if (parent.hasClass(plugin.settings.toggle['openclass'])) {
                    parent.removeClass(plugin.settings.toggle['openclass'])
                        .next(toggle_box).remove();

                    $this.removeClass(plugin.settings.toggle['openclass']);

                } else if ( parent.children('td:hidden').length ) {
                    buildOutput(parent);

                    parent.addClass(plugin.settings.toggle['openclass']);
                    $this.addClass(plugin.settings.toggle['openclass']);
                }
            });

            // Adding data attributes to cells within rows that have colspan cells
            $element.find('tr:has([colspan]) td').each(function() {
                var $this = $(this),
                    colspan = $this.attr('colSpan'),
                    true_colspan = getNonColspanIndex($this) + 1;

                // Set index data attribute
                $this.attr('data-index', true_colspan);

                // Set last span if applicable
                if (colspan) {
                    var range = [];
                    for( var i = 0; i < colspan; i++ ) {
                        range.push(i + parseInt(true_colspan));
                    }
                    $this.attr('data-index-range', range);
                }
            });

            // The actual function
            function toggleCells() {
                // Setting vars inside function
                var window_width = $(window).width();

                var hide = [],
                    show = [];

                $.each(columns, function(index, column) {

                    var indexno = $('.indexno');

                    var width = $element.width(),
                        wrapper_width = wrapper.outerWidth(),
                        cells = $element.find('tr:not(:has([colspan])) > :nth-child('+ column.index +')'),
                        singlecells = $element.find('tr > td[data-index="'+column.index+'"]:not([colspan]), tr > td[data-index-range*="'+column.index+'"][colspan=1], tr > td[data-index-range*="'+column.index+'"][colspan=0]'),
                        affectedcells = $element.find('tr > td[data-index-range]');

                    // Rebuild cells
                    cells = cells.add(singlecells);

                    if (column.enabled && width > wrapper_width && window_width <= previous_window_width && column.order != 1000 ) {
                        hide.push(column.index);

                        cells.hide();

                        indexno.text(column.index);

                        // Re-set colspan on colspan cells
                        affectedcells.each(function() {
                            if ( $(this).attr('data-index-range').indexOf(column.index) >= 0) {
                                var colspan = parseInt($(this).attr('colSpan'));
                                if ( colspan >= 1) {
                                    $(this).attr('colSpan', colspan - 1);
                                }
                            }
                        });

                        // Set the leave value
                        column.enabled = false;
                        column.leave = $element.outerWidth();

                    }
                    else if (!column.enabled && wrapper_width >= (column.leave + column.width - 10)) {
                        show.push(column.index);

                        // Remove the visible siblings
                        $element.find('div.' + column.sibling).remove();

                        // Re-set colspan on colspan cells
                        affectedcells.each(function() {
                            if ( $(this).attr('data-index-range').indexOf(column.index) >= 0) {
                                var colspan = parseInt($(this).attr('colSpan'));
                                if ( colspan <= columns.length) {
                                    $(this).attr('colSpan', colspan + 1);
                                }
                            }
                        });

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