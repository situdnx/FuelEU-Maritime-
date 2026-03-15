import { v4 as uuidv4 } from 'uuid';
import pool from '../../infrastructure/db/pool';
import { BankEntry } from '../../core/domain/entities';
import { IBankRepository } from '../../core/ports';

function rowToEntry(row: Record<string, unknown>): BankEntry {
  return {
    id: row.id as string,
    shipId: row.ship_id as string,
    year: row.year as number,
    amountGco2eq: parseFloat(row.amount_gco2eq as string),
    createdAt: row.created_at as Date,
  };
}

export class PgBankRepository implements IBankRepository {
  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const result = await pool.query(
      'SELECT * FROM bank_entries WHERE ship_id = $1 AND year = $2 ORDER BY created_at',
      [shipId, year],
    );
    return result.rows.map(rowToEntry);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const result = await pool.query(
      'SELECT COALESCE(SUM(amount_gco2eq), 0) as total FROM bank_entries WHERE ship_id = $1 AND year = $2',
      [shipId, year],
    );
    return parseFloat(result.rows[0].total);
  }

  async save(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry> {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO bank_entries (id, ship_id, year, amount_gco2eq) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, entry.shipId, entry.year, entry.amountGco2eq],
    );
    return rowToEntry(result.rows[0]);
  }

  async deductAmount(shipId: string, year: number, amount: number): Promise<void> {
    // Deduct from most recent entries first (FIFO consumption)
    const entries = await this.findByShipAndYear(shipId, year);
    let remaining = amount;

    for (const entry of entries) {
      if (remaining <= 0) break;
      if (entry.amountGco2eq <= remaining) {
        await pool.query('DELETE FROM bank_entries WHERE id = $1', [entry.id]);
        remaining -= entry.amountGco2eq;
      } else {
        await pool.query(
          'UPDATE bank_entries SET amount_gco2eq = amount_gco2eq - $1 WHERE id = $2',
          [remaining, entry.id],
        );
        remaining = 0;
      }
    }
  }
}
