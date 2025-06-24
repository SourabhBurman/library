import { DBModle } from "../../../config/db.connection";
import { Reader } from "../../../entity/user.entity";

const readerRepository = DBModle.dbInstance.getRepository(Reader);

// export const readerMutation = {
//   createReader: async (_, args: { input: Reader }) => {
//     const { books, gender, name } = args.input;
//     try {
//       const newReader = readerRepository.create({ name, gender, books });

//       const savedReader = await readerRepository.save(newReader);
//       const returnReader = await readerRepository.findOne({
//         where: { id: savedReader.id },
//         relations: ["books"],
//       });
//       return returnReader;
//     } catch (error) {
//       console.error("Error creating reader:", error);
//       //   throw new Error(error);
//     }
//   },
// };
