import {
  collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import type { University } from "./firestore";
import { SEED_UNIVERSITIES, SEED_META } from "@/data/universities-seed";

export interface SeederResult {
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  total: number;
  errors: string[];
}

export interface SeederOptions {
  updateExisting?: boolean;
  onProgress?: (current: number, total: number, name: string) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\u0600-\u06FF]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function makeId(u: Omit<University, "id" | "lastUpdatedAt" | "lastVerifiedAt">): string {
  const slug = slugify(u.nameEn || u.nameAr);
  const country = slugify(u.country.split(" ")[0]);
  return `${country}-${slug}`.slice(0, 80) || `uni-${Math.random().toString(36).slice(2, 8)}`;
}

export async function seedUniversities(
  universities: Omit<University, "id" | "lastUpdatedAt" | "lastVerifiedAt">[],
  options: SeederOptions = {}
): Promise<SeederResult> {
  const { updateExisting = true, onProgress } = options;
  const result: SeederResult = { added: 0, updated: 0, skipped: 0, failed: 0, total: universities.length, errors: [] };

  for (let i = 0; i < universities.length; i++) {
    const uni = universities[i];
    onProgress?.(i + 1, universities.length, uni.nameEn || uni.nameAr);

    try {
      const id = makeId(uni);
      const ref = doc(collection(db, "universities"), id);
      const existing = await getDoc(ref);

      if (existing.exists()) {
        if (updateExisting) {
          await updateDoc(ref, {
            ...uni,
            lastUpdatedAt: serverTimestamp(),
          });
          result.updated++;
        } else {
          result.skipped++;
        }
      } else {
        await setDoc(ref, {
          ...uni,
          lastUpdatedAt: serverTimestamp(),
          lastVerifiedAt: serverTimestamp(),
        });
        result.added++;
      }
    } catch (e: unknown) {
      result.failed++;
      result.errors.push(`${uni.nameEn || uni.nameAr}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}

export async function runAutoSeed(options: SeederOptions = {}): Promise<SeederResult> {
  return seedUniversities(SEED_UNIVERSITIES, options);
}

export function getSeedMeta() {
  return {
    ...SEED_META,
    totalCount: SEED_UNIVERSITIES.length,
    saudiCount: SEED_UNIVERSITIES.filter((u) => u.type === "local").length,
    internationalCount: SEED_UNIVERSITIES.filter((u) => u.type === "international").length,
  };
}

export async function getFirestoreCount(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, "universities"));
    return snap.size;
  } catch {
    return 0;
  }
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
export function parseCSV(csv: string): Omit<University, "id" | "lastUpdatedAt" | "lastVerifiedAt">[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const results: Omit<University, "id" | "lastUpdatedAt" | "lastVerifiedAt">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.every((v) => !v)) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });

    if (!row.nameAr && !row.nameEn) continue;

    const uni: Omit<University, "id" | "lastUpdatedAt" | "lastVerifiedAt"> = {
      nameAr: row.nameAr || row.nameEn || "",
      nameEn: row.nameEn || row.nameAr || "",
      country: row.country || "",
      city: row.city || "",
      type: (row.type as "local" | "international") === "local" ? "local" : "international",
      majors: row.majors ? row.majors.split("|").map((m) => m.trim()) : [],
      suitableForSaudiScholarship: row.suitableForSaudiScholarship === "true",
      needsReview: row.needsReview !== "false",
      dataConfidence: (row.dataConfidence as University["dataConfidence"]) || "low",
      websiteUrl: row.websiteUrl || undefined,
      admissionUrl: row.admissionUrl || undefined,
      admissionNotes: row.admissionNotes || undefined,
    };
    results.push(uni);
  }
  return results;
}

// ─── JSON Parser ─────────────────────────────────────────────────────────────
export function parseJSON(json: string): Omit<University, "id" | "lastUpdatedAt" | "lastVerifiedAt">[] {
  try {
    const data = JSON.parse(json);
    const arr = Array.isArray(data) ? data : data.universities ?? [];
    return arr.map((item: any) => ({
      nameAr: item.nameAr || item.nameEn || "",
      nameEn: item.nameEn || item.nameAr || "",
      country: item.country || "",
      city: item.city || "",
      type: item.type === "local" ? "local" : "international",
      majors: Array.isArray(item.majors) ? item.majors : [],
      suitableForSaudiScholarship: !!item.suitableForSaudiScholarship,
      needsReview: item.needsReview !== false,
      dataConfidence: item.dataConfidence || "low",
      websiteUrl: item.websiteUrl || undefined,
      admissionUrl: item.admissionUrl || undefined,
      languageRequirements: item.languageRequirements || undefined,
      admissionNotes: item.admissionNotes || undefined,
      logoUrl: item.logoUrl || undefined,
      satRequired: item.satRequired || undefined,
      actRequired: item.actRequired || undefined,
    }));
  } catch {
    return [];
  }
}
