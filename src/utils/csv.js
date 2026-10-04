/** Parse CSV text (RFC 4180: quoted fields, "" escapes, CRLF) into rows of cells. */
export function parseCsv(text) {
    const rows = [];
    let row = [], cell = '', quoted = false;
    const src = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (quoted) {
            if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') quoted = false;
            else cell += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ',') { row.push(cell); cell = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(cell); rows.push(row); row = []; cell = '';
        } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
}

/** CSV rows → objects keyed by the header row (blank headers are dropped). */
export function csvToObjects(text) {
    const [header = [], ...body] = parseCsv(text);
    const keys = header.map(h => h.trim());
    return body.map(cells => {
        const obj = {};
        keys.forEach((k, i) => { if (k && cells[i] !== undefined && cells[i] !== '') obj[k] = cells[i]; });
        return obj;
    }).filter(o => Object.keys(o).length > 0);
}

// A leading = + - @ makes spreadsheets run the cell as a formula.
function cell(value) {
    let s = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(headers, rows) {
    return '﻿' + [headers, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
