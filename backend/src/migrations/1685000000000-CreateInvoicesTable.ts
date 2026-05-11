import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateInvoicesTable1685000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'invoice_number',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'created_by_id',
            type: 'uuid',
          },
          {
            name: 'payment_type',
            type: 'enum',
            enum: ['invoice', 'bank_transfer', 'check', 'cash', 'wire_transfer', 'other'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'sent', 'pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
            default: "'draft'",
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'amount_paid',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'due_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'issued_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'paid_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'bank_account_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bank_routing_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bank_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bank_account_holder',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'check_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'check_received_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'invoice_pdf_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sent_to_email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email_sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'approved_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'approval_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reference_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['created_by_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['approved_by_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        columnNames: ['due_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('invoices');
  }
}
