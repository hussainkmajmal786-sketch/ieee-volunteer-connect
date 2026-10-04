import { toCsv, downloadBlob } from './csv';

const SOURCE_LABELS = { main_website: 'Main website', import: 'Main website (CSV import)' };
export const sourceLabel = (r) => SOURCE_LABELS[r.source] || 'This website';

export function formatDate(ts) {
    const ms = ts?.toMillis ? ts.toMillis() : typeof ts === 'number' ? ts : ts ? Date.parse(ts) : NaN;
    return Number.isFinite(ms) ? new Date(ms).toLocaleString() : '';
}

const fileBase = (event) => (event?.name || 'event').replace(/[^\w-]+/g, '_').slice(0, 60);

/**
 * Table of every registration: fixed columns first, then one column per
 * form question that people answered on the main website.
 */
export function registrationTable(list, ambassadorOf) {
    const questions = [];
    for (const r of list) for (const q of Object.keys(r.answers || {})) if (!questions.includes(q)) questions.push(q);
    const headers = ['#', 'Name', 'Email', 'Phone', 'College', 'Year', 'Ambassador', 'Ambassador type', 'Source', 'Registered at', ...questions];
    const rows = list.map((r, i) => {
        const amb = r.referredBy ? ambassadorOf(r.referredBy, r.referrerName) : null;
        return [
            i + 1, r.name, r.email, r.phone, r.college, r.year,
            amb?.name || 'Direct', amb?.type || '', sourceLabel(r), formatDate(r.registeredAt),
            ...questions.map(q => r.answers?.[q] ?? ''),
        ];
    });
    return { headers, rows, questions };
}

export function exportRegistrationsCsv(event, list, ambassadorOf) {
    const { headers, rows } = registrationTable(list, ambassadorOf);
    downloadBlob(new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' }), `${fileBase(event)}_registrations.csv`);
}

// Answers not already shown in the columns (name, email, referral code, …).
function details(reg, questions, values) {
    const shown = new Set([reg.name, reg.email, reg.phone, reg.college, reg.year, reg.referredBy]
        .filter(Boolean).map(v => String(v).toLowerCase()));
    return questions
        .map((q, i) => [q, String(values[i] ?? '')])
        .filter(([q, v]) => v && !shown.has(v.toLowerCase()) && !/^timestamp$/i.test(q))
        .map(([q, v]) => `${q}: ${v}`)
        .join('\n');
}

/** A printable report: per-ambassador funnel, then every registration with its form answers. */
export async function exportRegistrationsPdf(event, list, ambassadorOf, funnelRows) {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const blue = [0, 98, 155];
    const { headers, rows, questions } = registrationTable(list, ambassadorOf);

    doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...blue);
    doc.text(`${event?.name || 'Event'} — Registrations`, 40, 44);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90);
    const viaAmb = list.filter(r => r.referredBy).length;
    const fromMain = list.filter(r => r.source === 'main_website' || r.source === 'import').length;
    doc.text(`Generated ${new Date().toLocaleString()}  ·  ${list.length} registrations  ·  ${viaAmb} via ambassadors  ·  ${fromMain} from the main website`, 40, 60);

    let y = 76;
    if (funnelRows.length) {
        autoTable(doc, {
            startY: y,
            head: [['Ambassador', 'Type', 'Clicks', 'Visitors', 'Registrations', 'Conversion']],
            body: funnelRows.map(r => [r.name, r.type || '', r.clicks, r.visitors, r.registrations, `${r.conversion}%`]),
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: blue },
            margin: { left: 40, right: 40 },
        });
        y = doc.lastAutoTable.finalY + 18;
    }

    // Core columns as a table; the form answers (any number of questions)
    // go into one wrapped "Form details" column so the page never overflows.
    const core = headers.slice(0, 10);
    autoTable(doc, {
        startY: y,
        head: [[...core, ...(questions.length ? ['Form details'] : [])]],
        body: rows.map((r, n) => [
            ...r.slice(0, 10),
            ...(questions.length ? [details(list[n], questions, r.slice(10))] : []),
        ]),
        styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
        headStyles: { fillColor: blue, fontSize: 7 },
        columnStyles: { 0: { cellWidth: 22 }, 10: { cellWidth: 180 } },
        margin: { left: 30, right: 30 },
        didDrawPage: () => {
            doc.setFontSize(7).setTextColor(150);
            doc.text(`IEEE SB CEK · page ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 110, doc.internal.pageSize.getHeight() - 16);
        },
    });
    doc.save(`${fileBase(event)}_registrations.pdf`);
}
