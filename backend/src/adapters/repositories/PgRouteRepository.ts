import { v4 as uuidv4 } from 'uuid';
import pool from '../../infrastructure/db/pool';
import { Route } from '../../core/domain/entities';
import { IRouteRepository } from '../../core/ports';

function rowToRoute(row: Record<string, unknown>): Route {
  return {
    id: row.id as string,
    routeId: row.route_id as string,
    vesselType: row.vessel_type as string,
    fuelType: row.fuel_type as string,
    year: row.year as number,
    ghgIntensity: parseFloat(row.ghg_intensity as string),
    fuelConsumption: parseFloat(row.fuel_consumption as string),
    distance: parseFloat(row.distance as string),
    totalEmissions: parseFloat(row.total_emissions as string),
    isBaseline: row.is_baseline as boolean,
  };
}

export class PgRouteRepository implements IRouteRepository {
  async findAll(): Promise<Route[]> {
    const result = await pool.query('SELECT * FROM routes ORDER BY year, route_id');
    return result.rows.map(rowToRoute);
  }

  async findById(id: string): Promise<Route | null> {
    const result = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);
    return result.rows.length ? rowToRoute(result.rows[0]) : null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const result = await pool.query('SELECT * FROM routes WHERE route_id = $1', [routeId]);
    return result.rows.length ? rowToRoute(result.rows[0]) : null;
  }

  async findBaseline(): Promise<Route | null> {
    const result = await pool.query('SELECT * FROM routes WHERE is_baseline = TRUE LIMIT 1');
    return result.rows.length ? rowToRoute(result.rows[0]) : null;
  }

  async setBaseline(id: string): Promise<Route> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE routes SET is_baseline = FALSE');
      const result = await client.query(
        'UPDATE routes SET is_baseline = TRUE WHERE id = $1 RETURNING *',
        [id],
      );
      await client.query('COMMIT');
      if (!result.rows.length) throw new Error('Route not found');
      return rowToRoute(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async save(route: Omit<Route, 'id'>): Promise<Route> {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO routes (id, route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        id,
        route.routeId,
        route.vesselType,
        route.fuelType,
        route.year,
        route.ghgIntensity,
        route.fuelConsumption,
        route.distance,
        route.totalEmissions,
        route.isBaseline,
      ],
    );
    return rowToRoute(result.rows[0]);
  }
}
