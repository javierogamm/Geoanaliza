import app from '../backend/src/app';

export default function handler(req: unknown, res: unknown) {
  // Delegamos todas las rutas /api a la aplicación Express existente
  return (app as unknown as (req: unknown, res: unknown) => void)(req, res);
}
