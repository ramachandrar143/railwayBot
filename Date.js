module.exports = {
    getDate: function gtDate() {
        var today = new Date();
        // utc = dte.getTime() + (dte.getTimezoneOffset() * 60000);
        // today = new Date(utc + (3600000 * (+5.5)));
        var dd = today.getDate();
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        var today = yyyy + '' + mm + '' + dd;
        return today;
    },
    getTime: function gttime() {
        var dte = new Date();
        utc = dte.getTime() + (dte.getTimezoneOffset() * 60000);
        today = new Date(utc + (3600000 * (+5.5)));
        var hr = today.getHours();
        var min = today.getMinutes();
        if (hr < 10) {
            hr = '0' + hr
        }
        if (min < 10) {
            min = '0' + min
        }
        var time = '' + hr + ':' + min;
        return time;
    }
}