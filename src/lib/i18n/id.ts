import type { TranslationDict } from "./types";

/**
 * Bahasa Indonesia — deliberately loose, funny, Jaksel/Gen-Z slang. Not a
 * literal translation; the vibe matters more than the dictionary. Meaning stays
 * recoverable so buttons still make sense.
 */
export const id: TranslationDict = {
  strings: {
    // App shell
    "app.title": "Dompet Sat-Set 💸",
    "app.tagline": "Pantau cuan lu harian, mingguan & bulanan",
    "app.reports": "📊 Rapor",
    "app.settings": "⚙ Atur-atur",
    "app.rateTitle": "Status kurs — pencet buat refresh",
    "rate.pill.idle": "Kurs",
    "rate.pill.loading": "Loading…",
    "rate.pill.live": "Kurs live ✨",
    "rate.pill.cached": "Kurs jadul",
    "rate.pill.error": "Kurs ngambek",

    // Shared field labels / actions
    "field.amount": "Nominal",
    "field.currency": "Mata Uang",
    "field.category": "Kategori",
    "field.date": "Tanggal",
    "common.note": "Catatan (bebas)",
    "common.amountPlaceholder": "0.00",
    "common.add": "Gaskeun",
    "common.uncategorized": "Gak Jelas",
    "kind.expense": "Boncos",
    "kind.income": "Cuan",
    "noun.expense": "pengeluaran",
    "noun.income": "pemasukan",
    "unit.week": "minggu",
    "unit.month": "bulan",
    "unit.plural.day": "hari",
    "unit.plural.week": "minggu",
    "unit.plural.month": "bulan",

    // Period selector
    "period.day": "Harian",
    "period.week": "Mingguan",
    "period.month": "Bulanan",
    "period.tablist": "Periode",
    "period.prev": "Periode sebelumnya",
    "period.next": "Periode selanjutnya",
    "period.today": "Hari Ini",

    // Summary cards
    "summary.net": ({ currency }) => `Sisa Cuan (${currency})`,
    "summary.income": "Duit Masuk",
    "summary.expenses": "Duit Kabur",
    "summary.byCurrency": "Boncos per mata uang",
    "summary.txCount": ({ n }) => `${n} transaksi`,
    "summary.currencyCount": ({ n }) => `${n} mata uang`,

    // Entry form
    "entryForm.addExpense": "Catat Boncos",
    "entryForm.addIncome": "Catat Cuan",
    "entryForm.editExpense": "Edit Boncos",
    "entryForm.editIncome": "Edit Cuan",
    "entryForm.quickAdd": "Tambah kilat",
    "entryForm.entryType": "Jenis catatan",
    "entryForm.notePlaceholderIncome": "cth. gajian bulan ini 🤑",
    "entryForm.notePlaceholderExpense": "cth. jajan bareng bestie",
    "entryForm.saveChanges": "Simpan deh",
    "entryForm.cancel": "Batal ah",

    // Entry list
    "list.transactions": ({ n }) => `Transaksi (${n})`,
    "list.filterAria": "Filter transaksi",
    "filter.all": "Semua",
    "filter.expense": "Boncos",
    "filter.income": "Cuan",
    "list.emptyAll": "Belum ada transaksi periode ini. Kalem dulu.",
    "list.emptyExpense": "Belum boncos periode ini, mantul.",
    "list.emptyIncome": "Belum ada cuan periode ini. Sabar ya bestie.",
    "list.viewAll": ({ n }) => `Liat semua ${n} transaksi`,

    // Entry item actions
    "item.duplicate": ({ noun }) => `Duplikat ${noun}`,
    "item.edit": ({ noun }) => `Edit ${noun}`,
    "item.delete": ({ noun }) => `Hapus ${noun}`,

    // All-entries drawer
    "allEntries.title": "Semua Transaksi",
    "allEntries.close": "Tutup semua transaksi",
    "allEntries.filterType": "Filter per jenis",
    "allEntries.searchPlaceholder": "Cari catatan, kategori, atau tanggal…",
    "allEntries.searchAria": "Cari transaksi",
    "allEntries.filterCategoryAria": "Filter per kategori",
    "allEntries.allCategories": "Semua kategori",
    "allEntries.from": "Dari",
    "allEntries.to": "Sampai",
    "allEntries.clearDates": "Reset rentang tanggal",
    "allEntries.count": ({ n }) => `${n} transaksi`,
    "allEntries.empty": "Gak ada yang cocok sama filter ini, bestie.",

    // Category chart
    "chart.byCategory": "Per Kategori",
    "chart.empty": "Belum ada boncos buat dijadiin grafik.",
    "chart.spendingAria": "Pengeluaran per kategori",
    "chart.total": "Total",

    // Day-type analytics
    "dayType.workdays": "Hari Kerja",
    "dayType.daysOff": "Hari Gabut",
    "dayType.title": "Kapan Lu Boncos",
    "dayType.subtitle": "Sepanjang masa · rata2 = per hari lu jajan",
    "dayType.empty":
      "Catat beberapa boncos dulu, nanti keliatan hari kerja vs hari gabut lu.",
    "dayType.approx": "~kira2",
    "dayType.approxTitle":
      "Beberapa boncos jatuh di tahun yang datanya belum ada, jadi ada libur yang mungkin kehitung hari kerja",
    "dayType.approxTitleShort":
      "Beberapa boncos jatuh di tahun yang datanya belum ada",
    "dayType.perDay": ({ money }) => `${money}/hari`,
    "dayType.days": ({ n, pct }) => `${n} hari · ${pct}%`,
    "dayType.viewAll": "Liat rincian lengkapnya →",
    "dayType.detailsSubtitle": "Rincian sepanjang masa",
    "dayType.closeAria": "Tutup rincian",
    "dayType.viewAria": "Tampilan rincian",
    "view.byCategory": "Per kategori",
    "view.byDayType": "Per jenis hari",
    "dayType.emptyRecorded": "Belum ada boncos tercatat.",
    "dayType.work": ({ money }) => `Kerja ${money}`,
    "dayType.off": ({ money }) => `Gabut ${money}`,
    "dayType.nothingHere": "Kosong melompong di sini.",

    // Trend chart
    "trend.title": "Tren Boncos",
    "trend.aria": ({ n, unit }) =>
      `Boncos ${n} ${unit} terakhir, per kategori`,

    // Month grades
    "grades.title": ({ month }) => `Rapor · ${month}`,
    "grades.spending": "Boncos",
    "grades.savings": "Nabung",
    "grades.vsAverage": "vs rata-rata boncos",
    "grades.vsBudget": "vs budget total",
    "grades.vsIncome": "vs pemasukan",
    "grades.spendingPending":
      "Set budget Total di bawah, atau balik lagi kalau bulan sebelumnya udah ada boncos buat dibandingin.",
    "grades.savingsPending":
      "Catat pemasukan bulan ini dulu biar dapet rapor nabung.",
    "grades.ofBudget": ({ total, target, pct }) =>
      `${total} dari ${target} (${pct}%)`,
    "grades.ofAverage": ({ total, target, pct }) =>
      `${total} dari rata-rata ~${target} lu (${pct}%)`,
    "grades.averageNote":
      "Belum set budget Total — dinilai pakai rata-rata boncos bulanan lu aja.",
    "grades.kept": ({ net, income, pct }) =>
      `Nyisa ${net} dari ${income} yang lu dapet (${pct}%)`,

    // Grade tier labels (spending: lower is better)
    "grade.spending.S": "Irit sultan. Kita salut sih. 🧎",
    "grade.spending.A": "Dukun budgeting fr fr.",
    "grade.spending.B": "Aman. Dompet lu approve.",
    "grade.spending.C": "Agak pedes, tapi masih survive.",
    "grade.spending.D": "Dompet lu udah mau demo nih.",
    "grade.spending.F": "Dompet wafat. Kirim bunga. 💐",
    // Grade tier labels (savings: higher is better)
    "grade.savings.S": "Nimbun kayak naga. Respect. 🐉",
    "grade.savings.A": "Nabung beneran, no cap.",
    "grade.savings.B": "Ada bantal dana dikit lah.",
    "grade.savings.C": "Impas doang. Mepet banget.",
    "grade.savings.D": "Boncos lebih gede dari cuan. Waduh.",
    "grade.savings.F": "Tabungan dibakar. Tolong stop. 🔥",

    // Budgets
    "budget.title": ({ month }) => `Budget · ${month}`,
    "budget.empty": "Belum set budget. Bikin satu di bawah gih.",
    "budget.overall": "Total",
    "budget.unknown": "Gak Jelas",
    "budget.removeAria": ({ name }) => `Hapus budget ${name}`,
    "budget.over": ({ amount }) => `Kelewat ${amount}`,
    "budget.categoryAria": "Kategori budget",
    "budget.limitPlaceholder": ({ currency }) => `Batas (${currency})`,
    "budget.set": "Set",

    // Recurring
    "recurring.title": "Transaksi Langganan",
    "recurring.empty": "Belum ada langganan. Bikin satu di bawah.",
    "recurring.paused": " · di-pause",
    "recurring.next": "berikutnya",
    "recurring.approxTitle":
      "Data libur tahun ini belum ke-load, jadi tanggalnya bisa geser nanti.",
    "recurring.pause": "Pause",
    "recurring.resume": "Lanjut",
    "recurring.deleteAria": ({ name }) => `Hapus langganan ${name}`,
    "recurring.typeAria": "Jenis langganan",
    "recurring.repeatsAria": "Ngulang tiap",
    "recurring.monthly": "Bulanan",
    "recurring.weekly": "Mingguan",
    "recurring.fallsOn": "Jatuh di",
    "recurring.anchor.dayOfWeek": "Hari tertentu",
    "recurring.anchor.dayOfMonth": "Tanggal tertentu",
    "recurring.anchor.firstWorkingDay": ({ unit }) =>
      `Hari kerja pertama tiap ${unit}`,
    "recurring.anchor.lastWorkingDay": ({ unit }) =>
      `Hari kerja terakhir tiap ${unit}`,
    "recurring.dayOfMonth": "Tanggal",
    "recurring.weekday": "Hari",
    "recurring.notePlaceholder": "cth. bayar kos",
    "recurring.helpBase": ({ unit }) =>
      `Otomatis jadi transaksi beneran tiap ${unit}, pas app dibuka lagi.`,
    "recurring.helpClamp":
      "Tanggal 29–31 mundur ke hari terakhir bulan kalau bulannya lebih pendek.",
    "recurring.helpWorkHoliday":
      "Hari kerja skip weekend sama libur nasional.",
    "recurring.helpWorkWeekend":
      "Hari kerja skip weekend doang — pilih kalender libur di Atur-atur biar skip libur nasional juga.",
    "recurring.helpEdit": ({ unit }) =>
      `Ngedit aturan baru ngefek ${unit} depan; yang sekarang gak diulang.`,

    // describeSchedule
    "schedule.dayOfMonth": ({ day }) => `Tanggal ${day} tiap bulan`,
    "schedule.dayOfWeek": ({ weekday }) => `Tiap ${weekday}`,
    "schedule.firstWorkingDay": ({ unit }) => `Hari kerja pertama tiap ${unit}`,
    "schedule.lastWorkingDay": ({ unit }) => `Hari kerja terakhir tiap ${unit}`,
    "weekday.long.0": "Minggu",
    "weekday.long.1": "Senin",
    "weekday.long.2": "Selasa",
    "weekday.long.3": "Rabu",
    "weekday.long.4": "Kamis",
    "weekday.long.5": "Jumat",
    "weekday.long.6": "Sabtu",

    // Reports drawer
    "reports.title": "Rapor",
    "reports.closeAria": "Tutup rapor",
    "reports.empty":
      "Belum ada rapor. Bakal dibikin otomatis tiap minggu sama bulan yang kelar pas lu lagi buka app.",
    "reports.week": "Minggu",
    "reports.month": "Bulan",
    "reports.changeTitle": "Perubahan sisa cuan vs periode sebelumnya",
    "reports.in": ({ amount }) => `${amount} masuk`,
    "reports.out": ({ amount }) => `${amount} kabur`,

    // Report toast
    "period.weekly": "mingguan",
    "period.monthly": "bulanan",
    "toast.single": ({ period, label, net }) =>
      `Rapor ${period} lu buat ${label} udah jadi — sisa ${net}.`,
    "toast.multiple": ({ n }) => `${n} rapor baru udah siap.`,
    "toast.view": "Liat",
    "toast.dismiss": "Skip",

    // Update prompt
    "update.available": "Ada versi baru Dompet Sat-Set nih.",
    "update.offlineReady": "Dompet Sat-Set udah siap dipake offline.",
    "update.reload": "Reload",

    // Category manager
    "catMgr.colorAria": ({ name }) => `Warna ${name}`,
    "catMgr.iconAria": ({ name }) => `Ikon ${name}`,
    "catMgr.nameAria": "Nama kategori",
    "catMgr.deleteAria": ({ name }) => `Hapus ${name}`,
    "catMgr.protectedTitle": "Kategori cadangan default gak bisa dihapus",
    "catMgr.deleteTitle": "Hapus kategori",
    "catMgr.newIconAria": "Ikon kategori baru",
    "catMgr.newIconPlaceholder": "🙂",
    "catMgr.newNamePlaceholder": "Nama kategori baru",

    // Appearance
    "appearance.language": "Bahasa",
    "appearance.mode": "Mode",
    "appearance.color": "Warna",
    "appearance.pattern": "Pola",
    "theme.mode.light": "Terang",
    "theme.mode.dark": "Gelap",
    "theme.mode.system": "Ikut Sistem",
    "theme.pattern.none": "Polos",
    "theme.pattern.dots": "Titik",
    "theme.pattern.grid": "Kotak",
    "theme.pattern.diagonal": "Miring",

    // Settings
    "settings.title": "Atur-atur",
    "settings.closeAria": "Tutup pengaturan",
    "settings.baseCurrency": "Mata Uang Utama",
    "settings.baseCurrencyHelp":
      "Total gabungan sama budget ditampilin pakai mata uang ini.",
    "settings.refresh": "Refresh",
    "rate.status.idle": "Belum ke-load",
    "rate.status.loading": "Loading…",
    "rate.status.live": "Kurs live",
    "rate.status.cached": "Kurs jadul (offline)",
    "rate.status.error": "Kurs gak tersedia",
    "settings.appearance": "Tampilan",
    "settings.reports": "Rapor",
    "settings.notifOn": "Notif nyala",
    "settings.notifBlocked": "Notif diblokir sama browser lu",
    "settings.notifUnsupported": "Notif gak bisa di sini",
    "settings.notifOff": "Notif mati",
    "settings.turnOff": "Matiin",
    "settings.turnOn": "Nyalain",
    "settings.enable": "Aktifin",
    "settings.reportsHelp":
      "Rapor dibikin tiap minggu sama bulan yang kelar. Karena semua jalan di browser tanpa server, rapor muncul pas lu buka app lagi, bukan pas periodenya kelar — gak ada yang keskip, cuma mungkin telat dikit.",
    "settings.reportsHelpIos":
      " Browser lu gak nyediain notif di sini; kalau di iOS, add app ke home screen dulu ya.",
    "settings.holidays": "Hari Libur",
    "settings.holidayCalendar": "Kalender libur",
    "settings.holidayNone": "Gak ada — hari kerja cuma skip weekend",
    "settings.region": "Wilayah",
    "settings.regionNone": "Libur nasional aja",
    "holiday.status.off": "Belum pilih kalender",
    "holiday.status.idle": "Belum ke-load",
    "holiday.status.loading": "Loading…",
    "holiday.status.live": "Libur ke-load",
    "holiday.status.cached": "Libur tersimpan (offline)",
    "holiday.status.error": "Libur gak tersedia",
    "settings.holidayHelp":
      "Dipake buat naruh langganan yang di-set ke hari kerja pertama/terakhir minggu atau bulan. Wilayah ditulis pakai kode standar, dan cuma muncul kalau punya libur sendiri — kalau punya lu gak ada, berarti udah kecakup nasional.",
    "settings.expenseCategories": "Kategori Boncos",
    "settings.incomeCategories": "Kategori Cuan",
    "settings.data": "Data",
    "settings.about": "Tentang",
    "settings.aboutLine": ({ version }) => `Dompet Sat-Set · ${version}`,

    // Data controls
    "data.exportCsv": "⬇ Export CSV",
    "data.importCsv": "⬆ Import CSV",
    "data.exportBackup": "⬇ Export backup (JSON)",
    "data.restoreBackup": "⬆ Restore backup",
    "data.clearAll": "Hapus Semua",
    "data.imported": ({ expenses, incomes }) =>
      `Berhasil impor ${expenses} boncos, ${incomes} cuan.`,
    "data.skipped": ({ n }) => `${n} baris keskip.`,
    "data.restoreConfirm":
      "Restore backup ini bakal nimpa semua transaksi, kategori, budget, rapor, sama pengaturan sekarang. Lanjut?",
    "data.restored": "Backup ke-restore.",
    "data.clearConfirm":
      "Hapus semua transaksi, budget, sama rapor, terus reset kategori? Gak bisa di-undo lho.",
    "data.cleared": "Semua data kehapus.",
    "data.help":
      "Kolom CSV: tanggal (YYYY-MM-DD), tipe (expense/income), nominal, mata uang, kategori, catatan. File tanpa kolom tipe di-impor sebagai boncos. Backup JSON nyimpen semuanya — termasuk kategori, budget, rapor, sama pengaturan — dan restore nimpa semua data sekarang.",

    // CSV / backup errors
    "csv.error.empty": "File-nya kosong.",
    "csv.error.missingColumns":
      'Kolom wajib gak ada: "date", "amount", "currency".',
    "csv.error.invalidDate": ({ row, value }) =>
      `Baris ${row}: tanggal ngaco "${value}".`,
    "csv.error.invalidAmount": ({ row }) => `Baris ${row}: nominal ngaco.`,
    "csv.error.missingCurrency": ({ row }) => `Baris ${row}: mata uang kosong.`,
    "csv.error.unknownType": ({ row, value }) =>
      `Baris ${row}: tipe gak dikenal "${value}".`,
    "backup.error.json": "File-nya bukan JSON yang bener.",
    "backup.error.notBackup":
      "Ini kayaknya bukan file backup Dompet Sat-Set deh.",
    "backup.error.version": "Backup ini dibikin pakai versi yang gak didukung.",
    "backup.error.missingData": "File backup gak ada datanya.",
    "backup.error.malformed":
      "File backup rusak (bagiannya ilang atau ngaco).",
    "backup.error.malformedTx": "File backup punya transaksi yang ngaco.",
    "backup.error.malformedCat": "File backup punya kategori yang ngaco.",
    "backup.error.readFail": "Gak bisa baca file backup itu.",

    // Notifications
    "notify.singleTitle": ({ period }) => `Rapor ${period} lu udah jadi`,
    "notify.singleBody": ({ label, net, income, expense }) =>
      `${label}: sisa ${net} · ${income} masuk, ${expense} kabur`,
    "notify.multiTitle": ({ n }) => `${n} rapor baru udah siap`,
  },

  defaultCategoryNames: {
    food: "Jajan & Kulineran 🍜",
    transport: "Ngamen Jalanan 🚌",
    housing: "Tempat Berteduh 🏠",
    entertainment: "Healing & Senang² 🎬",
    health: "Jaga Nyawa 💊",
    shopping: "Check Out Terus 🛍️",
    gaming: "Mabar Terus 🎮",
    other: "Lain-lain 📦",
    "inc-salary": "Gajian 💼",
    "inc-freelance": "Cuan Sampingan 🧑‍💻",
    "inc-investment": "Cuan Investasi 📈",
    "inc-gift": "Rejeki Nomplok 🎁",
    "inc-other": "Lain-lain 📦",
  },

  daytype: {
    noun: { workday: "hari kerja", dayoff: "hari gabut" },
    single: {
      workday: [
        "Semua duit kabur pas hari kerja. Weekend lu paling liar cuma nutup semua tab browser.",
        "100% boncos hari kerja. Sabtu Minggu gak keluar sepeser pun — mencurigakan banget.",
      ],
      dayoff: [
        "Semua boncos lu pas hari gabut. Kerja tuh cuma tempat pemulihan dompet.",
        "Tiap boncos itu boncos hari libur. Senin-Jumat kartu lu koma.",
      ],
    },
    even: [
      "Hari kerja sama hari gabut boncosnya mirip banget — dompet lu emang gak bisa baca kalender.",
      "Ketat-ketatan. Kerja atau libur, duit kabur secepat kilat.",
    ],
    dominant: [
      ({ top, other, ratio }) =>
        `Pas ${top}, boncos harian lu ${ratio}× ${other}. Hari lainnya mah tabungan nyamar doang.`,
      ({ top, other, ratio }) =>
        `${top} makan ${ratio}× lipat dari ${other}. Itu mah bukan pola belanja, itu kepribadian.`,
    ],
    lean: [
      ({ top, other }) =>
        `${top} sedikit ngalahin ${other} jadi hari termahal lu. Kalender udah hafal kelemahan lu.`,
      ({ top }) =>
        `Lu condong boros pas ${top}. Berani banget punya hari favorit buat ngeboncosin duit.`,
    ],
    adviceSingle:
      "Catat beberapa hari lagi, nanti jadi duel hari kerja vs hari gabut beneran.",
    adviceDominant: ({ top, ratio }) =>
      `Boncos harian ${top} lu ${ratio}× dari sisanya — set satu angka "budget senang²" di depan biasanya bikin hari itu jinak.`,
    adviceBalanced:
      "Hari kerja sama hari gabut lu cukup seimbang — satu budget bulanan total lebih ngebantu daripada mantengin kalender.",
    quipDayoff: [
      ({ name }) => `${name} itu boncos hari gabut andalan lu. No notes.`,
      ({ name }) =>
        `Pas hari gabut, ${name} yang paling bikin boncos — dan dia sadar itu.`,
    ],
    quipWorkday: ({ name }) => `${name} tempat duit hari kerja lu bocor diam-diam.`,
  },
};
