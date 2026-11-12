// ─── Exportación de informes a PDF (requerimiento 5.4) ────────────────────
// Se carga jsPDF bajo demanda para no aumentar el tamaño inicial de la app.
export async function exportReportPDF({ state, metrics, chart, author, loanStatus }) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const L = (n) => `L ${Number(n).toFixed(2)}`;
  const W = doc.internal.pageSize.getWidth();
  const now = new Date();

  // Encabezado
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.text(state.settings.libraryName, 40, 32);
  doc.setFontSize(11);
  doc.text("Informe de operaciones de la biblioteca", 40, 52);
  doc.setTextColor(60);
  doc.setFontSize(9);
  doc.text(`Generado: ${now.toLocaleString("es-HN")}   ·   Por: ${author ?? "—"}`, 40, 90);

  // Indicadores
  autoTable(doc, {
    startY: 105,
    head: [["Indicador", "Valor"]],
    body: [
      ["Copias en inventario", metrics.totalBooks],
      ["Títulos registrados", metrics.titles],
      ["Préstamos activos", metrics.activeLoans],
      ["Préstamos vencidos", metrics.overdueLoans],
      ["Usuarios activos", metrics.activeUsers],
      ["Ingresos por ventas (mes)", L(metrics.monthlySales)],
      ["Ingresos por rentas (mes)", L(metrics.monthlyRentals)],
      ["Multas cobradas (mes)", L(metrics.monthlyFines)],
      ["Ingreso total (mes)", L(metrics.totalRevenue)],
      ["Multas pendientes de cobro", L(metrics.pendingFines)],
    ],
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: 40, right: 40 },
  });

  const section = (title) => {
    const y = doc.lastAutoTable.finalY + 26;
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(title, 40, y);
    return y + 8;
  };

  autoTable(doc, {
    startY: section("Libros más prestados"),
    head: [["#", "Título", "Préstamos"]],
    body: chart.topBooks.map((b, i) => [i + 1, b.title, b.loans]),
    theme: "striped", headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 9 }, margin: { left: 40, right: 40 },
  });

  const active = state.loans.filter((l) => !l.returnDate);
  autoTable(doc, {
    startY: section(`Préstamos activos (${active.length})`),
    head: [["Folio", "Usuario", "Libro", "Prestado", "Vence", "Estado"]],
    body: active.map((l) => [l.id, l.userName, l.bookTitle, l.loanDate, l.dueDate, loanStatus(l) === "overdue" ? "Vencido" : "Activo"]),
    theme: "striped", headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 8 }, margin: { left: 40, right: 40 },
  });

  const pending = state.fines.filter((f) => !f.paid);
  autoTable(doc, {
    startY: section(`Multas pendientes (${pending.length})`),
    head: [["Folio", "Usuario", "Concepto", "Fecha", "Monto"]],
    body: pending.map((f) => [f.id, f.userName, f.concept, f.date, L(f.amount)]),
    theme: "striped", headStyles: { fillColor: [245, 158, 11] }, styles: { fontSize: 8 }, margin: { left: 40, right: 40 },
    columnStyles: { 4: { halign: "right" } },
  });

  autoTable(doc, {
    startY: section("Ventas y rentas recientes"),
    head: [["Folio", "Cliente", "Libro", "Tipo", "Fecha", "Monto"]],
    body: state.sales.slice(0, 20).map((s) => [s.id, s.userName, s.bookTitle, s.type === "buy" ? "Compra" : "Renta", s.date, L(s.amount)]),
    theme: "striped", headStyles: { fillColor: [34, 197, 94] }, styles: { fontSize: 8 }, margin: { left: 40, right: 40 },
    columnStyles: { 5: { halign: "right" } },
  });

  // Pie de página
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Página ${i} de ${pages}`, W - 90, doc.internal.pageSize.getHeight() - 20);
  }

  const file = `informe-biblioteca-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(file);
  return file;
}
