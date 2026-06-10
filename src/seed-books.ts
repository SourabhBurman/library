import "dotenv/config";
import { DBModle, bookRepository } from "./config/db.connection";
import { BOOK_GENRE } from "./enums";
import { Book } from "./entity/books.entity";

export const seedBooks = async () => {
  await DBModle.connect();

  try {
    // Clean existing data from Book table
    console.log("Cleaning existing books data...");
    await bookRepository.query("TRUNCATE TABLE book CASCADE;");
    console.log("Books data cleared.");

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
      "Chronicles of",
      "Echoes of",
      "Lost in",
    ];
    const nouns = [
      "Mountains",
      "Code",
      "Space",
      "Oceans",
      "Time",
      "Magic",
      "History",
      "Empires",
      "Shadows",
      "Dreams",
    ];
    const authors = [
      "J.K. Rowling",
      "George R.R. Martin",
      "J.R.R. Tolkien",
      "Isaac Asimov",
      "Arthur C. Clarke",
      "Jane Austen",
      "Mark Twain",
      "Stephen King",
      "Agatha Christie",
      "Neil Gaiman",
    ];

    const covers = [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
    ];

    for (let i = 1; i <= 100; i++) {
      const randomGenre = genres[Math.floor(Math.random() * genres.length)];
      const price = Math.floor(Math.random() * 800) + 200;
      const qty = Math.floor(Math.random() * 30) + 5;

      const randomAdjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const randomCover = covers[Math.floor(Math.random() * covers.length)];

      books.push({
        name: `${randomAdjective} ${randomNoun} Vol. ${i}`,
        description: `This is a generated description for an exciting ${randomGenre} book. A must-read classic!`,
        genre: randomGenre,
        quantityAvailable: qty,
        cost: price,
        rentPrice: Math.floor(price * 0.1), // Rent is 10% of cost
        publishedDate: new Date(
          new Date().getTime() - Math.random() * 100000000000,
        ),
        author: randomAuthor,
        coverImage: randomCover,
      });
    }

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
