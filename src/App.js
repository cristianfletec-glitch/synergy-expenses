// App.js — Versión simple sin logo ni barras, con gráfico de pastel + evolución y PDF
// Copia este archivo completo dentro de src/App.js en tu proyecto Create React App

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ===== Utilidades =====
const currency = (n) => (isNaN(n) ? 0 : Number(n)).toLocaleString("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 2 });
const toNumber = (v) => (v === "" || v == null ? 0 : Number(v));
const monthKey = (d) => { const dt = new Date(d); if (isNaN(dt.getTime())) return ""; return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`; };

// Colores (rojo, naranja, turquesa)
const COLORS = { red: "#ef4444", orange: "#f97316", teal: "#14b8a6", slate: "#0f172a" };

// Datos de ejemplo precargados (del reporte)
const seedData = [
  { date: "2025-09-02", event: "Pedro Strop Acad @ Juan Uribe Acad (Don Gregorio)", detail: "Peajes", food: 500, fuel: 1115, other: 200 },
  { date: "2025-09-03", event: "Mickeys @ Javier Academy (Yamasá)", detail: "Peajes", food: 500, fuel: 1010, other: 800 },
  { date: "2025-09-04", event: "Fausto Cuevas @ TBA Academy (Palenque)", detail: "Peajes", food: 500, fuel: 950, other: 200 },
  { date: "2025-09-05", event: "Acevedo Acad @ Enrique Soto Acad (La victoria)", detail: "Peajes", food: 500, fuel: 700, other: 200 },
  { date: "2025-09-09", event: "Pedro Strop Acad @ Juan Uribe Acad (Don Gregorio)", detail: "Peajes", food: 500, fuel: 1115, other: 200 },
  { date: "2025-09-10", event: "AMC @ Enrique Soto (Yaguate) / Partido suspendido en terreno", detail: "Peajes", food: 0, fuel: 720, other: 200 },
  { date: "2025-09-10", event: "Mariners Selection @ Mickeys (Complejo Epy Guerrero)", detail: "Peajes", food: 500, fuel: 560, other: 200 },
  { date: "2025-09-16", event: "Fausto Cuevas @ Papon Academy (Loma del sueño)", detail: "Peajes", food: 500, fuel: 800, other: 200 },
  { date: "2025-09-17", event: "David Academy @ Esteban German (Complejo JD Ozuna, BC)", detail: "Peajes", food: 500, fuel: 1200, other: 400 },
  { date: "2025-09-23", event: "Pedro Strop Acad @ Juan Uribe Acad (Don Gregorio)", detail: "Peajes", food: 500, fuel: 1115, other: 200 },
];

const LS_KEY = "synergy-expenses-v1";

function usePersistentExpenses() {
  const [expenses, setExpenses] = useState(() => {
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : seedData; } catch { return seedData; }
  });
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(expenses)); }, [expenses]);
  return [expenses, setExpenses];
}

export default function App() {
  const [expenses, setExpenses] = usePersistentExpenses();
  const [form, setForm] = useState({ date: "", event: "", detail: "Peajes", food: "", fuel: "", other: "" });
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date()));
  const reportRef = useRef(null);

  // Filtrado por mes
  const monthly = useMemo(() => expenses.filter((e) => monthKey(e.date) === selectedMonth), [expenses, selectedMonth]);

  // Totales
  const totals = useMemo(() => monthly.reduce((acc, e) => {
    acc.food += toNumber(e.food); acc.fuel += toNumber(e.fuel); acc.other += toNumber(e.other);
    acc.total += toNumber(e.food) + toNumber(e.fuel) + toNumber(e.other); return acc; }, { food:0, fuel:0, other:0, total:0 }), [monthly]);

  // Evolución por día
  const trend = useMemo(() => {
    const m = {}; monthly.forEach((e) => { const k = e.date; m[k] = (m[k]||0) + toNumber(e.food)+toNumber(e.fuel)+toNumber(e.other); });
    return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0])).map(([date, total]) => ({ date, total }));
  }, [monthly]);

  // Pie por categorías
  const catData = useMemo(() => ([
    { name: "Comida", value: totals.food },
    { name: "Combustible", value: totals.fuel },
    { name: "Otros", value: totals.other },
  ]), [totals]);

  const addExpense = () => {
    if (!form.date || !form.event) { alert("Fecha y Evento son obligatorios"); return; }
    const item = { ...form, food: toNumber(form.food), fuel: toNumber(form.fuel), other: toNumber(form.other) };
    setExpenses((p) => [...p, item]); setForm({ date: "", event: "", detail: "Peajes", food: "", fuel: "", other: "" }); setSelectedMonth(monthKey(item.date));
  };

  const delExpense = (idx) => { if (!window.confirm("¿Eliminar este gasto?")) return; setExpenses((p) => p.filter((_,i)=>i!==idx)); };

  const makePDF = async () => {
    const node = reportRef.current; if (!node) return; const canvas = await html2canvas(node, { scale: 2 });
    const img = canvas.toDataURL("image/png"); const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth(); const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height); const w = canvas.width * ratio; const h = canvas.height * ratio;
    pdf.addImage(img, "PNG", (pageW-w)/2, (pageH-h)/2, w, h); pdf.save(`Reporte-${selectedMonth}.pdf`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, background: "linear-gradient(90deg,#ef4444,#f97316,#14b8a6)", color: "white", padding: "12px 16px", boxShadow: "0 2px 10px rgba(0,0,0,.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: .5 }}>REPORTE DE GASTOS</div>
            <div style={{ fontSize: 12, opacity: .9 }}>Página editable con gráficos y PDF</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={makePDF} style={{ borderRadius: 16, padding: "8px 14px", fontWeight: 700, background: "#fff", color: "#0f172a", border: "none" }}>Exportar PDF</button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
        {/* Mes */}
        <section style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 700 }}>Mes del reporte</label>
          <div>
            <input type="month" value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)} style={{ marginTop: 6, padding: 10, borderRadius: 12, border: "1px solid #cbd5e1" }} />
          </div>
        </section>

        {/* Formulario */}
        <section style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Agregar gasto</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", columnGap: 20, rowGap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Fecha</label>
              <input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Evento</label>
              <input type="text" placeholder="Descripción del evento" value={form.event} onChange={(e)=>setForm({...form,event:e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Detalle</label>
              <input type="text" value={form.detail} onChange={(e)=>setForm({...form,detail:e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Comida</label>
              <input type="number" value={form.food} onChange={(e)=>setForm({...form,food:e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Combustible</label>
              <input type="number" value={form.fuel} onChange={(e)=>setForm({...form,fuel:e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Otros</label>
              <input type="number" value={form.other} onChange={(e)=>setForm({...form,other:e.target.value})} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button onClick={addExpense} style={{ background: COLORS.red, color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 700 }}>Agregar</button>
            <button onClick={()=>setForm({ date: "", event: "", detail: "Peajes", food: "", fuel: "", other: "" })} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 700 }}>Limpiar</button>
          </div>
        </section>

        {/* Reporte + Gráficos */}
        <section ref={reportRef}>
          <div style={{ overflowX: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 12, borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ fontWeight: 800 }}>REPORTE DE GASTOS</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Mes: {selectedMonth}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12 }}>Total</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{currency(totals.total)}</div>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead style={{ background: "#f1f5f9" }}>
                <tr>
                  <th style={{ textAlign: "left", padding: 8 }}>Fecha</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Evento</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Detalle</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Comida</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Combustible</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Otros</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Total</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((e, idx) => {
                  const rowTotal = toNumber(e.food) + toNumber(e.fuel) + toNumber(e.other);
                  return (
                    <tr key={idx} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: 8 }}>{e.date}</td>
                      <td style={{ padding: 8 }}>{e.event}</td>
                      <td style={{ padding: 8 }}>{e.detail}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{currency(e.food)}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{currency(e.fuel)}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{currency(e.other)}</td>
                      <td style={{ padding: 8, textAlign: "right", fontWeight: 700 }}>{currency(rowTotal)}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>
                        <button onClick={()=>delExpense(expenses.findIndex(x=>x===e))} style={{ padding: "6px 10px", borderRadius: 8, background: "#e2e8f0", border: "none", fontWeight: 700 }}>Borrar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f8fafc", fontWeight: 800 }}>
                  <td style={{ padding: 8 }} colSpan={3}>TOTALES</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{currency(totals.food)}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{currency(totals.fuel)}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{currency(totals.other)}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{currency(totals.total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Gráficos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Pie */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <h3 style={{ marginTop: 0 }}>Distribución por categoría</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" outerRadius={100} label>
                      {catData.map((_, i) => (
                        <Cell key={i} fill={[COLORS.red, COLORS.orange, COLORS.teal][i % 3]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v)=>currency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Evolución diaria */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <h3 style={{ marginTop: 0 }}>Evolución diaria del gasto</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(v)=>currency(v)} />
                    <Area type="monotone" dataKey="total" stroke={COLORS.teal} fillOpacity={1} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <div style={{ textAlign: "center", color: "#64748b", fontSize: 12, padding: 16 }}>Hecho con ❤️. Datos de muestra precargados (sept-25). Edita, guarda y exporta a PDF.</div>
      </main>
    </div>
  );
}
