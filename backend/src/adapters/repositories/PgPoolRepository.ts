import { v4 as uuidv4 } from 'uuid';
import pool from '../../infrastructure/db/pool';
import { Pool, PoolMember } from '../../core/domain/entities';
import { IPoolRepository } from '../../core/ports';

export class PgPoolRepository implements IPoolRepository {
  async create(year: number): Promise<Pool> {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO pools (id, year) VALUES ($1, $2) RETURNING *',
      [id, year],
    );
    return { id: result.rows[0].id, year: result.rows[0].year, createdAt: result.rows[0].created_at, members: [] };
  }

  async addMember(poolId: string, member: Omit<PoolMember, 'poolId'>): Promise<PoolMember> {
    await pool.query(
      'INSERT INTO pool_members (pool_id, ship_id, cb_before, cb_after) VALUES ($1,$2,$3,$4)',
      [poolId, member.shipId, member.cbBefore, member.cbAfter],
    );
    return { poolId, ...member };
  }

  async findById(id: string): Promise<Pool | null> {
    const poolResult = await pool.query('SELECT * FROM pools WHERE id = $1', [id]);
    if (!poolResult.rows.length) return null;
    const membersResult = await pool.query(
      'SELECT * FROM pool_members WHERE pool_id = $1',
      [id],
    );
    return {
      id: poolResult.rows[0].id,
      year: poolResult.rows[0].year,
      createdAt: poolResult.rows[0].created_at,
      members: membersResult.rows.map((r) => ({
        poolId: r.pool_id,
        shipId: r.ship_id,
        cbBefore: parseFloat(r.cb_before),
        cbAfter: parseFloat(r.cb_after),
      })),
    };
  }

  async findAllWithMembers(): Promise<Pool[]> {
    const poolsResult = await pool.query('SELECT * FROM pools ORDER BY created_at DESC');
    return Promise.all(poolsResult.rows.map((r) => this.findById(r.id) as Promise<Pool>));
  }
}
