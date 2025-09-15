import { Request, Response } from 'express';

// Planejamento Controllers
export const getOrdemCompra = async (req: Request, res: Response) => {
  try {
    // TODO: Implementar lógica para buscar ordens de compra
    const ordensCompra: any[] = []; // Placeholder para dados

    res.render('planejamento/ordem-compra/index', {
      ordensCompra,
      title: 'Ordem de Compra',
      currentPage: 'ordem-compra',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ordens de compra' });
  }
};