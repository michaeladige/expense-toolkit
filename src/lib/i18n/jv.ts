import type { TranslationDict } from "./types";

/**
 * Basa Jawa — informal ngoko with a Gen-Z twist. Loose and funny, not literal.
 * Mixes in casual Indonesian/English slang the way people actually text.
 */
export const jv: TranslationDict = {
  strings: {
    // App shell
    "app.title": "Dompet Sat-Set 💸",
    "app.tagline": "Ngawasi duit saben dina, minggu & sasi",
    "app.reports": "📊 Rapor",
    "app.settings": "⚙ Utak-atik",
    "app.rateTitle": "Status kurs — pencet kanggo refresh",
    "rate.pill.idle": "Kurs",
    "rate.pill.loading": "Ngenteni…",
    "rate.pill.live": "Kurs live ✨",
    "rate.pill.cached": "Kurs kuno",
    "rate.pill.error": "Kurs ngambek",

    // Shared field labels / actions
    "field.amount": "Nominal",
    "field.currency": "Dhuwit",
    "field.category": "Kategori",
    "field.date": "Tanggal",
    "common.note": "Cathetan (sakarepmu)",
    "common.amountPlaceholder": "0.00",
    "common.add": "Gas Wae",
    "common.uncategorized": "Ora Cetha",
    "kind.expense": "Boncos",
    "kind.income": "Cuan",
    "noun.expense": "pengeluaran",
    "noun.income": "pemasukan",
    "unit.week": "minggu",
    "unit.month": "sasi",
    "unit.plural.day": "dina",
    "unit.plural.week": "minggu",
    "unit.plural.month": "sasi",

    // Period selector
    "period.day": "Dinan",
    "period.week": "Mingguan",
    "period.month": "Sasenan",
    "period.tablist": "Periode",
    "period.prev": "Periode sadurunge",
    "period.next": "Periode sabanjure",
    "period.today": "Dina Iki",

    // Summary cards
    "summary.net": ({ currency }) => `Sisa Dhuwit (${currency})`,
    "summary.income": "Duit Mlebu",
    "summary.expenses": "Duit Minggat",
    "summary.byCurrency": "Boncos saben dhuwit",
    "summary.txCount": ({ n }) => `${n} transaksi`,
    "summary.currencyCount": ({ n }) => `${n} dhuwit`,

    // Entry form
    "entryForm.addExpense": "Cathet Boncos",
    "entryForm.addIncome": "Cathet Cuan",
    "entryForm.editExpense": "Owahi Boncos",
    "entryForm.editIncome": "Owahi Cuan",
    "entryForm.quickAdd": "Tambah cepet",
    "entryForm.entryType": "Jinis cathetan",
    "entryForm.notePlaceholderIncome": "cth. gajian sasi iki 🤑",
    "entryForm.notePlaceholderExpense": "cth. jajan karo konco",
    "entryForm.saveChanges": "Simpen wae",
    "entryForm.cancel": "Wegah ah",

    // Entry list
    "list.transactions": ({ n }) => `Transaksi (${n})`,
    "list.filterAria": "Filter transaksi",
    "filter.all": "Kabeh",
    "filter.expense": "Boncos",
    "filter.income": "Cuan",
    "list.emptyAll": "Durung ana transaksi periode iki. Sabar sik.",
    "list.emptyExpense": "Durung boncos periode iki, mantul.",
    "list.emptyIncome": "Durung ana cuan periode iki. Sing sabar yo.",
    "list.viewAll": ({ n }) => `Deloki kabeh ${n} transaksi`,

    // Entry item actions
    "item.duplicate": ({ noun }) => `Duplikat ${noun}`,
    "item.edit": ({ noun }) => `Owahi ${noun}`,
    "item.delete": ({ noun }) => `Busak ${noun}`,

    // All-entries drawer
    "allEntries.title": "Kabeh Transaksi",
    "allEntries.close": "Tutup kabeh transaksi",
    "allEntries.filterType": "Filter saben jinis",
    "allEntries.searchPlaceholder": "Goleki cathetan, kategori, utawa tanggal…",
    "allEntries.searchAria": "Goleki transaksi",
    "allEntries.filterCategoryAria": "Filter saben kategori",
    "allEntries.allCategories": "Kabeh kategori",
    "allEntries.from": "Saka",
    "allEntries.to": "Tekan",
    "allEntries.clearDates": "Reset rentang tanggal",
    "allEntries.count": ({ n }) => `${n} transaksi`,
    "allEntries.empty": "Ora ana sing cocog karo filter iki.",

    // Category chart
    "chart.byCategory": "Saben Kategori",
    "chart.empty": "Durung ana boncos kanggo digrafiki.",
    "chart.spendingAria": "Pengeluaran saben kategori",
    "chart.total": "Total",

    // Day-type analytics
    "dayType.workdays": "Dina Kerja",
    "dayType.daysOff": "Dina Nganggur",
    "dayType.title": "Kapan Kowe Boncos",
    "dayType.subtitle": "Sakabehe · rata2 = saben dina kowe jajan",
    "dayType.empty":
      "Cathet pirang boncos dhisik, mengko ketok dina kerja vs dina nganggur.",
    "dayType.approx": "~kira2",
    "dayType.approxTitle":
      "Sawetara boncos tiba ing taun sing datane durung ana, dadi ana libur sing bisa keitung dina kerja",
    "dayType.approxTitleShort":
      "Sawetara boncos tiba ing taun sing datane durung ana",
    "dayType.perDay": ({ money }) => `${money}/dina`,
    "dayType.days": ({ n, pct }) => `${n} dina · ${pct}%`,
    "dayType.viewAll": "Deloki rinciane →",
    "dayType.detailsSubtitle": "Rincian sakabehe",
    "dayType.closeAria": "Tutup rincian",
    "dayType.viewAria": "Tampilan rincian",
    "view.byCategory": "Saben kategori",
    "view.byDayType": "Saben jinis dina",
    "dayType.emptyRecorded": "Durung ana boncos kecathet.",
    "dayType.work": ({ money }) => `Kerja ${money}`,
    "dayType.off": ({ money }) => `Nganggur ${money}`,
    "dayType.nothingHere": "Kothong blong ing kene.",

    // Trend chart
    "trend.title": "Tren Boncos",
    "trend.aria": ({ n, unit }) =>
      `Boncos ${n} ${unit} pungkasan, saben kategori`,

    // Month grades
    "grades.title": ({ month }) => `Rapor · ${month}`,
    "grades.spending": "Boncos",
    "grades.savings": "Nabung",
    "grades.vsAverage": "vs rata-rata boncos",
    "grades.vsBudget": "vs budget total",
    "grades.vsIncome": "vs pemasukan",
    "grades.spendingPending":
      "Set budget Total ing ngisor, utawa balik maneh nek sasi wingi wis ana boncos kanggo dibandhingke.",
    "grades.savingsPending":
      "Cathet pemasukan sasi iki dhisik ben oleh rapor nabung.",
    "grades.ofBudget": ({ total, target, pct }) =>
      `${total} saka ${target} (${pct}%)`,
    "grades.ofAverage": ({ total, target, pct }) =>
      `${total} saka rata-rata ~${target}mu (${pct}%)`,
    "grades.averageNote":
      "Durung set budget Total — dinilai nganggo rata-rata boncos sasenanmu wae.",
    "grades.kept": ({ net, income, pct }) =>
      `Isih ${net} saka ${income} sing kok oleh (${pct}%)`,

    // Grade tier labels (spending: lower is better)
    "grade.spending.S": "Irit tenan. Kita salut. 🧎",
    "grade.spending.A": "Dukun budgeting tenan.",
    "grade.spending.B": "Aman. Dompetmu setuju.",
    "grade.spending.C": "Rada pedhes, tapi isih kuat.",
    "grade.spending.D": "Dompetmu wis arep demo iki.",
    "grade.spending.F": "Dompet seda. Kirim kembang. 💐",
    // Grade tier labels (savings: higher is better)
    "grade.savings.S": "Numpuk kaya naga. Respect. 🐉",
    "grade.savings.A": "Nabung tenanan, no cap.",
    "grade.savings.B": "Ana bantal dana sithik.",
    "grade.savings.C": "Impas thok. Mepet banget.",
    "grade.savings.D": "Boncos luwih gedhe tinimbang cuan. Waduh.",
    "grade.savings.F": "Tabungan diobong. Tulung mandheg. 🔥",

    // Budgets
    "budget.title": ({ month }) => `Budget · ${month}`,
    "budget.empty": "Durung set budget. Gawe siji ing ngisor kono.",
    "budget.overall": "Total",
    "budget.unknown": "Ora Cetha",
    "budget.removeAria": ({ name }) => `Busak budget ${name}`,
    "budget.over": ({ amount }) => `Kliwat ${amount}`,
    "budget.categoryAria": "Kategori budget",
    "budget.limitPlaceholder": ({ currency }) => `Watesan (${currency})`,
    "budget.set": "Set",

    // Recurring
    "recurring.title": "Transaksi Langganan",
    "recurring.empty": "Durung ana langganan. Gawe siji ing ngisor.",
    "recurring.paused": " · di-pause",
    "recurring.next": "sabanjure",
    "recurring.approxTitle":
      "Data libur taun iki durung ke-load, dadi tanggale bisa geser mengko.",
    "recurring.pause": "Pause",
    "recurring.resume": "Terus",
    "recurring.deleteAria": ({ name }) => `Busak langganan ${name}`,
    "recurring.typeAria": "Jinis langganan",
    "recurring.repeatsAria": "Mbaleni saben",
    "recurring.monthly": "Sasenan",
    "recurring.weekly": "Mingguan",
    "recurring.fallsOn": "Tiba ing",
    "recurring.anchor.dayOfWeek": "Dina tartamtu",
    "recurring.anchor.dayOfMonth": "Tanggal tartamtu",
    "recurring.anchor.firstWorkingDay": ({ unit }) =>
      `Dina kerja pisanan saben ${unit}`,
    "recurring.anchor.lastWorkingDay": ({ unit }) =>
      `Dina kerja pungkasan saben ${unit}`,
    "recurring.dayOfMonth": "Tanggal",
    "recurring.weekday": "Dina",
    "recurring.notePlaceholder": "cth. bayar kos",
    "recurring.helpBase": ({ unit }) =>
      `Otomatis dadi transaksi tenan saben ${unit}, pas app dibukak maneh.`,
    "recurring.helpClamp":
      "Tanggal 29–31 mundur menyang dina pungkasan sasi nek sasine luwih cendhak.",
    "recurring.helpWorkHoliday":
      "Dina kerja nglewati weekend lan libur nasional.",
    "recurring.helpWorkWeekend":
      "Dina kerja nglewati weekend thok — pilih kalender libur ing Utak-atik ben nglewati libur nasional pisan.",
    "recurring.helpEdit": ({ unit }) =>
      `Ngowahi aturan lagi kanggo ${unit} ngarep; sing saiki ora dibaleni.`,

    // describeSchedule
    "schedule.dayOfMonth": ({ day }) => `Tanggal ${day} saben sasi`,
    "schedule.dayOfWeek": ({ weekday }) => `Saben ${weekday}`,
    "schedule.firstWorkingDay": ({ unit }) => `Dina kerja pisanan saben ${unit}`,
    "schedule.lastWorkingDay": ({ unit }) => `Dina kerja pungkasan saben ${unit}`,
    "weekday.long.0": "Minggu",
    "weekday.long.1": "Senin",
    "weekday.long.2": "Selasa",
    "weekday.long.3": "Rebo",
    "weekday.long.4": "Kemis",
    "weekday.long.5": "Jumat",
    "weekday.long.6": "Setu",

    // Reports drawer
    "reports.title": "Rapor",
    "reports.closeAria": "Tutup rapor",
    "reports.empty":
      "Durung ana rapor. Bakal digawe otomatis saben minggu lan sasi sing rampung pas kowe lagi mbukak app.",
    "reports.week": "Minggu",
    "reports.month": "Sasi",
    "reports.changeTitle": "Owahan sisa dhuwit vs periode sadurunge",
    "reports.in": ({ amount }) => `${amount} mlebu`,
    "reports.out": ({ amount }) => `${amount} minggat`,

    // Report toast
    "period.weekly": "mingguan",
    "period.monthly": "sasenan",
    "toast.single": ({ period, label, net }) =>
      `Rapor ${period}mu kanggo ${label} wis dadi — sisa ${net}.`,
    "toast.multiple": ({ n }) => `${n} rapor anyar wis siap.`,
    "toast.view": "Deloki",
    "toast.dismiss": "Skip",

    // Update prompt
    "update.available": "Ana versi anyar Dompet Sat-Set iki.",
    "update.offlineReady": "Dompet Sat-Set wis siap dienggo offline.",
    "update.reload": "Reload",

    // Category manager
    "catMgr.colorAria": ({ name }) => `Warna ${name}`,
    "catMgr.iconAria": ({ name }) => `Ikon ${name}`,
    "catMgr.nameAria": "Jeneng kategori",
    "catMgr.deleteAria": ({ name }) => `Busak ${name}`,
    "catMgr.protectedTitle": "Kategori cadhangan default ora bisa dibusak",
    "catMgr.deleteTitle": "Busak kategori",
    "catMgr.newIconAria": "Ikon kategori anyar",
    "catMgr.newIconPlaceholder": "🙂",
    "catMgr.newNamePlaceholder": "Jeneng kategori anyar",

    // Appearance
    "appearance.language": "Basa",
    "appearance.mode": "Mode",
    "appearance.color": "Warna",
    "appearance.pattern": "Pola",
    "theme.mode.light": "Padhang",
    "theme.mode.dark": "Peteng",
    "theme.mode.system": "Melu Sistem",
    "theme.pattern.none": "Polos",
    "theme.pattern.dots": "Titik",
    "theme.pattern.grid": "Kothak",
    "theme.pattern.diagonal": "Miring",

    // Settings
    "settings.title": "Utak-atik",
    "settings.closeAria": "Tutup setelan",
    "settings.baseCurrency": "Dhuwit Utama",
    "settings.baseCurrencyHelp":
      "Total gabungan lan budget ditampilke nganggo dhuwit iki.",
    "settings.refresh": "Refresh",
    "rate.status.idle": "Durung ke-load",
    "rate.status.loading": "Ngenteni…",
    "rate.status.live": "Kurs live",
    "rate.status.cached": "Kurs kuno (offline)",
    "rate.status.error": "Kurs ora ana",
    "settings.appearance": "Tampilan",
    "settings.reports": "Rapor",
    "settings.notifOn": "Notif urip",
    "settings.notifBlocked": "Notif diblokir karo browsermu",
    "settings.notifUnsupported": "Notif ora bisa ing kene",
    "settings.notifOff": "Notif mati",
    "settings.turnOff": "Patenono",
    "settings.turnOn": "Uripono",
    "settings.enable": "Aktifke",
    "settings.reportsHelp":
      "Rapor digawe saben minggu lan sasi sing rampung. Amarga kabeh mlaku ing browser tanpa server, rapor metu pas kowe mbukak app maneh, dudu pas periodene rampung — ora ana sing keliwat, mung bisa telat sithik.",
    "settings.reportsHelpIos":
      " Browsermu ora nyediakke notif ing kene; nek ing iOS, tambahna app menyang home screen dhisik.",
    "settings.holidays": "Dina Libur",
    "settings.holidayCalendar": "Kalender libur",
    "settings.holidayNone": "Ora ana — dina kerja mung nglewati weekend",
    "settings.region": "Wilayah",
    "settings.regionNone": "Libur nasional wae",
    "holiday.status.off": "Durung milih kalender",
    "holiday.status.idle": "Durung ke-load",
    "holiday.status.loading": "Ngenteni…",
    "holiday.status.live": "Libur ke-load",
    "holiday.status.cached": "Libur kesimpen (offline)",
    "holiday.status.error": "Libur ora ana",
    "settings.holidayHelp":
      "Dienggo kanggo nyelehke langganan sing di-set menyang dina kerja pisanan/pungkasan minggu utawa sasi. Wilayah ditulis nganggo kode standar, lan mung metu nek duwe libur dhewe — nek duwekmu ora ana, tegese wis kecakup nasional.",
    "settings.expenseCategories": "Kategori Boncos",
    "settings.incomeCategories": "Kategori Cuan",
    "settings.data": "Data",
    "settings.about": "Babagan",
    "settings.aboutLine": ({ version }) => `Dompet Sat-Set · ${version}`,

    // Data controls
    "data.exportCsv": "⬇ Export CSV",
    "data.importCsv": "⬆ Import CSV",
    "data.exportBackup": "⬇ Export backup (JSON)",
    "data.restoreBackup": "⬆ Restore backup",
    "data.clearAll": "Busak Kabeh",
    "data.imported": ({ expenses, incomes }) =>
      `Sukses impor ${expenses} boncos, ${incomes} cuan.`,
    "data.skipped": ({ n }) => `${n} baris keliwat.`,
    "data.restoreConfirm":
      "Restore backup iki bakal nimpa kabeh transaksi, kategori, budget, rapor, lan setelan saiki. Terus?",
    "data.restored": "Backup ke-restore.",
    "data.clearConfirm":
      "Busak kabeh transaksi, budget, lan rapor, terus reset kategori? Ora bisa di-undo lho.",
    "data.cleared": "Kabeh data kebusak.",
    "data.help":
      "Kolom CSV: tanggal (YYYY-MM-DD), tipe (expense/income), nominal, dhuwit, kategori, cathetan. File tanpa kolom tipe di-impor dadi boncos. Backup JSON nyimpen kabeh — kalebu kategori, budget, rapor, lan setelan — lan restore nimpa kabeh data saiki.",

    // CSV / backup errors
    "csv.error.empty": "File-ne kothong.",
    "csv.error.missingColumns":
      'Kolom wajib ora ana: "date", "amount", "currency".',
    "csv.error.invalidDate": ({ row, value }) =>
      `Baris ${row}: tanggal ngawur "${value}".`,
    "csv.error.invalidAmount": ({ row }) => `Baris ${row}: nominal ngawur.`,
    "csv.error.missingCurrency": ({ row }) => `Baris ${row}: dhuwit kothong.`,
    "csv.error.unknownType": ({ row, value }) =>
      `Baris ${row}: tipe ora dikenal "${value}".`,
    "backup.error.json": "File-ne dudu JSON sing bener.",
    "backup.error.notBackup":
      "Iki kayane dudu file backup Dompet Sat-Set.",
    "backup.error.version": "Backup iki digawe nganggo versi sing ora didhukung.",
    "backup.error.missingData": "File backup ora ana datane.",
    "backup.error.malformed":
      "File backup rusak (bagiane ilang utawa ngawur).",
    "backup.error.malformedTx": "File backup duwe transaksi sing ngawur.",
    "backup.error.malformedCat": "File backup duwe kategori sing ngawur.",
    "backup.error.readFail": "Ora bisa maca file backup kuwi.",

    // Notifications
    "notify.singleTitle": ({ period }) => `Rapor ${period}mu wis dadi`,
    "notify.singleBody": ({ label, net, income, expense }) =>
      `${label}: sisa ${net} · ${income} mlebu, ${expense} minggat`,
    "notify.multiTitle": ({ n }) => `${n} rapor anyar wis siap`,

    // Analytics – period comparison
    "compare.title": "Sing owah",
    "compare.subtitle": "vs periode sadurunge",
    "compare.empty": "Durung ana periode sadurunge kanggo dibandhingake.",
    "compare.vsPrev": "vs periode sadurunge",
    "compare.vsPrevAmount": ({ amount }) => `${amount} vs periode sadurunge`,
    "compare.noChange": "tetep",
    "compare.new": "anyar",

    // Analytics – category drill-down
    "category.closeAria": "Tutup rincian kategori",
    "category.empty": "Durung ana belanja ing kategori iki periode iki.",
    "category.shareOfPeriod": ({ pct }) => `${pct}% saka belanja periode iki`,
    "category.transactions": "Transaksi",
    "category.avgPerTx": "Rata-rata / transaksi",
    "category.median": "Median",
    "category.largest": "Paling gedhe",
    "category.trendTitle": "Tren anyar",
    "category.topNotes": "Cathetan dhuwur",

    // Analytics – spend forecast
    "forecast.title": "Ramalan belanja",
    "forecast.subtitle": "Proyeksi saka laju saiki",
    "forecast.empty":
      "Ramalan katon yen minggu utawa sasi saiki wis mlaku.",
    "forecast.thisMonth": "Sasi iki",
    "forecast.thisWeek": "Minggu iki",
    "forecast.approx": "~kira-kira",
    "forecast.weekApproxTitle":
      "Lagi sawetara dina ing seminggu iku sampel cilik, dadi proyeksi mingguan gampang owah.",
    "forecast.projected": ({ amount }) => `Proyeksi ${amount}`,
    "forecast.over": ({ amount }) => `Luwih ${amount}`,
    "forecast.under": ({ amount }) => `Kurang ${amount}`,
    "forecast.onTrack": "Cocog dalan",
    "forecast.spentSoFar": ({ amount }) => `${amount} nganti saiki`,
    "forecast.dayOf": ({ day, total }) => `dina ${day} saka ${total}`,
    "forecast.vsBudget": ({ amount }) => `vs anggaran Sakabehe ${amount}`,
    "forecast.vsAverage": ({ amount }) => `vs rata-rata ${amount}`,

    // Analytics – daily heatmap
    "heatmap.title": "Belanja saben dina",
    "heatmap.subtitle": "26 minggu pungkasan · luwih peteng = luwih akeh",
    "heatmap.empty": "Cathet sawetara belanja kanggo ndeleng pola saben dinamu.",
    "heatmap.aria": "Peta panas kalender belanja saben dina",
    "heatmap.less": "Sithik",
    "heatmap.more": "Akeh",
  },

  defaultCategoryNames: {
    food: "Jajan & Mangan 🍜",
    transport: "Ngelencer 🚌",
    housing: "Panggonan Ngiyup 🏠",
    entertainment: "Healing & Seneng² 🎬",
    health: "Jaga Nyawa 💊",
    shopping: "Check Out Terus 🛍️",
    gaming: "Mabar Wae 🎮",
    other: "Liya-liya 📦",
    "inc-salary": "Gajian 💼",
    "inc-freelance": "Cuan Sampingan 🧑‍💻",
    "inc-investment": "Cuan Investasi 📈",
    "inc-gift": "Rejeki Nomplok 🎁",
    "inc-other": "Liya-liya 📦",
  },

  daytype: {
    noun: { workday: "dina kerja", dayoff: "dina nganggur" },
    single: {
      workday: [
        "Kabeh duit minggat pas dina kerja. Weekendmu paling liar mung nutup kabeh tab browser.",
        "100% boncos dina kerja. Setu Minggu ora metu sepeser — mencurigakke tenan.",
      ],
      dayoff: [
        "Kabeh boncosmu pas dina nganggur. Kerja kuwi mung panggonan pemulihan dompet.",
        "Saben boncos kuwi boncos dina libur. Senin-Jumat kartumu koma.",
      ],
    },
    even: [
      "Dina kerja lan dina nganggur boncose meh padha — dompetmu pancen ora iso maca kalender.",
      "Kejar-kejaran. Kerja utawa libur, duit minggat cepet kaya kilat.",
    ],
    dominant: [
      ({ top, other, ratio }) =>
        `Pas ${top}, boncos harianmu ${ratio}× ${other}. Dina liyane mung tabungan sing nyamar.`,
      ({ top, other, ratio }) =>
        `${top} mangan ${ratio}× tinimbang ${other}. Kuwi dudu pola blanja, kuwi kepribadian.`,
    ],
    lean: [
      ({ top, other }) =>
        `${top} rada ngalahke ${other} dadi dina termahalmu. Kalender wis apal kelemahanmu.`,
      ({ top }) =>
        `Kowe condhong boros pas ${top}. Wani tenan duwe dina favorit kanggo ngentekke duit.`,
    ],
    adviceSingle:
      "Cathet pirang dina maneh, mengko dadi duel dina kerja vs dina nganggur tenan.",
    adviceDominant: ({ top, ratio }) =>
      `Boncos harian ${top}mu ${ratio}× saka sisane — set siji angka "budget seneng²" ing ngarep biasane gawe dina kuwi jinak.`,
    adviceBalanced:
      "Dina kerja lan dina nganggurmu cukup imbang — siji budget sasenan total luwih mbantu tinimbang ndelengi kalender.",
    quipDayoff: [
      ({ name }) => `${name} kuwi boncos dina nganggur andhalanmu. No notes.`,
      ({ name }) =>
        `Pas dina nganggur, ${name} sing paling gawe boncos — lan dheweke ngerti kuwi.`,
    ],
    quipWorkday: ({ name }) => `${name} panggonan duit dina kerjamu bocor meneng-meneng.`,
  },
};
