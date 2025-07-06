// Utility for robust date parsing across scrapers

/**
 * Parses a date string in ISO, relative (e.g. '2 days ago'), slash (MM/DD/YYYY or DD/MM/YYYY), or German (DD.MM.YYYY) format.
 * Returns a Date object (UTC). Falls back to current date on error.
 */
export function parseFlexibleDate(dateString: string | undefined | null): Date {
  try {
    if (!dateString) return new Date();

    // Handle German date format: DD.MM.YYYY or DD.MM.YY (before ISO parsing)
    if (dateString.includes('.')) {
      const germanDate = parseGermanDate(dateString);
      if (germanDate) return germanDate;
    }

    // Handle relative dates like '2 days ago'
    if (dateString.includes('ago')) {
      return parseRelativeDate(dateString);
    }

    // Handle slash dates (MM/DD/YYYY or DD/MM/YYYY)
    if (dateString.includes('/')) {
      const slashDate = parseSlashDate(dateString);
      if (slashDate) return slashDate;
    }

    // Try ISO and RFC formats (last, to avoid conflicts)
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return new Date();
  } catch {
    return new Date();
  }
}

function parseRelativeDate(relativeDate: string): Date {
  const now = new Date();
  const match = relativeDate.match(
    /(\d+)\s+(day|days|hour|hours|minute|minutes|second|seconds)\s+ago/,
  );
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'day':
      case 'days':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'hour':
      case 'hours':
        return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'minute':
      case 'minutes':
        return new Date(now.getTime() - amount * 60 * 1000);
      case 'second':
      case 'seconds':
        return new Date(now.getTime() - amount * 1000);
    }
  }
  return now;
}

function parseGermanDate(dateString: string): Date | null {
  try {
    // Handle German date format: DD.MM.YYYY
    const match = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return new Date(
        Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
      );
    }

    // Handle German date format: DD.MM.YY
    const matchShort = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{2})/);
    if (matchShort) {
      const [, day, month, year] = matchShort;
      const fullYear =
        parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
      return new Date(Date.UTC(fullYear, parseInt(month) - 1, parseInt(day)));
    }

    return null;
  } catch {
    return null;
  }
}

function parseSlashDate(dateString: string): Date | null {
  const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, first, second, year] = match;
  const firstNum = parseInt(first);
  const secondNum = parseInt(second);
  const yearNum = parseInt(year);
  // If first > 12, assume DD/MM/YYYY (EU). If second > 12, assume MM/DD/YYYY (US). Else, default to US.
  if (firstNum > 12) {
    return new Date(yearNum, secondNum - 1, firstNum);
  } else if (secondNum > 12) {
    return new Date(yearNum, firstNum - 1, secondNum);
  } else {
    return new Date(yearNum, firstNum - 1, secondNum);
  }
}
