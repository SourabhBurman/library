import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderStatusIndex1789972043944 implements MigrationInterface {
    name = 'AddOrderStatusIndex1789972043944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_fe2bef5a08ff878cc1ff6fc83c" ON "order" ("current_status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fe2bef5a08ff878cc1ff6fc83c"`);
    }

}
