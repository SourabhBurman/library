import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789971918561 implements MigrationInterface {
    name = 'InitialSchema1789971918561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permission" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "UQ_240853a0c3353c25fb12434ad33" UNIQUE ("name"), CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."role_type_enum" AS ENUM('Admin', 'Library_Owner', 'Reader')`);
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."role_type_enum" NOT NULL DEFAULT 'Reader', "displayName" character varying NOT NULL, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_history_transactiontype_enum" AS ENUM('Borrow', 'Return', 'Purchase')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_history_paymentstatus_enum" AS ENUM('Pending', 'Paid', 'Failed')`);
        await queryRunner.query(`CREATE TABLE "transaction_history" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "transactionType" "public"."transaction_history_transactiontype_enum" NOT NULL DEFAULT 'Borrow', "transactionDate" date NOT NULL DEFAULT ('now'::text)::date, "amount" integer, "paymentStatus" "public"."transaction_history_paymentstatus_enum" NOT NULL DEFAULT 'Pending', "stripePaymentIntentId" character varying, "orderId" integer, CONSTRAINT "PK_1e2444ea77f6b5952b4ab7cb9a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_current_status_enum" AS ENUM('Borrowed', 'Returned', 'Purchased', 'Cancelled')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "current_status" "public"."order_current_status_enum" NOT NULL DEFAULT 'Borrowed', "expectedReturnDate" TIMESTAMP, "userId" integer, "libraryBookId" integer, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_gender_enum" AS ENUM('Male', 'Female', 'Other')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "gender" "public"."user_gender_enum" NOT NULL DEFAULT 'Other', "email" character varying NOT NULL, "password" character varying NOT NULL, "balance" double precision NOT NULL DEFAULT '0', "refreshTokenHash" character varying, "refreshTokenExpiresAt" TIMESTAMP, "roleId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")); COMMENT ON COLUMN "user"."balance" IS 'Balance in INR'`);
        await queryRunner.query(`CREATE TABLE "library" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "address" character varying NOT NULL, "rating" integer, "balance" double precision NOT NULL DEFAULT '0', "ownerId" integer, CONSTRAINT "UQ_d28e85be2c9210de1f3757d0f29" UNIQUE ("name"), CONSTRAINT "REL_b53374c8dff4794db1675148ba" UNIQUE ("ownerId"), CONSTRAINT "CHK_67168c7569b5b59f3de7e231d6" CHECK (rating >= 0 AND rating <= 5), CONSTRAINT "PK_3a61ae2e897d9b5a59a64e91aa4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "library_book" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "totalQuantities" integer NOT NULL DEFAULT '1', "quantityAvailable" integer NOT NULL DEFAULT '1', "libraryId" integer, "bookId" integer, CONSTRAINT "PK_49d9035ea8ba398acb83a01bd99" PRIMARY KEY ("id")); COMMENT ON COLUMN "library_book"."totalQuantities" IS 'Total number of copies in this library'; COMMENT ON COLUMN "library_book"."quantityAvailable" IS 'Available copies to rent in this library'`);
        await queryRunner.query(`CREATE TABLE "review" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "rating" integer NOT NULL, "comment" character varying, "userId" integer, "bookId" integer, CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1b37ca6fa134b4d4cab7e476a9" ON "review" ("userId", "bookId") `);
        await queryRunner.query(`CREATE TYPE "public"."book_genre_enum" AS ENUM('Horror', 'Romance', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller', 'Adventure', 'Biography', 'History', 'Self Help', 'Business', 'Health', 'Drama', 'Finance', 'Technology', 'Other')`);
        await queryRunner.query(`CREATE TABLE "book" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL DEFAULT '', "coverImage" character varying NOT NULL DEFAULT '', "author" character varying NOT NULL DEFAULT '', "genre" "public"."book_genre_enum" NOT NULL DEFAULT 'Other', "quantityAvailable" integer NOT NULL DEFAULT '1', "cost" double precision, "rentPrice" double precision, "publishedDate" date, CONSTRAINT "PK_a3afef72ec8f80e6e5c310b28a4" PRIMARY KEY ("id")); COMMENT ON COLUMN "book"."cost" IS 'Price in INR'; COMMENT ON COLUMN "book"."rentPrice" IS 'Price in INR for a day'`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('DueSoon', 'Overdue', 'OrderUpdate', 'General')`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."notification_type_enum" NOT NULL DEFAULT 'General', "message" character varying NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "userId" integer, "orderId" integer, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "saved_book" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "bookId" integer, CONSTRAINT "PK_9531d8c34227971af8a56b00c5c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d0939f94fd63cb79246c476f62" ON "saved_book" ("userId", "bookId") `);
        await queryRunner.query(`CREATE TABLE "waitlist" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "bookId" integer, CONSTRAINT "PK_973cfbedc6381485681d6a6916c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_74bb31ed413106c4700eea1f5a" ON "waitlist" ("userId", "bookId") `);
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "actorId" character varying, "actorEmail" character varying NOT NULL, "action" character varying NOT NULL, "targetType" character varying NOT NULL, "targetId" character varying, "details" text, CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("roleId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_d430a02aad006d8a70f3acd7d03" PRIMARY KEY ("roleId", "permissionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b4599f8b8f548d35850afa2d12" ON "role_permissions" ("roleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_06792d0c62ce6b0203c03643cd" ON "role_permissions" ("permissionId") `);
        await queryRunner.query(`ALTER TABLE "transaction_history" ADD CONSTRAINT "FK_c2c80d8ab16af803d68e9fa3956" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_b0612cbfe253eb1ca9c200ce9c8" FOREIGN KEY ("libraryBookId") REFERENCES "library_book"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "library" ADD CONSTRAINT "FK_b53374c8dff4794db1675148ba9" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "library_book" ADD CONSTRAINT "FK_d229dc4fb5b5b2afef8dc087662" FOREIGN KEY ("libraryId") REFERENCES "library"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "library_book" ADD CONSTRAINT "FK_fda66b52367ccd0f5dc14c74487" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_1337f93918c70837d3cea105d39" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_ae1ec2fd91f77b5df325d1c7b4a" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_158290aea1aeac94f43ff5ac34b" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_book" ADD CONSTRAINT "FK_8681f8faa9a10d4a6e38b829c77" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_book" ADD CONSTRAINT "FK_78029ada0e37dc746bbae2f2374" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "waitlist" ADD CONSTRAINT "FK_753fb4a7680054d90a68b243ae2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "waitlist" ADD CONSTRAINT "FK_7cb4099d0611483c37408c85f40" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c"`);
        await queryRunner.query(`ALTER TABLE "waitlist" DROP CONSTRAINT "FK_7cb4099d0611483c37408c85f40"`);
        await queryRunner.query(`ALTER TABLE "waitlist" DROP CONSTRAINT "FK_753fb4a7680054d90a68b243ae2"`);
        await queryRunner.query(`ALTER TABLE "saved_book" DROP CONSTRAINT "FK_78029ada0e37dc746bbae2f2374"`);
        await queryRunner.query(`ALTER TABLE "saved_book" DROP CONSTRAINT "FK_8681f8faa9a10d4a6e38b829c77"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_158290aea1aeac94f43ff5ac34b"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_ae1ec2fd91f77b5df325d1c7b4a"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_1337f93918c70837d3cea105d39"`);
        await queryRunner.query(`ALTER TABLE "library_book" DROP CONSTRAINT "FK_fda66b52367ccd0f5dc14c74487"`);
        await queryRunner.query(`ALTER TABLE "library_book" DROP CONSTRAINT "FK_d229dc4fb5b5b2afef8dc087662"`);
        await queryRunner.query(`ALTER TABLE "library" DROP CONSTRAINT "FK_b53374c8dff4794db1675148ba9"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_b0612cbfe253eb1ca9c200ce9c8"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_caabe91507b3379c7ba73637b84"`);
        await queryRunner.query(`ALTER TABLE "transaction_history" DROP CONSTRAINT "FK_c2c80d8ab16af803d68e9fa3956"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06792d0c62ce6b0203c03643cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b4599f8b8f548d35850afa2d12"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_74bb31ed413106c4700eea1f5a"`);
        await queryRunner.query(`DROP TABLE "waitlist"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0939f94fd63cb79246c476f62"`);
        await queryRunner.query(`DROP TABLE "saved_book"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`DROP TABLE "book"`);
        await queryRunner.query(`DROP TYPE "public"."book_genre_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b37ca6fa134b4d4cab7e476a9"`);
        await queryRunner.query(`DROP TABLE "review"`);
        await queryRunner.query(`DROP TABLE "library_book"`);
        await queryRunner.query(`DROP TABLE "library"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_gender_enum"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_current_status_enum"`);
        await queryRunner.query(`DROP TABLE "transaction_history"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_history_paymentstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_history_transactiontype_enum"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TYPE "public"."role_type_enum"`);
        await queryRunner.query(`DROP TABLE "permission"`);
    }

}
