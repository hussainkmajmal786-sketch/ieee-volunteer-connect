import { describe, it, expect } from 'vitest';
import { mapAnswers, normalizeRow } from '../worker/externalRegistrations.js';
import { withTracking } from '../worker/ambassadors.js';
import { parseCsv, csvToObjects, toCsv } from '../src/utils/csv.js';
import { registrationTable } from '../src/utils/registrationExport.js';

describe('mapAnswers', () => {
    it('recognises core fields from Google Form question titles', () => {
        const { core, answers } = mapAnswers({
            'Full Name': 'Asha K', 'Email Address': 'ASHA@Example.com', 'WhatsApp Number': '98765 43210',
            'College Name': 'CE Kidangoor', 'Year of study': '2nd', 'Referral code': 'uid123', 'T-shirt size': 'M',
        });
        expect(core).toEqual({ name: 'Asha K', email: 'asha@example.com', phone: '98765 43210', college: 'CE Kidangoor', year: '2nd', ref: 'uid123' });
        expect(answers['T-shirt size']).toBe('M');
    });

    it('does not take the college or ambassador name as the person name', () => {
        expect(mapAnswers({ 'Name of college': 'CEK', 'Ambassador name': 'Ravi', 'Your name': 'Meera' }).core.name).toBe('Meera');
    });

    it('recognises the department question', () => {
        expect(mapAnswers({ 'Name': 'A', 'Department / Branch': 'ECE' }).core).toEqual({ name: 'A', department: 'ECE' });
    });

    it('flattens checkbox/grid answers and drops empty ones', () => {
        const { answers } = mapAnswers({ Workshops: ['AI', 'IoT'], Grid: [['a', 'b']], Empty: '', Nothing: null });
        expect(answers).toEqual({ Workshops: 'AI, IoT', Grid: 'a, b' });
    });

    it('rejects an invalid email', () => {
        expect(mapAnswers({ Email: 'not-an-email' }).core.email).toBeUndefined();
    });
});

describe('normalizeRow', () => {
    it('accepts the Apps Script shape', () => {
        const r = normalizeRow({ answers: { Name: 'A', 'Email address': 'a@b.co' }, submittedAt: '2026-10-01T10:00:00Z' });
        expect(r.core.email).toBe('a@b.co');
        expect(r.submittedAt).toBe(Date.parse('2026-10-01T10:00:00Z'));
    });

    it('accepts a flat body with a top-level ref', () => {
        const r = normalizeRow({ ref: 'amb1', name: 'B', email: 'b@c.co' });
        expect(r.ref).toBe('amb1');
        expect(r.answers.ref).toBeUndefined();
    });

    it('ignores non-objects and far-future timestamps', () => {
        expect(normalizeRow('x')).toBeNull();
        expect(normalizeRow([])).toBeNull();
        expect(normalizeRow({ Name: 'C', submittedAt: Date.now() + 10 * 86400000 }).submittedAt).toBeLessThanOrEqual(Date.now());
    });
});

describe('withTracking', () => {
    it('adds the ambassador code as ref and under the configured form field', () => {
        const u = new URL(withTracking('https://docs.google.com/forms/d/e/X/viewform', 'ev1', 'amb1', 'entry.555'));
        expect(u.searchParams.get('ref')).toBe('amb1');
        expect(u.searchParams.get('entry.555')).toBe('amb1');
        expect(u.searchParams.get('utm_campaign')).toBe('ev1');
    });

    it('keeps existing UTM tags', () => {
        const u = new URL(withTracking('https://x.org/reg?utm_source=poster', 'ev1', 'amb1'));
        expect(u.searchParams.get('utm_source')).toBe('poster');
    });
});

describe('csv', () => {
    it('parses quotes, commas, newlines and CRLF', () => {
        expect(parseCsv('a,b\r\n"x, y","say ""hi""\nthere"\r\n')).toEqual([['a', 'b'], ['x, y', 'say "hi"\nthere']]);
    });

    it('maps rows to header keys and skips blank lines', () => {
        expect(csvToObjects('﻿Name,Email\nA,a@b.co\n\n,\nB,')).toEqual([{ Name: 'A', Email: 'a@b.co' }, { Name: 'B' }]);
    });

    it('neutralises spreadsheet formulas on export', () => {
        expect(toCsv(['h'], [['=HYPERLINK("x")']])).toContain(`"'=HYPERLINK(""x"")"`);
    });
});

describe('registrationTable', () => {
    it('adds one column per form question and labels the ambassador', () => {
        const { headers, rows } = registrationTable([
            { name: 'A', referredBy: 'u1', source: 'main_website', answers: { Size: 'M' } },
            { name: 'B', answers: { Food: 'Veg' } },
        ], (id) => ({ name: id === 'u1' ? 'Ravi' : '?', type: 'campus' }));
        expect(headers.slice(-2)).toEqual(['Size', 'Food']);
        expect(rows[0].slice(7, 10)).toEqual(['Ravi', 'campus', 'Main website']);
        expect(rows[1][7]).toBe('Direct');
        expect(rows[1].slice(-2)).toEqual(['', 'Veg']);
    });
});
