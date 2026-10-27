// AS/400 Spool Processing Engine (ASDOCU Spool Remapper)

export class SpoolEngine {
  constructor(rawText = '') {
    this.rawText = rawText;
    this.lines = this.parseLines(rawText);
  }

  setRawText(text) {
    this.rawText = text || '';
    this.lines = this.parseLines(this.rawText);
  }

  parseLines(text) {
    if (!text) return [];
    // Standardize CRLF to LF, then split
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  }

  getLineCount() {
    return this.lines.length;
  }

  getLine(rowNumber) {
    // rowNumber is 1-indexed
    const idx = rowNumber - 1;
    if (idx >= 0 && idx < this.lines.length) {
      return this.lines[idx];
    }
    return '';
  }

  /**
   * Extract value at coordinate (Validoc standard: Row, StartCol, EndCol)
   * 1-indexed!
   */
  extractValue(row, startCol, endCol, trim = true) {
    const line = this.getLine(row);
    if (!line) return '';
    
    // Convert 1-indexed to 0-indexed slice
    const start = Math.max(0, (startCol || 1) - 1);
    const end = (endCol && endCol >= startCol) ? endCol : line.length;
    
    const val = line.substring(start, end);
    return trim ? val.trim() : val;
  }

  /**
   * Extract a tabular list of rows between startRow and endRow
   * using column definitions { id, spoolColStart, spoolColEnd, jsonKey }
   */
  extractTable(startRow, endRow, columns = []) {
    const rows = [];
    const maxRow = Math.min(this.lines.length, endRow);

    for (let r = startRow; r <= maxRow; r++) {
      const line = this.getLine(r);
      // Skip empty or separator lines (e.g. "----", "====")
      const trimmed = line.trim();
      if (!trimmed || /^[-=_*#\s]+$/.test(trimmed)) {
        continue;
      }

      const rowObj = { _rowNum: r };
      let hasData = false;

      for (const col of columns) {
        const val = this.extractValue(r, col.spoolColStart, col.spoolColEnd, true);
        const key = col.jsonKey || col.id;
        rowObj[key] = val;
        if (val) hasData = true;
      }

      // If at least one column had non-empty text, add the row
      if (hasData) {
        rows.push(rowObj);
      }
    }

    return rows;
  }

  /**
   * Scan spool to automatically discover text boundaries around a coordinate
   */
  autoDetectWordAt(row, col) {
    const line = this.getLine(row);
    if (!line) return null;

    const idx = col - 1;
    if (idx < 0 || idx >= line.length) return null;

    // Expand left and right until space or boundary
    let left = idx;
    while (left > 0 && line[left - 1] !== ' ') {
      left--;
    }

    let right = idx;
    while (right < line.length && line[right] !== ' ') {
      right++;
    }

    const value = line.substring(left, right);
    return {
      row,
      startCol: left + 1,
      endCol: right,
      value
    };
  }

  /**
   * Format value according to field format specifier
   */
  formatValue(value, format) {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    if (!str) return '';

    switch (format) {
      case 'currency_eur': {
        const num = parseFloat(str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
        if (isNaN(num)) return str;
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num);
      }
      case 'number_2dec': {
        const num = parseFloat(str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
        if (isNaN(num)) return str;
        return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
      }
      case 'date_it': {
        // Look for DD/MM/YYYY or YYYY-MM-DD or DD/MM/YY
        return str;
      }
      default:
        return str;
    }
  }
}
