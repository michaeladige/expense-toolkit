import type { TranslationDict } from "./types";

/**
 * English — the source of truth and fallback. Every key that exists anywhere
 * must exist here; `id`/`jv` may omit keys and they resolve back to these.
 */
export const en: TranslationDict = {
  strings: {
    // App shell
    "app.title": "Expense Toolkit",
    "app.tagline": "Track spending across day, week & month",
    "app.reports": "📊 Reports",
    "app.settings": "⚙ Settings",
    "app.rateTitle": "Exchange-rate status — click to refresh",
    "rate.pill.idle": "Rates",
    "rate.pill.loading": "Updating…",
    "rate.pill.live": "Live rates",
    "rate.pill.cached": "Cached rates",
    "rate.pill.error": "Rates offline",

    // Shared field labels / actions
    "field.amount": "Amount",
    "field.currency": "Currency",
    "field.category": "Category",
    "field.date": "Date",
    "common.note": "Note (optional)",
    "common.amountPlaceholder": "0.00",
    "common.add": "Add",
    "common.uncategorized": "Uncategorized",
    "kind.expense": "Expense",
    "kind.income": "Income",
    "noun.expense": "expense",
    "noun.income": "income",
    "unit.week": "week",
    "unit.month": "month",
    "unit.plural.day": "days",
    "unit.plural.week": "weeks",
    "unit.plural.month": "months",

    // Period selector
    "period.day": "Day",
    "period.week": "Week",
    "period.month": "Month",
    "period.tablist": "Period",
    "period.prev": "Previous period",
    "period.next": "Next period",
    "period.today": "Today",

    // Summary cards
    "summary.net": ({ currency }) => `Net (${currency})`,
    "summary.income": "Income",
    "summary.expenses": "Expenses",
    "summary.byCurrency": "Expenses by currency",
    "summary.txCount": ({ n }) => `${n} transaction${n === 1 ? "" : "s"}`,
    "summary.currencyCount": ({ n }) => `${n} currencies`,

    // Entry form
    "entryForm.addExpense": "Add expense",
    "entryForm.addIncome": "Add income",
    "entryForm.editExpense": "Edit expense",
    "entryForm.editIncome": "Edit income",
    "entryForm.quickAdd": "Quick add",
    "entryForm.entryType": "Entry type",
    "entryForm.notePlaceholderIncome": "e.g. March salary",
    "entryForm.notePlaceholderExpense": "e.g. Lunch with team",
    "entryForm.saveChanges": "Save changes",
    "entryForm.cancel": "Cancel",

    // Entry list
    "list.transactions": ({ n }) => `Transactions (${n})`,
    "list.filterAria": "Filter transactions",
    "filter.all": "All",
    "filter.expense": "Expenses",
    "filter.income": "Income",
    "list.emptyAll": "No transactions in this period yet.",
    "list.emptyExpense": "No expenses in this period yet.",
    "list.emptyIncome": "No income in this period yet.",
    "list.viewAll": ({ n }) => `View all ${n} transactions`,

    // Entry item actions
    "item.duplicate": ({ noun }) => `Duplicate ${noun}`,
    "item.edit": ({ noun }) => `Edit ${noun}`,
    "item.delete": ({ noun }) => `Delete ${noun}`,

    // All-entries drawer
    "allEntries.title": "All transactions",
    "allEntries.close": "Close all transactions",
    "allEntries.filterType": "Filter by type",
    "allEntries.searchPlaceholder": "Search note, category or date…",
    "allEntries.searchAria": "Search transactions",
    "allEntries.filterCategoryAria": "Filter by category",
    "allEntries.allCategories": "All categories",
    "allEntries.from": "From",
    "allEntries.to": "To",
    "allEntries.clearDates": "Clear date range",
    "allEntries.count": ({ n }) => `${n} transaction${n === 1 ? "" : "s"}`,
    "allEntries.empty": "No transactions match these filters.",

    // Category chart
    "chart.byCategory": "By category",
    "chart.empty": "No spending to chart in this period.",
    "chart.spendingAria": "Spending by category",
    "chart.total": "Total",

    // Day-type analytics
    "dayType.workdays": "Workdays",
    "dayType.daysOff": "Days off",
    "dayType.title": "When you spend",
    "dayType.subtitle": "All-time · avg = per day you spent",
    "dayType.empty":
      "Log a few expenses and you'll see how your workdays and days off compare.",
    "dayType.approx": "~approx",
    "dayType.approxTitle":
      "Some expenses fall outside the years we have holiday data for, so a few holidays may be counted as workdays",
    "dayType.approxTitleShort":
      "Some expenses fall outside the years we have holiday data for",
    "dayType.perDay": ({ money }) => `${money}/day`,
    "dayType.days": ({ n, pct }) => `${n} day${n === 1 ? "" : "s"} · ${pct}%`,
    "dayType.viewAll": "See the full breakdown →",
    "dayType.detailsSubtitle": "All-time breakdown",
    "dayType.closeAria": "Close breakdown",
    "dayType.viewAria": "Breakdown view",
    "view.byCategory": "By category",
    "view.byDayType": "By day type",
    "dayType.emptyRecorded": "No spending recorded yet.",
    "dayType.work": ({ money }) => `Work ${money}`,
    "dayType.off": ({ money }) => `Off ${money}`,
    "dayType.nothingHere": "Nothing here yet.",

    // Trend chart
    "trend.title": "Spending trend",
    "trend.aria": ({ n, unit }) =>
      `Spending over the last ${n} ${unit}, by category`,

    // Month grades
    "grades.title": ({ month }) => `Grades · ${month}`,
    "grades.spending": "Spending",
    "grades.savings": "Savings",
    "grades.vsAverage": "vs Average spend",
    "grades.vsBudget": "vs Overall budget",
    "grades.vsIncome": "vs Income",
    "grades.spendingPending":
      "Nothing to grade yet. Set an Overall budget below, or log a full month before we judge you.",
    "grades.savingsPending":
      "No income logged, so there's nothing to grade. Fix that first.",
    "grades.ofBudget": ({ total, target, pct }) =>
      `${total} of ${target} (${pct}%)`,
    "grades.ofAverage": ({ total, target, pct }) =>
      `${total} of your ~${target} average (${pct}%)`,
    "grades.averageNote":
      "No budget set, so you're graded against your own average. The bar is you.",
    "grades.kept": ({ net, income, pct }) =>
      `Kept ${net} of ${income} earned (${pct}%)`,

    // Grade tier labels (spending: lower is better)
    "grade.spending.S": "Barely spent a thing. Don't let it go to your head.",
    "grade.spending.A": "Tight month. Now do it again — no coasting.",
    "grade.spending.B": "\"Fine\" isn't a flex. Tighten up.",
    "grade.spending.C": "Sloppy — and you know exactly which purchase did it.",
    "grade.spending.D": "This is a problem, and the problem is you.",
    "grade.spending.F": "Put the card down and walk away. Now.",
    // Grade tier labels (savings: higher is better)
    "grade.savings.S": "Hoarding hard. Don't you dare relax.",
    "grade.savings.A": "Actually saving. Prove it wasn't a fluke.",
    "grade.savings.B": "Thin cushion. Thin won't catch you.",
    "grade.savings.C": "Breaking even is just losing in slow motion.",
    "grade.savings.D": "Spending money you don't have. Stop it.",
    "grade.savings.F": "You're torching the savings. Cut it out.",

    // Budgets
    "budget.title": ({ month }) => `Budgets · ${month}`,
    "budget.empty": "No budgets set. Add one below.",
    "budget.overall": "Overall",
    "budget.unknown": "Unknown",
    "budget.removeAria": ({ name }) => `Remove ${name} budget`,
    "budget.over": ({ amount }) => `Over by ${amount}`,
    "budget.categoryAria": "Budget category",
    "budget.limitPlaceholder": ({ currency }) => `Limit (${currency})`,
    "budget.set": "Set",

    // Recurring
    "recurring.title": "Recurring transactions",
    "recurring.empty": "No recurring transactions yet. Add one below.",
    "recurring.paused": " · paused",
    "recurring.next": "next",
    "recurring.approxTitle":
      "Holiday data for this year isn't loaded, so the date may shift once it is.",
    "recurring.pause": "Pause",
    "recurring.resume": "Resume",
    "recurring.deleteAria": ({ name }) => `Delete ${name} recurring rule`,
    "recurring.typeAria": "Recurring type",
    "recurring.repeatsAria": "Repeats",
    "recurring.monthly": "Monthly",
    "recurring.weekly": "Weekly",
    "recurring.fallsOn": "Falls on",
    "recurring.anchor.dayOfWeek": "A specific weekday",
    "recurring.anchor.dayOfMonth": "A specific day of the month",
    "recurring.anchor.firstWorkingDay": ({ unit }) =>
      `First working day of ${unit}`,
    "recurring.anchor.lastWorkingDay": ({ unit }) =>
      `Last working day of ${unit}`,
    "recurring.dayOfMonth": "Day of month",
    "recurring.weekday": "Weekday",
    "recurring.notePlaceholder": "e.g. Rent",
    "recurring.helpBase": ({ unit }) =>
      `Materializes as a real transaction each ${unit}, next time the app is open.`,
    "recurring.helpClamp":
      "Day 29–31 falls back to the month's last day when it's shorter.",
    "recurring.helpWorkHoliday":
      "Working days skip weekends and public holidays.",
    "recurring.helpWorkWeekend":
      "Working days skip weekends only — pick a holiday calendar in Settings to also skip public holidays.",
    "recurring.helpEdit": ({ unit }) =>
      `Editing a rule takes effect from the next ${unit}; the current one is never re-applied.`,

    // describeSchedule
    "schedule.dayOfMonth": ({ day }) => `Day ${day} of month`,
    "schedule.dayOfWeek": ({ weekday }) => `Every ${weekday}`,
    "schedule.firstWorkingDay": ({ unit }) => `First working day of ${unit}`,
    "schedule.lastWorkingDay": ({ unit }) => `Last working day of ${unit}`,
    "weekday.long.0": "Sunday",
    "weekday.long.1": "Monday",
    "weekday.long.2": "Tuesday",
    "weekday.long.3": "Wednesday",
    "weekday.long.4": "Thursday",
    "weekday.long.5": "Friday",
    "weekday.long.6": "Saturday",

    // Reports drawer
    "reports.title": "Reports",
    "reports.closeAria": "Close reports",
    "reports.empty":
      "No reports yet — nothing's finished for us to judge. Give it a week.",
    "reports.week": "Week",
    "reports.month": "Month",
    "reports.changeTitle": "Change in net vs the previous period",
    "reports.in": ({ amount }) => `${amount} in`,
    "reports.out": ({ amount }) => `${amount} out`,

    // Report toast
    "period.weekly": "weekly",
    "period.monthly": "monthly",
    "toast.single": ({ period, label, net }) =>
      `Your ${period} report for ${label} landed: ${net} net. No hiding from it now.`,
    "toast.multiple": ({ n }) => `${n} new reports. Time to face the numbers.`,
    "toast.view": "View",
    "toast.dismiss": "Dismiss",

    // Update prompt
    "update.available": "A new version of Expense Toolkit is available.",
    "update.offlineReady": "Expense Toolkit is ready to work offline.",
    "update.reload": "Reload",

    // Category manager
    "catMgr.colorAria": ({ name }) => `${name} color`,
    "catMgr.iconAria": ({ name }) => `${name} icon`,
    "catMgr.nameAria": "Category name",
    "catMgr.deleteAria": ({ name }) => `Delete ${name}`,
    "catMgr.protectedTitle": "The default fallback category can't be deleted",
    "catMgr.deleteTitle": "Delete category",
    "catMgr.newIconAria": "New category icon",
    "catMgr.newIconPlaceholder": "🙂",
    "catMgr.newNamePlaceholder": "New category name",

    // Appearance
    "appearance.language": "Language",
    "appearance.mode": "Mode",
    "appearance.color": "Color",
    "appearance.pattern": "Pattern",
    "theme.mode.light": "Light",
    "theme.mode.dark": "Dark",
    "theme.mode.system": "System",
    "theme.pattern.none": "None",
    "theme.pattern.dots": "Dots",
    "theme.pattern.grid": "Grid",
    "theme.pattern.diagonal": "Diagonal",

    // Settings
    "settings.title": "Settings",
    "settings.closeAria": "Close settings",
    "settings.baseCurrency": "Base currency",
    "settings.baseCurrencyHelp":
      "Combined totals and budgets are shown in this currency.",
    "settings.refresh": "Refresh",
    "rate.status.idle": "Not loaded",
    "rate.status.loading": "Updating…",
    "rate.status.live": "Live rates",
    "rate.status.cached": "Cached rates (offline)",
    "rate.status.error": "Rates unavailable",
    "settings.appearance": "Appearance",
    "settings.reports": "Reports",
    "settings.notifOn": "Notifications on",
    "settings.notifBlocked": "Notifications blocked in your browser",
    "settings.notifUnsupported": "Notifications unavailable here",
    "settings.notifOff": "Notifications off",
    "settings.turnOff": "Turn off",
    "settings.turnOn": "Turn on",
    "settings.enable": "Enable",
    "settings.reportsHelp":
      "A report is written for each week and month that finishes. Because everything runs in your browser with no server, reports are produced the next time you open the app rather than at the moment the period ends — nothing is ever skipped, it may just arrive late.",
    "settings.reportsHelpIos":
      " Your browser doesn't offer notifications here; on iOS, add the app to your home screen first.",
    "settings.holidays": "Holidays",
    "settings.holidayCalendar": "Holiday calendar",
    "settings.holidayNone": "None — working days skip weekends only",
    "settings.region": "Region",
    "settings.regionNone": "Nationwide holidays only",
    "holiday.status.off": "No calendar selected",
    "holiday.status.idle": "Not loaded",
    "holiday.status.loading": "Updating…",
    "holiday.status.live": "Holidays loaded",
    "holiday.status.cached": "Saved holidays (offline)",
    "holiday.status.error": "Holidays unavailable",
    "settings.holidayHelp":
      "Used to place recurring transactions set to the first or last working day of a week or month. Regions are listed by their standard code, and only appear if they have holidays of their own — if yours isn't there, its holidays are already covered nationwide.",
    "settings.expenseCategories": "Expense categories",
    "settings.incomeCategories": "Income categories",
    "settings.data": "Data",
    "settings.about": "About",
    "settings.aboutLine": ({ version }) => `Expense Toolkit · ${version}`,

    // Data controls
    "data.exportCsv": "⬇ Export CSV",
    "data.importCsv": "⬆ Import CSV",
    "data.exportBackup": "⬇ Export backup (JSON)",
    "data.restoreBackup": "⬆ Restore backup",
    "data.clearAll": "Clear all",
    "data.imported": ({ expenses, incomes }) =>
      `Imported ${expenses} expense(s), ${incomes} income(s).`,
    "data.skipped": ({ n }) => `${n} row(s) skipped.`,
    "data.restoreConfirm":
      "Restoring this backup will replace all current transactions, categories, budgets, reports and settings. Continue?",
    "data.restored": "Backup restored.",
    "data.clearConfirm":
      "Delete all transactions, budgets and reports, and reset categories? This can't be undone.",
    "data.cleared": "All data cleared.",
    "data.help":
      "CSV columns: date (YYYY-MM-DD), type (expense/income), amount, currency, category, note. Files without a type column import as expenses. The JSON backup captures everything — including categories, budgets, reports and settings — and a restore replaces all current data.",

    // CSV / backup errors
    "csv.error.empty": "File is empty.",
    "csv.error.missingColumns":
      'Missing required columns: "date", "amount", "currency".',
    "csv.error.invalidDate": ({ row, value }) =>
      `Row ${row}: invalid date "${value}".`,
    "csv.error.invalidAmount": ({ row }) => `Row ${row}: invalid amount.`,
    "csv.error.missingCurrency": ({ row }) => `Row ${row}: missing currency.`,
    "csv.error.unknownType": ({ row, value }) =>
      `Row ${row}: unknown type "${value}".`,
    "backup.error.json": "That file isn't valid JSON.",
    "backup.error.notBackup":
      "That doesn't look like an Expense Toolkit backup file.",
    "backup.error.version": "This backup was made with an unsupported version.",
    "backup.error.missingData": "Backup file is missing its data.",
    "backup.error.malformed":
      "Backup file is malformed (missing or invalid sections).",
    "backup.error.malformedTx": "Backup file has malformed transactions.",
    "backup.error.malformedCat": "Backup file has malformed categories.",
    "backup.error.readFail": "Could not read that backup file.",

    // Notifications
    "notify.singleTitle": ({ period }) => `Your ${period} report is in. Brace yourself`,
    "notify.singleBody": ({ label, net, income, expense }) =>
      `${label}: ${net} net · ${income} in, ${expense} out`,
    "notify.multiTitle": ({ n }) => `${n} reports waiting. No dodging them`,

    // Analytics – period comparison
    "compare.title": "What changed",
    "compare.subtitle": "vs your previous period",
    "compare.empty": "No previous period to compare against yet.",
    "compare.vsPrev": "vs previous period",
    "compare.vsPrevAmount": ({ amount }) => `${amount} vs previous period`,
    "compare.noChange": "no change",
    "compare.new": "new",

    // Analytics – category drill-down
    "category.closeAria": "Close category details",
    "category.empty": "No spending in this category this period.",
    "category.shareOfPeriod": ({ pct }) => `${pct}% of this period's spending`,
    "category.transactions": "Transactions",
    "category.avgPerTx": "Avg / transaction",
    "category.median": "Median",
    "category.largest": "Largest",
    "category.trendTitle": "Recent trend",
    "category.topNotes": "Top notes",

    // Analytics – spend forecast
    "forecast.title": "Spending forecast",
    "forecast.subtitle": "Projected at your current pace",
    "forecast.empty":
      "Your forecast appears once the current week or month is underway.",
    "forecast.thisMonth": "This month",
    "forecast.thisWeek": "This week",
    "forecast.approx": "~rough",
    "forecast.weekApproxTitle":
      "A few days into a week is a small sample, so the weekly projection swings a lot.",
    "forecast.projected": ({ amount }) => `Projected ${amount}`,
    "forecast.over": ({ amount }) => `Over by ${amount}`,
    "forecast.under": ({ amount }) => `Under by ${amount}`,
    "forecast.onTrack": "On track",
    "forecast.spentSoFar": ({ amount }) => `${amount} so far`,
    "forecast.dayOf": ({ day, total }) => `day ${day} of ${total}`,
    "forecast.vsBudget": ({ amount }) => `vs ${amount} Overall budget`,
    "forecast.vsAverage": ({ amount }) => `vs ${amount} average`,

    // Analytics – daily heatmap
    "heatmap.title": "Daily spending",
    "heatmap.subtitle": "Last 26 weeks · darker = more",
    "heatmap.empty": "Log some expenses to see your daily spending pattern.",
    "heatmap.aria": "Calendar heatmap of daily spending",
    "heatmap.less": "Less",
    "heatmap.more": "More",

    // Mobile nav / menu
    "menu.open": "Menu",
    "menu.jumpTo": "Jump to",
    "menu.expandAll": "Expand all",
    "menu.collapseAll": "Collapse all",
    "menu.transactions": "Transactions",
    "menu.budgets": "Budgets",
    "menu.grades": "Grades",
  },

  defaultCategoryNames: {
    food: "Food & Dining",
    transport: "Transport",
    housing: "Housing",
    entertainment: "Entertainment",
    health: "Health",
    shopping: "Shopping",
    gaming: "Gaming",
    other: "Other",
    "inc-salary": "Salary",
    "inc-freelance": "Freelance",
    "inc-investment": "Investments",
    "inc-gift": "Gifts",
    "inc-other": "Other",
  },

  daytype: {
    noun: { workday: "workdays", dayoff: "days off" },
    single: {
      workday: [
        "Every dollar lands on a workday. Your idea of a wild weekend is closing all the browser tabs.",
        "100% workday spending. Saturdays and Sundays cost you literally nothing — deeply suspicious.",
      ],
      dayoff: [
        "All your spending happens on days off. Work is just where you recover from your wallet.",
        "Every expense is a day-off expense. Monday to Friday your card is basically in a coma.",
      ],
    },
    even: [
      "Workdays and days off cost you almost exactly the same — your wallet genuinely cannot read a calendar.",
      "Neck and neck. Working or free, the money escapes at the same heroic speed.",
    ],
    dominant: [
      ({ top, other, ratio }) =>
        `On ${top} your day-rate is ${ratio}× your ${other}. The other days are just savings in a trench coat.`,
      ({ top, other, ratio }) =>
        `${top} cost ${ratio}× what ${other} do. That's not a spending pattern, that's a whole personality.`,
    ],
    lean: [
      ({ top, other }) =>
        `${top} edge out ${other} as your pricier day type. The calendar has learned your weaknesses.`,
      ({ top }) =>
        `You lean toward spending on ${top}. Bold of you to have a favorite kind of day to hemorrhage money.`,
    ],
    adviceSingle:
      "Log a few more days before we can properly call you out.",
    adviceDominant: ({ top, ratio }) =>
      `Your ${top} run ${ratio}× the rest. Set a hard fun-budget and actually stick to it for once.`,
    adviceBalanced:
      "Evenly leaky everywhere. One monthly budget and a little restraint would fix it.",
    quipDayoff: [
      ({ name }) => `${name} is your signature day-off splurge. No notes.`,
      ({ name }) =>
        `On your days off, ${name} does the most damage — and it knows it.`,
    ],
    quipWorkday: ({ name }) => `${name} is where your workdays quietly leak money.`,
  },
};
