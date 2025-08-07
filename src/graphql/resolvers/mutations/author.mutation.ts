import { DBModle } from "../../../config/db.connection";
import { Author } from "../../../entity/author.entity";

const authorRepository = DBModle.dbInstance.getRepository(Author);

export const authorMutation = {
  addAuthor: async (_: unknown, args: { input: Author }) => {
    const { age, name, publishedBooks, email } = args.input;

    try {
      const newAuthor = authorRepository.create({
        age,
        name,
        publishedBooks,
        email,
      });

      const savedAuthor = await authorRepository.save(newAuthor);

      const returnedBook = await authorRepository.findOne({
        where: { id: savedAuthor.id },
        relations: ["books"],
      });
      console.log("Author created successfully:", returnedBook);
      return returnedBook;
    } catch (error) {
      console.error("Error creating author:", error);
    }
  },
};
