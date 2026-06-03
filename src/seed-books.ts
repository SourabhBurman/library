import "dotenv/config";
import { DBModle, bookRepository } from "./config/db.connection";
import { BOOK_GENRE } from "./enums";
import { Book } from "./entity/books.entity";

export const seedBooks = async () => {
  await DBModle.connect();

  const books: Partial<Book>[] = [];
  const genres = Object.values(BOOK_GENRE);
  const adjectives = [
    "The Great",
    "Secrets of",
    "Mystery of",
    "Return of",
    "Journey to",
    "Advanced",
    "Mastering",
  ];
  const nouns = [
    "Mountains",
    "Code",
    "Space",
    "Oceans",
    "Time",
    "Magic",
    "History",
  ];

  for (let i = 1; i <= 50; i++) {
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const price = Math.floor(Math.random() * 800) + 200;
    const qty = Math.floor(Math.random() * 30) + 5;

    // Generate a cool semi-random title
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    books.push({
      name: `${randomAdjective} ${randomNoun} Vol. ${i}`,
      description: `This is a generated description for an exciting ${randomGenre} book. A must-read classic!`,
      genre: randomGenre,
      totalQuantities: qty,
      quantityAvailable: qty,
      cost: price,
      rentPrice: Math.floor(price * 0.1), // Rent is 10% of cost
      publishedDate: new Date(
        new Date().getTime() - Math.random() * 100000000000,
      ),
    });
  }

  try {
    const createdBooks = bookRepository.create(books);
    await bookRepository.save(createdBooks);
    console.log(
      `✅ Successfully seeded ${books.length} dummy books into the database!`,
    );
  } catch (error) {
    console.error("❌ Failed to seed books:", error);
  } finally {
    await DBModle.dbInstance.destroy();
  }
};
