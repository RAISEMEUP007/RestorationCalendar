// const { end } = require("@popperjs/core");
const { Modal } = require("bootstrap");
let $ = require("jquery");
require('bootstrap');
require('bootstrap-datepicker');

window.$ = window.jQuery = $;
var curNotyID = 0;
// var notyList = [];
var repeatSettingInfo;
var showFlag = 1;//if 1, custom calendar, else gregorian calendar
var myModal;
var isNotificationMarked = false;
var notificationList = [];
resetRepeatOnfoObject();

const custMonths = ['ALAAM','OMEN','RAISA','MIA','UNA','RIPA','SPAA','AMIA','DAISA','RA','PIAA','TEMIAA'];
const gregMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const custWeeks = ['AEMA','AMMA','HOA','DREMA','KEBA','REA','FIDA','LORSA','DROBA','ELPA','IRISA','IRITA','HODA/AERSA','EIRA/KIRA','SIHA','SONIA','MENIA','OBUA/DAISA','HOPA/RAISA','MIA RA'];
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * this function return Gregorian from Custom calendar.
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function ConvertCustomToGregorian(year, month, day) {
   year = parseInt(year);
   month = parseInt(month);
   day = parseInt(day);
   var offDays = 16049*360;
   var offTimestamp = offDays * 24 * 3600 * 1000;
   var ajustDate = new Date(2023, 5, 14, 1, 0, 0);
   var baseDate = new Date(ajustDate.getTime() - offTimestamp);

   //custom date -> Gregorian date
   offDays = (year - 1) * 360 + (month - 1) * 30 + day - 1;
   offTimestamp = offDays * 24 * 3600 * 1000;
   curDate = new Date(baseDate.getTime() + offTimestamp);
   this.year = curDate.getFullYear();
   this.month = curDate.getMonth() + 1; // Add 1 because getMonth() returns a zero-based index
   this.day = curDate.getDate();
}

