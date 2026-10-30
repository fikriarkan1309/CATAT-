import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Account,
  Category,
  Transaction,
  Budget,
  SharedGoal,
  RecurringBill,
  DebtItem,
} from '../types/finance';

export interface ExportReportOptions {
  // Rentang Tanggal Global
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  periodLabel: string; // e.g., '1 Okt 2026 - 10 Okt 2026'

  // Modul yang dipilih
  modules: {
    summary: boolean;
    accounts: boolean;
    savings: boolean;
    budgets: boolean;
    bills: boolean;
    debts: boolean;
    transactions: boolean;
  };

  // Sub-pengaturan tiap modul
  settings: {
    // 1. Ringkasan
    summaryIncludeTopCategories: boolean;
    summaryIncludeSavingsRatio: boolean;

    // 2. Rekening
    accountsFilter: 'all' | 'selected';
    selectedAccountIds: string[];

    // 3. Target Tabungan
    savingsFilter: 'all' | 'ongoing'; // 'all' or only active < 100%

    // 4. Alokasi Anggaran
    budgetsFilter: 'all' | 'overbudget_only';

    // 5. Tagihan Rutin
    billsFilter: 'all' | 'unpaid_only';
    billsMonthKey: string; // 'YYYY-MM'

    // 6. Hutang & Piutang
    debtsFilter: 'all' | 'debts_only' | 'receivables_only';
    debtsStatusFilter: 'all' | 'unpaid_only';

    // 7. Transaksi
    transactionsTypeFilter: 'all' | 'expense' | 'income' | 'transfer';
    transactionsSort: 'desc' | 'asc'; // terbaru di atas (desc) atau terlama (asc)
    transactionsAccountId: 'all' | string;
  };

  // Info pengguna / kop
  userName?: string;
  workspaceName?: string;
}

