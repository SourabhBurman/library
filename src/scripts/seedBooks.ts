/**
 * One-off seed script: pulls real book data from the Open Library API
 * (no key required) and inserts ~200 books into the catalog, mapped onto
 * our Book entity / BOOK_GENRE enum.
 *
 * Run with: npx ts-node src/scripts/seedBooks.ts
 */
import "dotenv/config";
import { DBModle } from "../config/db.connection";
import { Book } from "../entity/books.entity";
import { BOOK_GENRE } from "../enums";

const GENRE_SUBJECTS: { genre: BOOK_GENRE; subject: string }[] = [
  { genre: BOOK_GENRE.HORROR, subject: "horror" },
  { genre: BOOK_GENRE.ROMANCE, subject: "romance" },
  { genre: BOOK_GENRE.FANTASY, subject: "fantasy" },
  { genre: BOOK_GENRE.SCIFI, subject: "science_fiction" },
  { genre: BOOK_GENRE.MYSTERY, subject: "mystery" },
  { genre: BOOK_GENRE.THRILLER, subject: "thriller" },
  { genre: BOOK_GENRE.ADVENTURE, subject: "adventure" },
  { genre: BOOK_GENRE.BIOGRAPHY, subject: "biography" },
  { genre: BOOK_GENRE.HISTORY, subject: "history" },
  { genre: BOOK_GENRE.SELFHELP, subject: "self-help" },
  { genre: BOOK_GENRE.BUSINESS, subject: "business" },
  { genre: BOOK_GENRE.HEALTH, subject: "health" },
  { genre: BOOK_GENRE.DRAMA, subject: "drama" },
  { genre: BOOK_GENRE.FINANCE, subject: "personal_finance" },
  { genre: BOOK_GENRE.TECHNOLOGY, subject: "technology" },
  { genre: BOOK_GENRE.OTHER, subject: "fiction" },
];

const PER_GENRE = 13; // 16 genres * 13 ≈ 208 books
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type OLWork = {
  key: string;
  title: string;
  cover_id?: number;
  first_publish_year?: number;
  authors?: { name: string }[];
};

const stripMarkdown = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Reference-style footnotes, e.g. "([source][1])  [1]: https://..."
    .replace(/\s*\[\d+\]:\s*https?:\/\/\S+/g, "")
    .replace(/\r?\n/g, " ")
    .trim();

const randomBetween = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const fetchDescription = async (workKey: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://openlibrary.org${workKey}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const raw =
      typeof data.description === "string"
        ? data.description
        : data.description?.value;
    if (!raw) return null;
    return stripMarkdown(raw).slice(0, 1000);
  } catch {
    return null;
  }
};

const run = async () => {
  await DBModle.connect();
  const bookRepository = DBModle.dbInstance.getRepository(Book);

  const seen = new Set<string>();
  let totalInserted = 0;

  for (const { genre, subject } of GENRE_SUBJECTS) {
    const res = await fetch(
      `https://openlibrary.org/subjects/${subject}.json?limit=30`,
    );
    if (!res.ok) {
      console.error(`Failed to fetch subject "${subject}": ${res.status}`);
      continue;
    }
    const data = (await res.json()) as { works?: OLWork[] };
    const works = (data.works ?? []).filter(
      (w) => w.title && w.authors?.length,
    );

    const toInsert: Partial<Book>[] = [];
    for (const work of works) {
      if (toInsert.length >= PER_GENRE) break;
      const key = work.title.toLowerCase().trim();
      if (seen.has(key)) continue;

      const description = await fetchDescription(work.key);
      await sleep(120);
      if (!description) continue; // skip works with no real description

      seen.add(key);
      const cost = randomBetween(150, 999);
      toInsert.push({
        name: work.title,
        description,
        author: work.authors!.map((a) => a.name).join(", "),
        genre,
        coverImage: work.cover_id
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
          : "",
        quantityAvailable: Math.floor(Math.random() * 8) + 3, // 3-10
        cost,
        rentPrice: Math.round((cost / 10) * 100) / 100,
        publishedDate: work.first_publish_year
          ? new Date(`${work.first_publish_year}-01-01`)
          : new Date(),
      });
    }

    if (toInsert.length === 0) {
      console.log(`No usable books found for ${genre} (${subject})`);
      continue;
    }

    const entities = bookRepository.create(toInsert);
    await bookRepository.save(entities);
    totalInserted += entities.length;
    console.log(`Inserted ${entities.length} books for ${genre}`);

    await sleep(200);
  }

  console.log(`\nDone. Total books inserted: ${totalInserted}`);
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