/**
 * this function return Cusstom calendar with Gregorian
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function ConvertGregorianToCustom(year, month, day) {
   year = parseInt(year);
   month = parseInt(month);
   day = parseInt(day);
   var offDays = 16049*360;
   var offTimestamp = offDays * 24 * 3600 * 1000;
   var ajustDate = new Date(2023, 5, 14, 1, 0, 0);
   var baseDate = new Date(ajustDate.getTime() - offTimestamp);
   var curDate = new Date(year, month - 1, day, 1, 0, 0);
   var gregorianOffset = curDate.getTime() - baseDate.getTime();
   var custOffsetDays = Math.floor(gregorianOffset / 1000 / 3600 / 24);
   var custOffsetYear = Math.floor(custOffsetDays / 360);
   var custOffsetMonth = Math.floor((custOffsetDays - custOffsetYear * 360) / 30);
   var custOffsetDay = custOffsetDays - custOffsetYear * 360 -  custOffsetMonth * 30;
   custYear = custOffsetYear + 1;
   custMonth = custOffsetMonth + 1;
   custDay = custOffsetDay + 1;

   this.year = custYear;
   this.month = custMonth;
   this.day = custDay;
}
function getCustomDateString(year, month, day) {
   year = parseInt(year);
   month = parseInt(month);
   day = parseInt(day);
   var offDays = 16049*360;
   var offTimestamp = offDays * 24 * 3600 * 1000;
   var ajustDate = new Date(2023, 5, 14, 1, 0, 0);
   var baseDate = new Date(ajustDate.getTime() - offTimestamp);
   var curDate = new Date(year, month - 1, day, 1, 0, 0);
   var gregorianOffset = curDate.getTime() - baseDate.getTime();
   var custOffsetDays = Math.floor(gregorianOffset / 1000 / 3600 / 24);
   var custOffsetYear = Math.floor(custOffsetDays / 360);
   var custOffsetMonth = Math.floor((custOffsetDays - custOffsetYear * 360) / 30);
   var custOffsetDay = custOffsetDays - custOffsetYear * 360 -  custOffsetMonth * 30;
   custYear = custOffsetYear + 1;
   custMonth = custOffsetMonth + 1;
   custDay = custOffsetDay + 1;
   return custMonths[custMonth-1] + " " + custDay + " " + custYear;
}
function getDateStringFromCustom(custStr) {
   let tma = custStr.split(" ");
   let month = 0;
   for (let i = 0; i < custMonths.length; i++) {
      if (custMonths[i].toUpperCase() == tma[0].toUpperCase()) {
         month = i + 1;
         break;
      }
   }
   if (month == 0) return "";
   let rtn = "";
   tma.push(0);
   tma.push(0);
   let year = parseInt(tma[2]);
   let day = parseInt(tma[1]);
   let g = new ConvertCustomToGregorian(year, month, day);
   let rtnDate = new Date(g.year, g.month - 1, g.day, 1, 0, 0);
   return rtnDate.toLocaleDateString("sv-SE");
}

function makeCustomCalendarContent(year, month, printMode) {
   if (printMode == undefined) printMode = 0;
   year = parseInt(year);
   month = parseInt(month);
   var content = "<thead><tr>";
   for (var i=0;i<10;i++) {
      content+= "<th>" + custWeeks[i] + "</th>";
   }
   content+= "</tr><tr>";
   for (var i=0;i<10;i++) {
      content+= "<th>" + custWeeks[10 + i] + "</th>";
   }
   content+= "</tr></thead><tbody>";
   
   cusDay = 1;
   oldMonth = 0;
   let today = new Date();
   for (i = 0; i < 3; i++) {
      content += "<tr>";
      for (j = 0; j < 10; j++) {
         newDate = new ConvertCustomToGregorian(year, month, cusDay);
         let rDate = new Date(newDate.year, newDate.month - 1, newDate.day, 1, 0, 0);
         let rDInfo = rDate.toLocaleDateString("sv-SE");
         content += "<td data_dateinfo='" + rDInfo + "'";
         if (rDInfo == today.toLocaleDateString("sv-SE")) {
            content += " class='today'";
         }
         content += "><div class='calendarcel'>";
         content += "<span>" + (cusDay++) + "</span>";
         if (oldMonth != newDate.month) {
            oldMonth = newDate.month;
            content += "<span class='text-danger'> "+(gregMonths[newDate.month-1]+" "+newDate.day)+"</span>";
         } else {
            content += "<span class='text-danger'> "+(newDate.day)+"</span>";
         }
         content += "</div>";
         content += "</td>";
      }
      content += "</tr>";
   }
   content += "</tbody>";
   return content;
}

function makeGregorianCalendarContent(year, month, printMode) {
   if (printMode == undefined) printMode = 0;
   year = parseInt(year);
   month = parseInt(month);
   const daysInMonth = new Date(year, month, 0, 1, 0, 0).getDate();
   const endDayOfMonth = new Date(year, month, 0, 1, 0, 0).getDay();
   const firstDayOfMonth = new Date(year, month - 1, 1, 1, 0, 0).getDay();
   
   let calendar = "<thead><tr>";
   let today = new Date();
   
   // Add day labels
   let scdTr = "";
   for (let i = 0; i < daysOfWeek.length; i++) {
      calendar += "<th>" + daysOfWeek[i] + "</th>";
   }
   
   calendar += "</tr></thead><tbody>";
   
   // Add empty cells for days before the first of the month
   var oldMonth = 0;
   var weeks = Math.floor(daysInMonth / 7);
   var eachDay = 0;
   if (firstDayOfMonth != 0) {
      weeks = Math.floor((daysInMonth - (7 - firstDayOfMonth)) / 7);
      calendar += "<tr>";
      for (let i = 0; i < firstDayOfMonth; i++) {
         calendar += "<td></td>";
      }
      for (let i = firstDayOfMonth; i < 7; i++) {
         eachDay++;
         tmpDate = new ConvertGregorianToCustom(year, month, eachDay);
         let rDate = new Date(year, month - 1, eachDay, 1, 0, 0);
         let rDInfo = rDate.toLocaleDateString("sv-SE");
         calendar += "<td data_dateinfo='" + rDInfo + "'";
         if (rDInfo == today.toLocaleDateString("sv-SE")) {
            calendar += " class='today'";
         }
         calendar += "><div class='calendarcel'>";
         if (oldMonth != tmpDate.month) {
            oldMonth = tmpDate.month;
            calendar += "<span>" + eachDay + "</span><span class='text-danger'>"+(custMonths[tmpDate.month-1]+" "+tmpDate.day)+"</span>";
         } else {
            calendar += "<span>" + eachDay + "</span><span class='text-danger'>"+tmpDate.day+"</span>";
         }
         calendar += "</div></td>";
      }
      calendar += "</tr>";
   }
   
   // Add cells for each day in the month
   for (let w = 0; w < weeks; w++) {
      calendar += "<tr>";
      for (let i = 0; i < 7; i++) {
         eachDay++;
         tmpDate = new ConvertGregorianToCustom(year, month, eachDay);
         let rDate = new Date(year, month - 1, eachDay, 1, 0, 0);
         let rDInfo = rDate.toLocaleDateString("sv-SE");
         calendar += "<td data_dateinfo='" + rDInfo + "'";
         if (rDInfo == today.toLocaleDateString("sv-SE")) {
            calendar += " class='today'";
         }
         calendar += "><div class='calendarcel'>";
         if (oldMonth != tmpDate.month) {
            oldMonth = tmpDate.month;
            calendar += "<span>" + eachDay + "</span><span class='text-danger'>"+(custMonths[tmpDate.month-1]+" "+tmpDate.day)+"</span>";
         } else {
            calendar += "<span>" + eachDay + "</span><span class='text-danger'>"+tmpDate.day+"</span>";
         }
         calendar += "</div></td>";
      }
      calendar += "</tr>";
   }
   
   // Add empty cells for days after the end of the month
   if (endDayOfMonth !== 6) {
      calendar += "<tr>";
      for (let i = endDayOfMonth; i >= 0; i--) {
         eachDay++;
         tmpDate = new ConvertGregorianToCustom(year, month, eachDay);
         let rDate = new Date(year, month - 1, eachDay, 1, 0, 0);
         let rDInfo = rDate.toLocaleDateString("sv-SE");
         calendar += "<td data_dateinfo='" + rDInfo + "'";
         if (rDInfo == today.toLocaleDateString("sv-SE")) {
            calendar += " class='today'";
         }
         calendar += "><div class='calendarcel'>";
         if (oldMonth != tmpDate.month) {
            oldMonth = tmpDate.month;
            calendar += "<span>" + eachDay + "</span><span class='text-danger'>"+(custMonths[tmpDate.month-1]+" "+tmpDate.day)+"</span>";
         } else {
            calendar += "<span>" + eachDay + "</span><span class='text-danger'>"+tmpDate.day+"</span>";
         }
         calendar += "</div></td>";
      }

      const remainingDays = 7 - ((firstDayOfMonth + daysInMonth) % 7);
      for (let i = 0; i < remainingDays; i++) {
         calendar += "<td></td>";
      }
      calendar += "</tr>";
   }
   
   calendar += "</tbody>";
   return calendar;
}

function updateContent() {
   showFlag = $("#custRadio").get(0).checked;
   if (showFlag) {
      var year = $("#cusYear").val() * 1;
      var month = $("#cusMonth").val() * 1;
      content = makeCustomCalendarContent(year, month);
      $("#customCalendar").html(content);
      $("#customCalendar").removeClass("gregorian").addClass("custom");
   } else {
      var year = $("#gregYear").val() * 1;
      var month = $("#gregMonth").val() * 1;
      
      content = makeGregorianCalendarContent(year, month);
      $("#customCalendar").html(content);
      $("#customCalendar").removeClass("custom").addClass("gregorian");
   }

   console.log("Call Notification Mark Maker"),
   remarkNotificationDates();

   $("#customCalendar td").off("click");
   $("#customCalendar td").on("click", function(e) {
      let gregDate = $(this).attr("data_dateinfo");
      if (gregDate == undefined) return;
      
      showFlag = $("#custRadio").get(0).checked;
      showGCInputs(showFlag);
      var notiDate = new Date(gregDate+" 1:0:0");
      // $("#noti_date").val(notiDate.toLocaleDateString("sv-SE"));
      $("#noti_date").val(getDateFormatStr(notiDate));
      $("#noti_date").change();
      notiDate = new Date();
      notiDate.setSeconds(0);
      $("#noti_time").val(notiDate.toLocaleTimeString("sv-SE"));

      curNotyID = 0;
      $("#noty_title").val("");
      $("#btnRadioEvent").get(0).checked = true;
      $("#noti_desc").val("");
      myModal.toggle();
   });
}

function getDateFormatStr(dateVal) {
   if (!(dateVal instanceof Date)) {
      dateVal = new Date(dateVal + " 1:0:0");
   }
   let tmp = dateVal.toString().split(" ");
   return tmp[1] + " " + tmp[2] * 1 + " " + tmp[3];
}

function getDateValue(strVal) {
   let tmp = new Date(dateVal + " 1:0:0");
   return tmp;
}

$('#cusYear').on("change", function(e) {
   // e.stopImmediatePropagation();
   y = $("#cusYear").val();
   m = $("#cusMonth").val();
   newDate = new ConvertCustomToGregorian(y, m, 1);
   $("#gregYear").val(newDate.year);
   $("#gregMonth").val(newDate.month);
   updateContent();
});

$('#cusMonth').on("change", function(e) {
   // e.stopImmediatePropagation();
   y = $("#cusYear").val();
   m = $("#cusMonth").val();
   newDate = new ConvertCustomToGregorian(y, m, 1);
   $("#gregYear").val(newDate.year);
   $("#gregMonth").val(newDate.month);
   updateContent();
})

$('#gregYear').on("change", function(e) {
   // e.stopImmediatePropagation();
   y = $("#gregYear").val();
   m = $("#gregMonth").val();
   custDate = new ConvertGregorianToCustom(y, m, 1);
   $("#cusYear").val(custDate.year);
   $("#cusMonth").val(custDate.month);
   updateContent();
})

$('#gregMonth').on("change", function(e) {
   // e.stopImmediatePropagation();
   y = $("#gregYear").val();
   m = $("#gregMonth").val();
   custDate = new ConvertGregorianToCustom(y, m, 1);
   $("#cusYear").val(custDate.year);
   $("#cusMonth").val(custDate.month);
   updateContent();
});

$('[name=calendarFlag]').on("change", function(e) {
   updateContent();
});

$("#btnnorepeat").on("click", function(e) {
   setNoRepeatState();
});

$("#btnrepeat").on("click", function(e) {
   setRepeatState();
});

const ipcRenderer = require("electron").ipcRenderer;

function defaultPrint(str) {
   showFlag = $("#custRadio").get(0).checked;
   if (showFlag) {
      var year = $("#cusYear").val() * 1;
      var month = $("#cusMonth").val() * 1;
      monthName = custMonths[month - 1];
      tblClass = "table text-center table-bordered custom";
   } else {
      var year = $("#gregYear").val() * 1;
      var month = $("#gregMonth").val() * 1;
      monthName = gregMonths[month - 1];
      tblClass = "table text-center table-bordered gregorian";
   }
   printContent = "";
   printContent += "<div class='labelMark'>" + year + "</div><hr><div class='labelMark'>" + month + "&nbsp;" + monthName + "</div>";
   printContent += "<table class='" + tblClass + "'>" + $("#customCalendar").html() + "</table>";
   $("iframe").get(0).contentDocument.querySelector("#container").innerHTML = printContent;
   const printOptions = {
      silent: true,
      printBackground: false,
      dpi: 72,
      pageSize: 'Letter',
      landscape: true
   };
   $("iframe").get(0).contentWindow.print(printOptions);
}

function allPrint(str) {
   printContent = "";
   showFlag = $("#custRadio").get(0).checked;
   if (showFlag) {
      var year = $("#cusYear").val() * 1;
      tblClass = "table text-center table-bordered custom";
      for (var i=0; i<12; i++) {
         var month = i + 1;
         monthName = custMonths[month - 1];
         printContent += "<div class='yearLabelMark'>" + year + "</div><hr><div class='labelMark'>" + month + "&nbsp;" + monthName + "</div>";
         printContent += "<table class='" + tblClass + "'>" + makeCustomCalendarContent(year, month) + "</table><br/><div class='pgbreak'></div>";
      }
   } else {
      var year = $("#gregYear").val() * 1;
      tblClass = "table text-center table-bordered gregorian";
      for (var i=0; i<12; i++) {
         var month = i + 1;
         monthName = gregMonths[month - 1];
         printContent += "<div class='yearLabelMark'>" + year + "</div><hr><div class='labelMark'>" + month + "&nbsp;" + monthName + "</div>";
         printContent += "<table class='" + tblClass + "'>" + makeGregorianCalendarContent(year, month) + "</table><br/><div class='pgbreak'></div>";
      }
   }
   $("iframe").get(0).contentDocument.querySelector("#container").innerHTML = printContent;
   $("iframe").get(0).contentWindow.print();
}
var datepicker;
var enddatepicker;
$(document).ready(() => {
   $('.datepicker').datepicker({
      format: 'M d yyyy',
      autoclose: true
   });

   var sDate = new Date();

   $("#repeatendcustdate").val("TEMIAA 30 " + (14027 + sDate.getFullYear()));

   var endinput = document.getElementById('repeatendcustdate');
   enddatepicker = new TheDatepicker.Datepicker(endinput);
   enddatepicker.options.setInputFormat("M j Y");
   enddatepicker.options.setAllowEmpty(false);
   enddatepicker.options.setMonthAsDropdown(false);
   enddatepicker.options.setShowCloseButton(false);
   enddatepicker.render();
   myModal = new bootstrap.Modal(document.getElementById('notyModal'), {
      keyboard: true, focus: true
   });

   let nowDate = new Date();
   custDate = new ConvertGregorianToCustom(nowDate.getFullYear(), nowDate.getMonth() + 1, nowDate.getDate());
   $("#cusYear").val(custDate.year);
   $("#cusMonth").val(custDate.month);
   gregDate = new ConvertCustomToGregorian(custDate.year, custDate.month, 1);
   $("#gregYear").val(gregDate.year);
   $("#gregMonth").val(gregDate.month);
   
   updateContent();
   
   $('#closeNotyDiag').on("click", function(e) {
      $("#repeatdiag").hide();
      $("#notytable").show();
      myModal.hide();
   });

   $('#saveNoty').on("click", function(e) {
      if ($("#repeatdiag").css("display") != "none") {
         $("#dwmyDone").click();
      }
      //save noty and mark date!
      let notyType = 0;
      if($("#btnRadioTask").get(0).checked) notyType = 1;
      if($("#btnRadioReminder").get(0).checked) notyType = 2;

      if ($("#btnnorepeat").get(0).checked) repeatSettingInfo.every = 0;
      data = {"id": curNotyID, "title": $("#noty_title").val(), "type": notyType, "date": $("#noti_date").val(), "time": $("#noti_time").val(), "desc": $("#noti_desc").val(), "repeatInfo":repeatSettingInfo, "calendartype": showFlag};
      if (showFlag) {
         //Restoration Notification must be registered, date item must reset from cust_date.
         let tmp = $("#noti_cust_date").val();
         data.date = getDateStringFromCustom(tmp);
      }
      if (data.title == "") {
         $("#noty_title").focus();
         return;
      }
      if (data.date == "") {
         $("#noti_date").focus();
         return;
      }
      if (data.time == "") {
         $("#noti_time").focus();
         return;
      }
      
      ipcRenderer.send('registerNotyInfo', data);
      $("#noty_title").val("");
      $("#noti_desc").val("");
      resetRepeatOnfoObject();
      $("#btnnorepeat").click();

      curNotyID = 0;
   });

   $("#questionModal button.btn-primary").on("click", function(e) {
      e.preventDefault();
      notyId = $("#questionModal button.btn-primary").attr("notyId");
      ipcRenderer.send('removeNotyInfo', {id:notyId});
      qModal.hide();
   });
   
   $("#noti_date").on("change", function (e) {
      if (datepicker) datepicker.destroy();
      var sDate = new Date(this.value + " 1:0:0");
      var year = sDate.getFullYear();
      var month = sDate.getMonth() + 1
      var day = sDate.getDate();
      
      $("#noti_cust_date").val(getCustomDateString(year, month, day));
      var input = document.getElementById('noti_cust_date');
      datepicker = new TheDatepicker.Datepicker(input);
      // datepicker.options.setToday(sDate.toLocaleDateString("sv-SE"));
      datepicker.options.setInputFormat("M j Y");
      datepicker.options.setShowDeselectButton(false);
      datepicker.options.setAllowEmpty(false);
      // datepicker.options.setMonthAsDropdown(false);
      datepicker.options.setShowCloseButton(false);
      datepicker.render();
   });

   $("#repeatevery").on("change", (e) => {
      let repeatevery = parseInt($("#repeatevery").val());
      if (isNaN(repeatevery)) repeatevery = 1;
      if (repeatevery<1) repeatevery = 1;
      $("#repeatevery").val(repeatevery);
      let tArray = ['day', 'week', 'month', 'year'];
      let tsArray = ['days', 'weeks', 'months', 'years'];
      if (repeatevery==1) {
         $("#repeatdwmy option").each(function(i) {
            $(this).text(tArray[i]);
         });
      } else {
         $("#repeatdwmy option").each(function(i) {
            $(this).text(tsArray[i]);
         });
      }
   });

   $("#repeatdwmy").on("change", (e) => {
      let seltdwmy = $("#repeatdwmy").val();
      if (seltdwmy==2) {
         $("#weekseldiv").show();
      } else {
         $("#weekseldiv").hide();
      }
   });

   $("#gregorian_week button").on("click", function(e) {
      let selCnt = $("#gregorian_week button.active").length;
      if (selCnt<1) {
         $(this).addClass("active");
      }
   });

   $("#custom_week button").on("click", function(e) {
      let selCnt = $("#custom_week button.active").length;
      if (selCnt<1) {
         $(this).addClass("active");
      }
   });

   $("#dwmyCancel").on("click", (e) => {
      $("#btnnorepeat").click();
   });

   $("#dwmyDone").on("click", (e) => {
      let endType = 2;
      if ($("#neverend").get(0).checked) endType = 0;
      if ($("#onend").get(0).checked) endType = 1;
      let endDate = $("#repeatenddate").val();
      let endOccurrences = $("#repeatoccurrences").val();
      if (endType == 1) {
         if (showFlag) {
            let tmpStr = $("#repeatendcustdate").val();
            let tmpArray = tmpStr.split(" ");
            let custMonth = "-";
            for (let i = 0; i < custMonths.length; i++) {
               if (tmpArray[0].toUpperCase() == custMonths[i].toUpperCase()) {
                  custMonth = i + 1;
                  break;
               }
            }
            tmpArray.push("");tmpArray.push("");
            tmpStr = custMonth + " " + tmpArray[1] + " " + tmpArray[2];
            const stamp = Date.parse(tmpStr);
            if (isNaN(stamp)) {
               $("#repeatendcustdate").focus();
               return;
            }
            else {
               var gObj = new ConvertCustomToGregorian(tmpArray[2], custMonth, tmpArray[1]);
               var gDate = new Date(gObj.year, gObj.month - 1, gObj.day, 1, 0, 0);
               $("#repeatenddate").val(gDate.toLocaleDateString("sv-SE"));
            }
         }
         else {
            if (endDate == "") {
               $("#repeatenddate").focus();
               return;
            }
         }
      } else if (endType == 2) {
         if (endOccurrences < 1) {
            $("#repeatoccurrences").focus();
            return;
         }
      }
      let wdayons = [];
      if (showFlag) {
         $("#custom_week button").each(function (i) {
            if ($(this).hasClass("active")) {
               wdayons.push(i);
            }
         });
      }
      else {
         $("#gregorian_week button").each(function (i) {
            if ($(this).hasClass("active")) {
               wdayons.push(i);
            }
         });
      }
      repeatSettingInfo.every = $("#repeatevery").val();
      repeatSettingInfo.dwmy = $("#repeatdwmy").val();
      repeatSettingInfo.weekdayon = wdayons;
      repeatSettingInfo.endtype = endType;
      repeatSettingInfo.endday = $("#repeatenddate").val();
      repeatSettingInfo.endoccurrences = $("#repeatoccurrences").val();

      setNoRepeatState();
   });

   $("#repeatoccurrences").on("change", (e) => {
      let repeatoccurrences = parseInt($("#repeatoccurrences").val());
      if (isNaN(repeatoccurrences)) repeatoccurrences = 1;
      if (repeatoccurrences<1) repeatoccurrences = 1;
      $("#repeatoccurrences").val(repeatoccurrences);
   });
});
      
ipcRenderer.on('registerNotyInfo', (event, result) => {
   var eTrStr = getNotyRowString(result);
   var existState = $("tr[data_id='" + result.id + "']").length;
   if (existState) {
      $("tr[data_id='" + result.id + "']").replaceWith(eTrStr);
      for(let i = 0; i<notificationList.length; i++) {
         if (notificationList[i].id == result.id) {
            notificationList[i] = result;
            break;
         }
      }
   } else {
      $("#notybody").append(eTrStr);
      notificationList.push(result);
   }
   defineListButtonEvent();
   remarkNotificationDates();
});

ipcRenderer.on('removeNotyInfo', (event, result) => {
   $("tr[data_id='" + notyId + "']").remove();
   // notificationList = notificationList.filter(item => item.id !== notyId);
   const index = notificationList.findIndex(function(item){
      return item.id*1===notyId*1;
   });

   if (index !== -1) {
      notificationList.splice(index, 1);
   }
   remarkNotificationDates();
});

ipcRenderer.send('getNotyList');
ipcRenderer.on('getNotyList', (event, result) => {
   console.log("DB:NotificationList:",result);
   notificationList = result;
   $("#notybody").empty();
   if (result) {
      for (var i=0; i<result.length; i++) {
         var eTrStr = getNotyRowString(result[i]);
         $("#notybody").append(eTrStr);
      }
      defineListButtonEvent();
   }
   remarkNotificationDates();
});

ipcRenderer.on('getOneNotyInfo', (event, result) => {
   if (result) {
      curNotyID = result.id;
      $("#noty_title").val(result.notytitle);
      $("#noti_desc").val(result.notydesc);

      if (result.notytype == 0) {
         $("#btnRadioEvent").get(0).checked = true;
      } else if (result.notytype == 1) {
         $("#btnRadioTask").get(0).checked = true;
      } else {
         $("#btnRadioReminder").get(0).checked = true;
      }
      $("#noti_date").val(getDateFormatStr(result.notydate));
      $("#noti_time").val(result.notytime);
      
      showFlag = result.calendartype;
      showGCInputs(showFlag);
      if (result.calendartype) {
         //custom method
         $("#noti_date").change();
      }
      else {
         //gregorian method
      }
      
      repeatSettingInfo.every = result.repeatevery;
      repeatSettingInfo.dwmy = result.repeatdwmy;
      let repeatweekon = result.repeatweekon.split(",");
      repeatSettingInfo.weekdayon = [];
      for(let ind in repeatweekon) {
         if (repeatweekon[ind] != "") {
            repeatSettingInfo.weekdayon.push(repeatweekon[ind]);
         }
      }

      repeatSettingInfo.endtype = result.repeatendtype;
      repeatSettingInfo.endday = result.repeatendday;
      repeatSettingInfo.endoccurrences = result.repeatendoccurrences;

      if (result.repeatevery==0) {
         $("#btnnorepeat").click();
      } else {
         $("#btnrepeat").click();
      }
   }
});

ipcRenderer.on('errorInfo', (event, err) => {
   console.log(err);
});

var qModal = new bootstrap.Modal(document.getElementById('questionModal'), {focus: true});

function removeNoty(notyId) {
   $("#questionModal button.btn-primary").attr({"notyId": notyId});
   qModal.show();
}

function setOneNotyInfo(notyId) {
   ipcRenderer.send('getOneNotyInfo', {id:notyId});
}

function getNotyRowString(row) {
   var nDate = new Date(row.notydate + " " + row.notytime);
   var nDay = "";
   if (row.calendartype == 1) {
      var nDate = new Date(row.notydate + " " + row.notytime);
      var nY = nDate.getFullYear();
      var nM = nDate.getMonth() + 1;
      var nD = nDate.getDate();
      nDay = getCustomDateString(nY, nM, nD) + " " + nDate.toLocaleTimeString();
   }
   else {
      nDay = getDateFormatStr(nDate) + " " + nDate.toLocaleTimeString();
   }
   eTrStr = "<tr data_id='"+row.id+"'><td>";
   if (row.notytype == 0) {
      eTrStr+= "<img width='18' height='18' src='./resources/event.svg' />";
   } else if (row.notytype == 1) {
      eTrStr+= "<img width='18' height='18' src='./resources/task.svg' />";
   } else {
      eTrStr+= "<img width='18' height='18' src='./resources/remember.svg' />";
   }
   eTrStr+= "</td><td style='text-align:left;'><div style='width: 110px;word-wrap: break-word;'>"+row.notytitle+"</div></td>";
   eTrStr+= "<td style='text-align:left;'>"+nDay+"</td>";
   eTrStr+= "<td><img class='editSvg' width='18' height='18' src='./resources/edit.svg' /></td>";
   eTrStr+= "<td><img class='removeSvg' width='18' height='18' src='./resources/trash.svg' /></td></tr>";
   return eTrStr;
}

function defineListButtonEvent() {
   $("#notybody img.editSvg").off("click");
   $("#notybody img.editSvg").on("click", function(e) {
      var notyId = $(this).parent().parent().attr("data_id");
      setOneNotyInfo(notyId);
   });
   $("#notybody img.removeSvg").off("click");
   $("#notybody img.removeSvg").on("click", function(e) {
      var notyId = $(this).parent().parent().attr("data_id");
      removeNoty(notyId);
   });
}

function setNoRepeatState() {
   $("#repeatdiag").hide();
   $("#notytable").fadeIn();
}

function setRepeatState() {
   $("#repeatevery").val(repeatSettingInfo.every);
   $("#repeatevery").change();
   $("#repeatdwmy").val(repeatSettingInfo.dwmy);
   $("#repeatdwmy").change();

   if (repeatSettingInfo.endtype==1) {
      $("#onend").get(0).checked = true;
      $("#onend").click();
   }
   else if (repeatSettingInfo.endtype==2) {
      $("#onoccurrences").get(0).checked = true;
      $("#onoccurrences").click();
   }
   else {
      $("#neverend").get(0).checked = true;
      $("#neverend").click();
   }

   $("#repeatenddate").val(repeatSettingInfo.endday);
   $("#repeatoccurrences").val(repeatSettingInfo.endoccurrences);

   if (repeatSettingInfo.weekdayon.length == 0) {
      if (showFlag) {
         let cDate = new Date($("#noti_date").val()+" 1:0:0");
         var gObj = new ConvertGregorianToCustom(cDate.getFullYear(), cDate.getMonth() + 1, cDate.getDate() - 1);
         let selWeek = gObj.day % 10;
         repeatSettingInfo.weekdayon = [selWeek];
      } else {
         let cDate = new Date($("#noti_date").val()+" 1:0:0");
         let selWeek = cDate.getDay();
         repeatSettingInfo.weekdayon = [selWeek];
      }
   }
   if (showFlag) {
      for (let ii=0; ii<repeatSettingInfo.weekdayon.length; ii++) {
         let btnObj = $("#custom_week button").get(repeatSettingInfo.weekdayon[ii]);
         $(btnObj).addClass("active");
      }
   }
   else {
      for (let ii=0; ii<repeatSettingInfo.weekdayon.length; ii++) {
         let btnObj = $("#gregorian_week button").get(repeatSettingInfo.weekdayon[ii]);
         $(btnObj).addClass("active");
      }
   }
   
   $("#notytable").hide();
   $("#repeatdiag").fadeIn();
}

function resetRepeatOnfoObject() {
   repeatSettingInfo = {
      every: 0,
      dwmy: 2,
      weekdayon: [],
      endtype: 0,
      endday: "",
      endoccurrences: 13,
   };
}

function showGCInputs(flag) {
   if (flag) {
      $("#noti_date").hide();
      $("#repeatenddate").hide();
      $("#gregorian_week").hide();
      $("#noti_cust_date").show();
      $("#repeatendcustdate").show();
      $("#custom_week").show();
   } else {
      $("#noti_cust_date").hide();
      $("#repeatendcustdate").hide();
      $("#custom_week").hide();
      $("#noti_date").show();
      $("#repeatenddate").show();
      $("#gregorian_week").show();
   }
}

function remarkNotificationDates() {
   //get a date string before the first day of the displayed month
   let prevDateStr = "";
   $("#customCalendar td").each(function(ind) {
      let eachDate = $(this).attr("data_dateinfo");
      if (eachDate == undefined) return;
      if (prevDateStr == "") prevDateStr = eachDate;
   });

   for (var i=0; i<notificationList.length; i++) {
      notificationList[i].backupProp1 = notificationList[i].repeatendoccurrences;
      let repeatEvery = parseInt(notificationList[i].repeatevery);
      if (isNaN(repeatEvery)) repeatEvery = 0;
      if (repeatEvery < 1) {
         continue;
      }
      //About each notification determine how many times it has occurred up before the first day of the displayed month, and reduce the number of repeat.
      if (notificationList[i].repeatendtype == 2) {
         let remainOccurrence = parseInt(notificationList[i].repeatendoccurrences);
         if (isNaN(remainOccurrence)) remainOccurrence = 0;
         if (remainOccurrence <= 0) {
            continue;
         } else {
            let notyDate = new Date(notificationList[i].notydate + " 1:0:0");
            let endDate = new Date(prevDateStr + " 1:0:0");
            endDate.setDate(endDate.getDate() - 1);
            for (let eDay = notyDate.getTime(); eDay < endDate.getTime(); eDay+=24*3600*1000) {
               let cDateObj = new Date(eDay);
               cDate = cDateObj.toLocaleDateString('sv-SE');
               cDay = cDateObj.getDay();
               custCurDate = new ConvertGregorianToCustom(cDateObj.getFullYear(), cDateObj.getMonth() + 1, cDateObj.getDate());
               custNotiDate = new ConvertGregorianToCustom(notyDate.getFullYear(), notyDate.getMonth() + 1, notyDate.getDate());
               //evaluate repeat type (week, month, year, day)
               let repeatType = notificationList[i].repeatdwmy;
               if (repeatType == 2) {// week condition
                  let weekdays = notificationList[i].repeatweekon.split(",");
   
                  if (notificationList[i].calendartype==0) {//gregorian calendar
                     if (weekdays.indexOf(cDay + '') == -1) {
                        continue;
                     }
   
                     let diffW = Math.floor((cDateObj.getTime()/24/3600/1000-cDateObj.getDay()+7)/7) - Math.floor((notyDate.getTime()/24/3600/1000-notyDate.getDay()+7)/7);
                     if (diffW % repeatEvery) {
                        continue;
                     }
                  }
                  else {
                     //custom calendar
                     if (weekdays.indexOf((custCurDate.day - 1) % 10 + '') == -1) {
                        continue;
                     }
                     // custNotyDate = new ConvertGregorianToCustom(notyDate.getFullYear(), notyDate.getMonth() + 1, notyDate.getDate());
                     let diffW = Math.floor((custCurDate.month * 10 + custCurDate.day - 1) / 10) - Math.floor((custNotiDate.month * 10 + custNotiDate.day - 1) / 10);
                     if (diffW % (repeatEvery)) {
                        continue;
                     }
                  }
                  
                  notificationList[i].repeatendoccurrences--;
               }
               else if (repeatType == 4) {// year condition ----------- checked
                  if (notificationList[0].calendartype==0) {//gregorian calendar notification
                     if (notyDate.getMonth() != cDateObj.getMonth() || notyDate.getDate() != cDateObj.getDate()) {
                        continue;
                     }
                     let diffY = cDateObj.getFullYear() - notyDate.getFullYear();
                     if (diffY % repeatEvery) {
                        continue;
                     }
                  }
                  else {//custom calendar notification
                     if (custCurDate.month != custNotiDate.month || custCurDate.day != custNotiDate.day) {
                        continue;
                     }
                     let diffY = custCurDate.year - custNotiDate.year;
                     if (diffY % repeatEvery) {
                        continue;
                     }
                  }
                     
                  notificationList[i].repeatendoccurrences--;
               }
               else if (repeatType == 3) {// month condition   --------------- checked
                  if (notificationList[i].calendartype == 0) {//gregorian calendar notification
                     if (notyDate.getDate() != cDateObj.getDate()) {
                        continue;
                     }
                     let diffM = cDateObj.getFullYear() * 12 + cDateObj.getMonth() - notyDate.getFullYear() * 12 - notyDate.getMonth();
                     if (diffM % repeatEvery) {
                        continue;
                     }
                  }
                  else {//custom calendar notification
                     if (custCurDate.month != custNotiDate.month) {
                        continue;
                     }
                     let diffM = custCurDate.year * 12 + custCurDate.month - custNotiDate.year * 12 - custNotiDate.month;
                     if (diffM % repeatEvery) {
                        continue;
                     }
                  }
                     
                  notificationList[i].repeatendoccurrences--;
               }
               else if (repeatType == 1) {// day condition
                  if (notificationList[i].calendartype==0) {//gregorian calendar notification
                     if (notyDate.getDay() != cDateObj.getDay()) {
                        continue;
                     }
                     let diffD = Math.floor((cDateObj.getTime() - notyDate.getTime()) / 24 / 3600 / 1000);
                     if (diffD % (repeatEvery * 7)) {
                        continue;
                     }
                  }
                  else {//custom calendar notification
                     if (custCurDate.day != custNotiDate.day) {
                        continue;
                     }
                     let diffD = custCurDate.day - custNotiDate.day;
                     if (diffD % (repeatEvery * 10)) {
                        continue;
                     }
                  }
                  
                  notificationList[i].repeatendoccurrences--;
               }
            }
         }
      }
   }
   console.log("Notification List:", notificationList);
   $("#customCalendar td").each(function(ind) {
      $(this).children("div").removeClass("rnmark");
      $(this).removeClass("gnmark");
      let eachDate = $(this).attr("data_dateinfo");
      if (eachDate == undefined) return;

      let cDateObj = new Date(eachDate + " 1:0:0");
      cDate = cDateObj.toLocaleDateString('sv-SE');
      cDay = cDateObj.getDay();
      custCurDate = new ConvertGregorianToCustom(cDateObj.getFullYear(), cDateObj.getMonth() + 1, cDateObj.getDate());

      for (var i=0; i<notificationList.length; i++) {
         let isGreg = false;
         let isCust = false;
         let remainOccurrence = -1;
         let notyDate = new Date(notificationList[i].notydate + " 1:0:0");
         if (cDateObj.toLocaleDateString("sv-SE") < notyDate.toLocaleDateString("sv-SE")) {
            continue;
         }
         //to process custom calendar notification, notification date convert custom date object
         custNotiDate = new ConvertGregorianToCustom(notyDate.getFullYear(), notyDate.getMonth() + 1, notyDate.getDate());
         if (notificationList[i].repeatendtype == 1) {
            //evaluate end date
            let endDate = new Date(notificationList[i].repeatendday+" 1:0:0");
            if (cDate > endDate.toLocaleDateString('sv-SE')) {
               continue;
            }
         }
         let repeatEvery = parseInt(notificationList[i].repeatevery);
         if (isNaN(repeatEvery)) repeatEvery = 0;
         if (repeatEvery < 1) {//this case deals with norepeat notification
            if (cDateObj.getFullYear() != notyDate.getFullYear() || cDateObj.getMonth() != notyDate.getMonth() || cDateObj.getDate() != notyDate.getDate()) {
               continue;
            }
         }
         else {//this case deals with repeat notification
            //evaluate repeat type (week, month, year, day)
            let repeatType = notificationList[i].repeatdwmy;
            if (repeatType == 2) {// week condition
               let weekdays = notificationList[i].repeatweekon.split(",");

               if (notificationList[i].calendartype==0) {//gregorian calendar
                  if (weekdays.indexOf(cDay + '') == -1) {
                     continue;
                  }

                  let diffW = Math.floor((cDateObj.getTime()/24/3600/1000-cDateObj.getDay()+7)/7) - Math.floor((notyDate.getTime()/24/3600/1000-notyDate.getDay()+7)/7);
                  if (diffW % repeatEvery) {
                     continue;
                  }
               }
               else {
                  //custom calendar
                  if (weekdays.indexOf((custCurDate.day - 1) % 10 + '') == -1) {
                     continue;
                  }
                  // custNotyDate = new ConvertGregorianToCustom(notyDate.getFullYear(), notyDate.getMonth() + 1, notyDate.getDate());
                  let diffW = Math.floor((custCurDate.month * 10 + custCurDate.day - 1) / 10) - Math.floor((custNotiDate.month * 10 + custNotiDate.day - 1) / 10);
                  if (diffW % (repeatEvery)) {
                     continue;
                  }
               }
               
               if (notificationList[i].repeatendtype == 2) {
                  //evaluate occurrences
                  let occurrences = parseInt(notificationList[i].repeatendoccurrences);
                  if (isNaN(occurrences)) occurrences = 0;
                  if (occurrences <= 0) {
                     continue;
                  } else {
                     remainOccurrence = occurrences - 1;
                  }
               }
            }
            else if (repeatType == 4) {// year condition ----------- checked
               if (notificationList[0].calendartype==0) {//gregorian calendar notification
                  if (notyDate.getMonth() != cDateObj.getMonth() || notyDate.getDate() != cDateObj.getDate()) {
                     continue;
                  }
                  let diffY = cDateObj.getFullYear() - notyDate.getFullYear();
                  if (diffY % repeatEvery) {
                     continue;
                  }
               }
               else {//custom calendar notification
                  if (custCurDate.month != custNotiDate.month || custCurDate.day != custNotiDate.day) {
                     continue;
                  }
                  let diffY = custCurDate.year - custNotiDate.year;
                  if (diffY % repeatEvery) {
                     continue;
                  }
               }
                  
               if (notificationList[i].repeatendtype == 2) {
                  //evaluate occurrences
                  let occurrences = parseInt(notificationList[i].repeatendoccurrences);
                  if (isNaN(occurrences)) occurrences = 0;
                  if (occurrences <= 0) {
                     continue;
                  } else {
                     remainOccurrence = occurrences - 1;
                  }
               }
            }
            else if (repeatType == 3) {// month condition   --------------- checked
               if (notificationList[i].calendartype == 0) {//gregorian calendar notification
                  if (notyDate.getDate() != cDateObj.getDate()) {
                     continue;
                  }
                  let diffM = cDateObj.getFullYear() * 12 + cDateObj.getMonth() - notyDate.getFullYear() * 12 - notyDate.getMonth();
                  if (diffM % repeatEvery) {
                     continue;
                  }
               }
               else {//custom calendar notification
                  if (custCurDate.month != custNotiDate.month) {
                     continue;
                  }
                  let diffM = custCurDate.year * 12 + custCurDate.month - custNotiDate.year * 12 - custNotiDate.month;
                  if (diffM % repeatEvery) {
                     continue;
                  }
               }
                  
               if (notificationList[i].repeatendtype == 2) {
                  //evaluate occurrences
                  let occurrences = parseInt(notificationList[i].repeatendoccurrences);
                  if (isNaN(occurrences)) occurrences = 0;
                  if (occurrences <= 0) {
                     continue;
                  } else {
                     remainOccurrence = occurrences - 1;
                  }
               }
            }
            else if (repeatType == 1) {// day condition
               if (notificationList[i].calendartype==0) {//gregorian calendar notification
                  if (notyDate.getDay() != cDateObj.getDay()) {
                     continue;
                  }
                  let diffD = Math.floor((cDateObj.getTime() - notyDate.getTime()) / 24 / 3600 / 1000);
                  if (diffD % (repeatEvery * 7)) {
                     continue;
                  }
               }
               else {//custom calendar notification
                  if (custCurDate.day != custNotiDate.day) {
                     continue;
                  }
                  let diffD = custCurDate.day - custNotiDate.day;
                  if (diffD % (repeatEvery * 10)) {
                     continue;
                  }
               }
               
               if (notificationList[i].repeatendtype == 2) {
                  //evaluate occurrences
                  let occurrences = parseInt(notificationList[i].repeatendoccurrences);
                  if (isNaN(occurrences)) occurrences = 0;
                  if (occurrences <= 0) {
                     continue;
                  } else {
                     remainOccurrence = occurrences - 1;
                  }
               }
            }
         }

         if (remainOccurrence != -1) {
            //occurrence is reduced as 1
            notificationList[i].repeatendoccurrences = remainOccurrence;
         }
         if (notificationList[i].calendartype == 0) {
            isGreg = true;
            $(this).addClass("gnmark");
         }
         else {
            isCust = true;
            $(this).children("div").addClass("rnmark");
         }
      }
   });
   for (var i=0; i<notificationList.length; i++) {
      notificationList[i].repeatendoccurrences = notificationList[i].backupProp1;
   }
}

function consoleLog() {
   console.log("Notification Appear Ready!");
}