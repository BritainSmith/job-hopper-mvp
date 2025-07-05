import { parseFlexibleDate } from './date.util';

describe('parseFlexibleDate', () => {
  it('parses ISO date', () => {
    const date = parseFlexibleDate('2024-01-01');
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(1);
  });

  it('parses US slash date (MM/DD/YYYY)', () => {
    const date = parseFlexibleDate('12/25/2023');
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2023);
    expect(date.getUTCMonth()).toBe(11); // December
    expect(date.getUTCDate()).toBe(25);
  });

  it('parses EU slash date (DD/MM/YYYY)', () => {
    const date = parseFlexibleDate('25/12/2023');
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2023);
    expect(date.getUTCMonth()).toBe(11); // December
    expect(date.getUTCDate()).toBe(25);
  });

  it('parses German date (DD.MM.YYYY)', () => {
    const date = parseFlexibleDate('25.12.2023');
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2023);
    expect(date.getUTCMonth()).toBe(11); // December
    expect(date.getUTCDate()).toBe(25);
  });

  it('parses German date (DD.MM.YY)', () => {
    const date = parseFlexibleDate('25.12.23');
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2023);
    expect(date.getUTCMonth()).toBe(11); // December
    expect(date.getUTCDate()).toBe(25);
  });

  it('parses relative date: days ago', () => {
    const now = new Date();
    const date = parseFlexibleDate('2 days ago');
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCDate()).toBe(now.getUTCDate() - 2);
  });

  it('parses relative date: hours ago', () => {
    const date = parseFlexibleDate('3 hours ago');
    expect(date).toBeInstanceOf(Date);
  });

  it('parses relative date: minutes ago', () => {
    const date = parseFlexibleDate('15 minutes ago');
    expect(date).toBeInstanceOf(Date);
  });

  it('parses relative date: seconds ago', () => {
    const date = parseFlexibleDate('30 seconds ago');
    expect(date).toBeInstanceOf(Date);
  });

  it('returns now for unrecognized relative format', () => {
    const now = new Date();
    const date = parseFlexibleDate('someday');
    expect(date.getUTCFullYear()).toBe(now.getUTCFullYear());
    expect(date.getUTCMonth()).toBe(now.getUTCMonth());
    expect(date.getUTCDate()).toBe(now.getUTCDate());
  });

  it('returns now for undefined/null/empty', () => {
    expect(parseFlexibleDate(undefined)).toBeInstanceOf(Date);
    expect(parseFlexibleDate(null)).toBeInstanceOf(Date);
    expect(parseFlexibleDate('')).toBeInstanceOf(Date);
  });

  it('returns now for invalid date', () => {
    expect(parseFlexibleDate('not a date')).toBeInstanceOf(Date);
  });
});
