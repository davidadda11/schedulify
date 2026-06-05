// src/lib/server/edu24.ts
// 24edu.ro Integration — Unofficial scraper adapter
// NOTE: Use with respect to ToS. Runs server-side only.

import type { ScheduleBlock } from '$db/schema';

export interface Edu24Credentials {
  username: string;
  password: string;
}

export interface Edu24Schedule {
  dayOfWeek: number;
  startHour: number;
  endHour:   number;
  subject:   string;
  teacher:   string;
  classroom: string;
}

export interface Edu24Grade {
  subject:   string;
  value:     number;
  date:      string;
  thesis:    boolean;
}

export interface Edu24Absence {
  subject: string;
  date:    string;
  motivated: boolean;
}

// ── Main 24edu client ────────────────────────────────────────
export class Edu24Client {
  private baseUrl = 'https://www.24edu.ro';
  private cookieJar: Record<string, string> = {};

  constructor(private credentials: Edu24Credentials) {}

  // ── Login ─────────────────────────────────────────────────
  async login(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'StudyFlow/1.0 (+https://studyflow.ro)',
        },
        body: new URLSearchParams({
          username: this.credentials.username,
          password: this.credentials.password,
        }),
        redirect: 'manual',
      });

      // Extract session cookie
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        this.parseCookies(setCookie);
      }

      return res.status === 302;
    } catch {
      return false;
    }
  }

  // ── Fetch schedule (orar) ─────────────────────────────────
  async getSchedule(): Promise<Edu24Schedule[]> {
    const html = await this.fetchPage('/elev/orar');
    if (!html) return [];
    return this.parseScheduleHtml(html);
  }

  // ── Fetch grades (note) ───────────────────────────────────
  async getGrades(): Promise<Edu24Grade[]> {
    const html = await this.fetchPage('/elev/catalog');
    if (!html) return [];
    return this.parseGradesHtml(html);
  }

  // ── Fetch absences ────────────────────────────────────────
  async getAbsences(): Promise<Edu24Absence[]> {
    const html = await this.fetchPage('/elev/absente');
    if (!html) return [];
    return this.parseAbsencesHtml(html);
  }

  // ── Convert to StudyFlow schedule blocks ─────────────────
  toScheduleBlocks(
    schedule: Edu24Schedule[],
    userId: string
  ): Omit<ScheduleBlock, 'id'>[] {
    return schedule.map(s => ({
      userId,
      subjectId: null,          // matched later by subject name
      dayOfWeek: s.dayOfWeek,
      startHour: s.startHour,
      endHour:   s.endHour,
      type:      'school' as const,
      label:     s.subject,
      source:    'edu24' as const,
    }));
  }

  // ── Private helpers ───────────────────────────────────────
  private async fetchPage(path: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          'Cookie': this.cookieString(),
          'User-Agent': 'StudyFlow/1.0',
        },
      });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  private parseCookies(cookieHeader: string) {
    cookieHeader.split(';').forEach(part => {
      const [key, val] = part.trim().split('=');
      if (key && val) this.cookieJar[key.trim()] = val.trim();
    });
  }

  private cookieString(): string {
    return Object.entries(this.cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  // ── HTML Parsers (regex-based, adapt to actual 24edu HTML) ─
  private parseScheduleHtml(html: string): Edu24Schedule[] {
    const blocks: Edu24Schedule[] = [];

    // Example pattern — adjust selectors to actual 24edu.ro DOM
    // The real implementation would use a proper HTML parser like node-html-parser
    const rowPattern = /<tr[^>]*class="(?:linie|row)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    let match: RegExpExecArray | null;

    const DAY_MAP: Record<string, number> = {
      'Luni': 0, 'Marti': 1, 'Miercuri': 2, 'Joi': 3,
      'Vineri': 4, 'Sambata': 5, 'Duminica': 6
    };

    while ((match = rowPattern.exec(html)) !== null) {
      const cells = match[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) ?? [];
      if (cells.length < 5) continue;

      const getText = (cell: string) =>
        cell.replace(/<[^>]+>/g, '').trim();

      const day      = getText(cells[0] ?? '');
      const timeStr  = getText(cells[1] ?? '');
      const subject  = getText(cells[2] ?? '');
      const teacher  = getText(cells[3] ?? '');
      const classroom = getText(cells[4] ?? '');

      const [startStr, endStr] = timeStr.split('-');
      const parseHour = (t: string) => {
        const [h, m] = t.trim().split(':').map(Number);
        return h + (m ?? 0) / 60;
      };

      if (DAY_MAP[day] !== undefined && startStr && endStr) {
        blocks.push({
          dayOfWeek: DAY_MAP[day]!,
          startHour: parseHour(startStr),
          endHour:   parseHour(endStr),
          subject,
          teacher,
          classroom,
        });
      }
    }

    return blocks;
  }

  private parseGradesHtml(html: string): Edu24Grade[] {
    // Implement based on actual 24edu.ro grade table structure
    return [];
  }

  private parseAbsencesHtml(html: string): Edu24Absence[] {
    // Implement based on actual 24edu.ro absence table structure
    return [];
  }
}

// ── API endpoint helper ──────────────────────────────────────
export async function syncEdu24(
  userId: string,
  credentials: Edu24Credentials
) {
  const client = new Edu24Client(credentials);
  const ok = await client.login();

  if (!ok) {
    throw new Error('Autentificare 24edu.ro eșuată. Verifică datele de conectare.');
  }

  const [schedule, grades, absences] = await Promise.all([
    client.getSchedule(),
    client.getGrades(),
    client.getAbsences(),
  ]);

  return {
    scheduleBlocks: client.toScheduleBlocks(schedule, userId),
    grades,
    absences,
  };
}