export const formatRupiahPDF = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDatePDF = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const generateFinancialPDF = async (
  options: ExportReportOptions,
  data: {
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
    budgets: Budget[];
    goals: SharedGoal[];
    bills: RecurringBill[];
    debts: DebtItem[];
  }
): Promise<{ blob: Blob; filename: string }> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const categoryMap = new Map<string, Category>(data.categories.map((c) => [c.id, c]));
  const accountMap = new Map<string, Account>(data.accounts.map((a) => [a.id, a]));

  // Brand Colors
  const PRIMARY_BLUE = [1, 112, 213] as [number, number, number]; // #0170d5
  const DARK_SLATE = [15, 23, 42] as [number, number, number]; // #0f172a
  const MUTED_GRAY = [100, 116, 139] as [number, number, number]; // #64748b
  const EMERALD_GREEN = [16, 185, 129] as [number, number, number]; // #10b981
  const ROSE_RED = [225, 29, 72] as [number, number, number]; // #e11d48

  // Helper check for new page needed
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Helper Section Header with colored indicator bar
  const drawSectionHeader = (title: string, subtitle?: string) => {
    checkPageBreak(18);
    currentY += 4;
    doc.setFillColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.rect(margin, currentY, 3.5, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(DARK_SLATE[0], DARK_SLATE[1], DARK_SLATE[2]);
    doc.text(title, margin + 6, currentY + 6.5);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
      doc.text(subtitle, pageWidth - margin, currentY + 6.5, { align: 'right' });
    }

    currentY += 12;
  };

  // =========================================================================
  // 1. KOP DOKUMEN / HEADER LAPORAN
  // =========================================================================
  // Header background banner
  doc.setFillColor(240, 249, 255); // sky-50
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 3, 3, 'F');
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 3, 3, 'S');

  // App Title / Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
  doc.text('Catatin!', margin + 6, currentY + 9);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(DARK_SLATE[0], DARK_SLATE[1], DARK_SLATE[2]);
  doc.text('LAPORAN KEUANGAN KELUARGA', margin + 6, currentY + 16);

  // Subtitle / Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
  doc.text(`Periode: ${options.periodLabel}`, margin + 6, currentY + 22);

  // Right Side: Print Date & User
  const printTimeStr = new Date().toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Dicetak: ${printTimeStr} WIB`, pageWidth - margin - 6, currentY + 11, {
    align: 'right',
  });
  if (options.userName) {
    doc.text(`Oleh: ${options.userName}`, pageWidth - margin - 6, currentY + 17, {
      align: 'right',
    });
  }
  doc.text('Dokumen Resmi Catatin!', pageWidth - margin - 6, currentY + 22, {
    align: 'right',
  });

  currentY += 34;

  // Filter Transactions for Summary & Transactions Module
  const startMs = new Date(options.startDate + 'T00:00:00').getTime();
  const endMs = new Date(options.endDate + 'T23:59:59').getTime();

  const filteredTransactions = data.transactions.filter((tx) => {
    if (tx.isDeleted) return false;
    const txMs = new Date(tx.transactionDate).getTime();
    if (isNaN(txMs)) return false;
    if (txMs < startMs || txMs > endMs) return false;

    // Filter type
    if (
      options.settings.transactionsTypeFilter !== 'all' &&
      tx.type !== options.settings.transactionsTypeFilter
    ) {
      return false;
    }

    // Filter account
    if (
      options.settings.transactionsAccountId !== 'all' &&
      tx.accountId !== options.settings.transactionsAccountId &&
      tx.targetAccountId !== options.settings.transactionsAccountId
    ) {
      return false;
    }

    return true;
  });

  // Calculate Income, Expense, Surplus in selected period
  let periodIncome = 0;
  let periodExpense = 0;
  const categoryExpenseMap = new Map<string, number>();

  filteredTransactions.forEach((tx) => {
    if (tx.type === 'income') {
      periodIncome += tx.amount;
    } else if (tx.type === 'expense') {
      periodExpense += tx.amount;
      const catName = categoryMap.get(tx.categoryId)?.name || 'Lainnya';
      categoryExpenseMap.set(catName, (categoryExpenseMap.get(catName) || 0) + tx.amount);
    }
  });
  const periodNet = periodIncome - periodExpense;
  const savingsRate = periodIncome > 0 ? Math.max(0, (periodNet / periodIncome) * 100) : 0;

  // =========================================================================
  // MODUL 1: RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)
  // =========================================================================
  if (options.modules.summary) {
    drawSectionHeader('1. Ringkasan Eksekutif', `Periode ${options.periodLabel}`);

    // 3 Metric Cards side-by-side
    const cardWidth = (pageWidth - margin * 2 - 8) / 3;
    const cardHeight = 22;

    // Card 1: Pemasukan (Hijau)
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2.5, 2.5, 'F');
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2.5, 2.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text('Total Pemasukan', margin + 4, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(6, 95, 70);
    doc.text(formatRupiahPDF(periodIncome), margin + 4, currentY + 15);

    // Card 2: Pengeluaran (Merah/Rose)
    const card2X = margin + cardWidth + 4;
    doc.setFillColor(255, 241, 242); // rose-50
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2.5, 2.5, 'F');
    doc.setDrawColor(254, 205, 211); // rose-200
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2.5, 2.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(225, 29, 72);
    doc.text('Total Pengeluaran', card2X + 4, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(159, 18, 57);
    doc.text(formatRupiahPDF(periodExpense), card2X + 4, currentY + 15);

    // Card 3: Arus Kas Bersih (Biru / Net)
    const card3X = card2X + cardWidth + 4;
    doc.setFillColor(239, 246, 255); // blue-50
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 2.5, 2.5, 'F');
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 2.5, 2.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text('Arus Kas Bersih (Selisih)', card3X + 4, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(periodNet >= 0 ? 30 : 225, periodNet >= 0 ? 64 : 29, periodNet >= 0 ? 175 : 72);
    doc.text(
      `${periodNet >= 0 ? '+' : ''}${formatRupiahPDF(periodNet)}`,
      card3X + 4,
      currentY + 15
    );

    currentY += cardHeight + 5;

    // Sub-summary: Rasio & Top Pengeluaran
    if (options.settings.summaryIncludeSavingsRatio || options.settings.summaryIncludeTopCategories) {
      const topCategories = Array.from(categoryExpenseMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      const topCatsText =
        topCategories.length > 0
          ? topCategories.map(([cat, amt]) => `${cat}: ${formatRupiahPDF(amt)}`).join('  •  ')
          : 'Belum ada pengeluaran tercatat';

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(DARK_SLATE[0], DARK_SLATE[1], DARK_SLATE[2]);
      doc.text('Indikator Tambahan:', margin + 4, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
      const ratioStr = `Rasio Tabungan: ${savingsRate.toFixed(1)}%`;
      doc.text(`${ratioStr}   |   Top Pengeluaran: ${topCatsText}`, margin + 4, currentY + 10.5);

      currentY += 18;
    }
  }

  // =========================================================================
  // MODUL 2: REKENING & POSISI KAS
  // =========================================================================
  if (options.modules.accounts) {
    drawSectionHeader('2. Posisi Rekening & Kas Likuid');

    const accountsToDisplay = data.accounts.filter((acc) => {
      if (acc.isDeleted) return false;
      if (options.settings.accountsFilter === 'selected') {
        return options.settings.selectedAccountIds.includes(acc.id);
      }
      return true;
    });

    let totalLiquidBalance = 0;
    const accountRows = accountsToDisplay.map((acc, index) => {
      totalLiquidBalance += acc.balance;
      const typeLabel =
        acc.type === 'bank'
          ? 'Bank'
          : acc.type === 'ewallet'
          ? 'E-Wallet'
          : acc.type === 'cash'
          ? 'Tunai / Kas'
          : 'Investasi';
      return [
        (index + 1).toString(),
        acc.name,
        typeLabel,
        acc.accountNumber || '-',
        formatRupiahPDF(acc.balance),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['No', 'Nama Rekening / Dompet', 'Tipe Akun', 'No. Rekening / Keterangan', 'Saldo']],
      body: accountRows,
      foot: [['', 'TOTAL SALDO KAS LIKUID', '', '', formatRupiahPDF(totalLiquidBalance)]],
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_BLUE,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: DARK_SLATE,
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 42 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 38 },
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: DARK_SLATE,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // =========================================================================
  // MODUL 3: TARGET TABUNGAN (SHARED GOALS)
  // =========================================================================
  if (options.modules.savings) {
    drawSectionHeader('3. Target Tabungan & Impian Keluarga');

    const goalsToDisplay = data.goals.filter((g) => {
      if (g.isDeleted) return false;
      if (options.settings.savingsFilter === 'ongoing') {
        return !g.isCompleted && g.currentAmount < g.targetAmount;
      }
      return true;
    });

    if (goalsToDisplay.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
      doc.text('Tidak ada target tabungan yang sesuai kriteria.', margin, currentY);
      currentY += 8;
    } else {
      const goalRows = goalsToDisplay.map((g, index) => {
        const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) || 0;
        const deficit = Math.max(0, g.targetAmount - g.currentAmount);
        return [
          (index + 1).toString(),
          g.name,
          formatRupiahPDF(g.targetAmount),
          formatRupiahPDF(g.currentAmount),
          formatRupiahPDF(deficit),
          `${percent}%`,
          formatDatePDF(g.targetDate),
          g.isCompleted || percent >= 100 ? 'Tercapai' : 'Berjalan',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [
            'No',
            'Nama Target',
            'Target Nominal',
            'Terkumpul',
            'Sisa Kurang',
            'Progres',
            'Target Tanggal',
            'Status',
          ],
        ],
        body: goalRows,
        theme: 'striped',
        headStyles: {
          fillColor: [14, 165, 233], // sky-500
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { halign: 'right', cellWidth: 26 },
          3: { halign: 'right', cellWidth: 26 },
          4: { halign: 'right', cellWidth: 26 },
          5: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
          6: { cellWidth: 22, halign: 'center' },
          7: { cellWidth: 18, halign: 'center' },
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.2,
          textColor: DARK_SLATE,
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // =========================================================================
  // MODUL 4: ALOKASI ANGGARAN (BUDGETS)
  // =========================================================================
  if (options.modules.budgets) {
    drawSectionHeader('4. Alokasi Anggaran & Evaluasi Belanja');

    const budgetsToDisplay = data.budgets.filter((b) => {
      if (b.isDeleted) return false;
      return true;
    });

    if (budgetsToDisplay.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
      doc.text('Belum ada alokasi anggaran yang ditetapkan.', margin, currentY);
      currentY += 8;
    } else {
      let totalBudgetLimit = 0;
      let totalBudgetSpent = 0;

      const budgetRows = budgetsToDisplay.map((b, index) => {
        const cat = categoryMap.get(b.categoryId);
        const spent = categoryExpenseMap.get(cat?.name || '') || 0;
        totalBudgetLimit += b.limitAmount;
        totalBudgetSpent += spent;

        const remaining = b.limitAmount - spent;
        const percent = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;
        const status = remaining < 0 ? 'Overbudget' : percent >= 85 ? 'Hati-hati' : 'Aman';

        return [
          (index + 1).toString(),
          cat?.name || 'Kategori',
          formatRupiahPDF(b.limitAmount),
          formatRupiahPDF(spent),
          formatRupiahPDF(remaining),
          `${percent}%`,
          status,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['No', 'Kategori Pos Belanja', 'Plafon Anggaran', 'Realisasi', 'Sisa', 'Terpakai', 'Status']],
        body: budgetRows,
        foot: [
          [
            '',
            'TOTAL REKAP ANGGARAN',
            formatRupiahPDF(totalBudgetLimit),
            formatRupiahPDF(totalBudgetSpent),
            formatRupiahPDF(totalBudgetLimit - totalBudgetSpent),
            `${totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0}%`,
            totalBudgetSpent > totalBudgetLimit ? 'Overbudget' : 'Terkendali',
          ],
        ],
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229], // indigo-600
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: DARK_SLATE,
          fontStyle: 'bold',
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { halign: 'right', cellWidth: 28 },
          3: { halign: 'right', cellWidth: 28 },
          4: { halign: 'right', cellWidth: 28 },
          5: { halign: 'center', cellWidth: 16 },
          6: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.2,
          textColor: DARK_SLATE,
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // =========================================================================
  // MODUL 5: TAGIHAN RUTIN (RECURRING BILLS)
  // =========================================================================
  if (options.modules.bills) {
    drawSectionHeader('5. Daftar Tagihan & Biaya Rutin');

    const targetMonthKey = options.settings.billsMonthKey || new Date().toISOString().slice(0, 7);

    const billsToDisplay = data.bills.filter((bill) => {
      if (bill.isDeleted) return false;
      const isPaid = (bill.paidMonths || []).includes(targetMonthKey);
      if (options.settings.billsFilter === 'unpaid_only' && isPaid) {
        return false;
      }
      return true;
    });

    if (billsToDisplay.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
      doc.text('Tidak ada tagihan rutin yang terdaftar.', margin, currentY);
      currentY += 8;
    } else {
      let totalBillAmount = 0;
      const billRows = billsToDisplay.map((b, index) => {
        totalBillAmount += b.amount;
        const cat = categoryMap.get(b.categoryId);
        const isPaid = (b.paidMonths || []).includes(targetMonthKey);
        return [
          (index + 1).toString(),
          b.name,
          cat?.name || '-',
          `Tgl ${b.dueDay} (Tiap Bulan)`,
          formatRupiahPDF(b.amount),
          isPaid ? 'Sudah Lunas' : 'Belum Dibayar',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['No', 'Nama Tagihan', 'Kategori', 'Jatuh Tempo', 'Nominal', 'Status Bulan Ini']],
        body: billRows,
        foot: [['', 'TOTAL TAGIHAN RUTIN', '', '', formatRupiahPDF(totalBillAmount), '']],
        theme: 'striped',
        headStyles: {
          fillColor: [225, 29, 72], // rose-600
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: DARK_SLATE,
          fontStyle: 'bold',
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { cellWidth: 32 },
          3: { cellWidth: 35, halign: 'center' },
          4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
          5: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.2,
          textColor: DARK_SLATE,
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // =========================================================================
  // MODUL 6: HUTANG & PIUTANG (DEBTS & LOANS)
  // =========================================================================
  if (options.modules.debts) {
    drawSectionHeader('6. Posisi Hutang & Piutang');

    const debtsToDisplay = data.debts.filter((d) => {
      if (d.isDeleted) return false;
      const isSettled = d.paidAmount >= d.totalAmount;
      if (options.settings.debtsStatusFilter === 'unpaid_only' && isSettled) return false;
      if (options.settings.debtsFilter === 'debts_only' && d.type !== 'debt') return false;
      if (options.settings.debtsFilter === 'receivables_only' && d.type !== 'receivable') return false;
      return true;
    });

    if (debtsToDisplay.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
      doc.text('Tidak ada catatan hutang atau piutang aktif.', margin, currentY);
      currentY += 8;
    } else {
      let totalHutangSisa = 0;
      let totalPiutangSisa = 0;

      const debtRows = debtsToDisplay.map((d, index) => {
        const remaining = Math.max(0, d.totalAmount - d.paidAmount);
        if (d.type === 'debt') {
          totalHutangSisa += remaining;
        } else {
          totalPiutangSisa += remaining;
        }

        const isSettled = remaining <= 0;
        return [
          (index + 1).toString(),
          d.personName,
          d.type === 'debt' ? 'Hutang Saya (Kewajiban)' : 'Piutang (Hak Tagih)',
          formatRupiahPDF(d.totalAmount),
          formatRupiahPDF(d.paidAmount),
          formatRupiahPDF(remaining),
          formatDatePDF(d.dueDate || ''),
          isSettled ? 'Lunas' : 'Belum Lunas',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [
            'No',
            'Nama Pihak / Kontak',
            'Jenis',
            'Nominal Awal',
            'Terbayar',
            'Sisa Kewajiban',
            'Jatuh Tempo',
            'Status',
          ],
        ],
        body: debtRows,
        foot: [
          [
            '',
            'TOTAL KEWAJIBAN BERSIH',
            `Sisa Hutang: ${formatRupiahPDF(totalHutangSisa)}  |  Sisa Piutang: ${formatRupiahPDF(totalPiutangSisa)}`,
            '',
            '',
            '',
            '',
            '',
          ],
        ],
        theme: 'striped',
        headStyles: {
          fillColor: [168, 85, 247], // purple-500
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: DARK_SLATE,
          fontStyle: 'bold',
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { cellWidth: 32 },
          3: { halign: 'right', cellWidth: 24 },
          4: { halign: 'right', cellWidth: 24 },
          5: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
          6: { halign: 'center', cellWidth: 22 },
          7: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.2,
          textColor: DARK_SLATE,
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // =========================================================================
  // MODUL 7: TRANSAKSI (MUTASI DETAIL)
  // =========================================================================
  if (options.modules.transactions) {
    drawSectionHeader('7. Rincian Mutasi Transaksi', `Total ${filteredTransactions.length} transaksi`);

    if (filteredTransactions.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
      doc.text('Tidak ada transaksi pada periode atau filter yang dipilih.', margin, currentY);
      currentY += 8;
    } else {
      // Sort
      const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const timeA = new Date(a.transactionDate).getTime();
        const timeB = new Date(b.transactionDate).getTime();
        return options.settings.transactionsSort === 'asc' ? timeA - timeB : timeB - timeA;
      });

      let totalTxIncome = 0;
      let totalTxExpense = 0;

      const txRows = sortedTransactions.map((tx, index) => {
        if (tx.type === 'income') totalTxIncome += tx.amount;
        if (tx.type === 'expense') totalTxExpense += tx.amount;

        const cat = categoryMap.get(tx.categoryId);
        const acc = accountMap.get(tx.accountId);
        const targetAcc = tx.targetAccountId ? accountMap.get(tx.targetAccountId) : null;

        const accDisplay = targetAcc ? `${acc?.name || ''} ➔ ${targetAcc.name}` : acc?.name || '-';

        const typeLabel =
          tx.type === 'income' ? 'Masuk' : tx.type === 'expense' ? 'Keluar' : 'Transfer';

        const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '';

        return [
          (index + 1).toString(),
          formatDatePDF(tx.transactionDate),
          typeLabel,
          cat?.name || (tx.type === 'transfer' ? 'Transfer' : '-'),
          accDisplay,
          tx.notes || '-',
          `${sign}${formatRupiahPDF(tx.amount)}`,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Rekening', 'Keterangan', 'Nominal']],
        body: txRows,
        foot: [
          [
            '',
            'TOTAL REKAP MUTASI',
            '',
            '',
            '',
            `Masuk: ${formatRupiahPDF(totalTxIncome)}`,
            `Keluar: ${formatRupiahPDF(totalTxExpense)}`,
          ],
        ],
        theme: 'striped',
        headStyles: {
          fillColor: PRIMARY_BLUE,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: DARK_SLATE,
          fontStyle: 'bold',
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 28 },
          4: { cellWidth: 30 },
          5: { cellWidth: 'auto' },
          6: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: DARK_SLATE,
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // =========================================================================
  // FOOTER PADA SETIAP HALAMAN
  // =========================================================================
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    // Left footnote
    doc.text('Catatin! — Sistem Pencatatan Keuangan Keluarga', margin, pageHeight - 6);

    // Right page number
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 6, {
      align: 'right',
    });
  }

  const cleanStartDate = options.startDate.replace(/-/g, '');
  const cleanEndDate = options.endDate.replace(/-/g, '');
  const filename = `Catatin_Laporan_${cleanStartDate}_sd_${cleanEndDate}.pdf`;

  const blob = doc.output('blob');
  return { blob, filename };
};
