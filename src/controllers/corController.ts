import { Request, Response } from 'express';
import { corModel } from '../models/cor';

// Cor Controllers
export const getCores = async (req: Request, res: Response) => {
  try {
    const cores = await corModel.findAll();
    const totalCores = await corModel.count();
    res.render('cadastros/cores/index', {
      cores,
      totalCores,
      title: 'Cor',
      currentPage: 'cor',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cores' });
  }
};

export const getNovaCor = (req: Request, res: Response) => {
  res.render('cadastros/cores/form', {
    cor: null,
    title: 'Nova Cor',
    currentPage: 'cor',
    layout: 'layouts/base',
    user: (req as any).user
  });
};

export const postCor = async (req: Request, res: Response) => {
  try {
    const { nome, codigo_hex, codigo_old, nome_old, legado } = req.body;

    const corData = {
      nome,
      codigo_hex: codigo_hex || undefined,
      codigo_old: codigo_old || undefined,
      nome_old: nome_old || undefined,
      legado: legado || undefined,
      ativo: 1
    };

    await corModel.create(corData);
    res.redirect('/cadastros/cores');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cor' });
  }
};

export const getEditarCor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cor = await corModel.findById(parseInt(id));

    if (!cor) {
      return res.status(404).json({ error: 'Cor não encontrada' });
    }

    res.render('cadastros/cores/form', {
      cor,
      title: 'Editar Cor',
      currentPage: 'cor',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cor' });
  }
};

export const putCor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, codigo_hex, codigo_old, nome_old, legado, ativo } = req.body;

    const corData = {
      nome,
      codigo_hex: codigo_hex || undefined,
      codigo_old: codigo_old || undefined,
      nome_old: nome_old || undefined,
      legado: legado || undefined,
      ativo: ativo ? 1 : 0
    };

    await corModel.update(parseInt(id), corData);
    res.redirect('/cadastros/cores');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cor' });
  }
};

export const deleteCor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await corModel.delete(parseInt(id));
    res.redirect('/cadastros/cores');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir cor' });
  }
};