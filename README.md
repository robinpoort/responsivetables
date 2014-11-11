responsivetables
================

Responsive tables for user generated content tables. Removing column by column when run out of space

Options
=======

```
$('table').responsiveTable({
    wrapper: {
        'class': 'rttablewrapper', // The class for the table wrapper element
        'position': 'relative' // The position for the table wrapper element
    },
    table: {
        'initiatedclass': 'rttable--initiated', // Class added to table once script is initated
        'activetoggleclass': 'rttable--active_toggle' // Class added to table once celss are hidden
    },
    toggle_box: {
        'class': 'rttoggle_box' // Class added to the created <tr> with the hidden items (after toggle)
    },
    toggle: {
        'selector': '', // Element to add the toggle button to (default is <td>)
        'element': 'button', // Toggle element, button is accessible
        'class': 'rttoggler', // Class added to toggle element
        'openclass': 'rtopen', // Class added to toggle element when opened
        'text': '&raquo;' // Text on the toggle element
    }
});
```