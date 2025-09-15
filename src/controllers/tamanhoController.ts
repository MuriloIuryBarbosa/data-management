import { Request, Response } from 'express';
import { tamanhoModel } from '../models/tamanho';

// Tamanho Controllers
export const getTamanhos = async (req: Request, res: Response) => {
  try {
    const tamanhos = await tamanhoModel.findAll();
    res.render('cadastros/tamanhos/index', {
      tamanhos,
      title: 'Tamanho',
      currentPage: 'tamanho',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tamanhos' });
  }
};

export const getNovoTamanho = (req: Request, res: Response) => {
  res.render('cadastros/tamanhos/form', {
    tamanho: null,
    title: 'Novo Tamanho',
    currentPage: 'tamanho',
    layout: 'layouts/base',
    user: (req as any).user
  });
};

export const postTamanho = async (req: Request, res: Response) => {
  try {
    const { nome, sigla, ordem, codigo_old, nome_old, legado } = req.body;

    const tamanhoData = {
      nome,
      sigla: sigla || undefined,
      ordem: ordem ? parseInt(ordem) : undefined,
      codigo_old: codigo_old || undefined,
      nome_old: nome_old || undefined,
      legado: legado || undefined,
      ativo: 1
    };

    await tamanhoModel.create(tamanhoData);
    res.redirect('/cadastros/tamanhos');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tamanho' });
  }
};

export const getEditarTamanho = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tamanho = await tamanhoModel.findById(parseInt(id));

    if (!tamanho) {
      return res.status(404).json({ error: 'Tamanho não encontrado' });
    }

    res.render('cadastros/tamanhos/form', {
      tamanho,
      title: 'Editar Tamanho',
      currentPage: 'tamanho',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tamanho' });
  }
};

export const putTamanho = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, sigla, ordem, codigo_old, nome_old, legado, ativo } = req.body;

    const tamanhoData = {
      nome,
      sigla: sigla || undefined,
      ordem: ordem ? parseInt(ordem) : undefined,
      codigo_old: codigo_old || undefined,
      nome_old: nome_old || undefined,
      legado: legado || undefined,
      ativo: ativo ? 1 : 0
    };

    await tamanhoModel.update(parseInt(id), tamanhoData);
    res.redirect('/cadastros/tamanhos');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tamanho' });
  }
};

export const deleteTamanho = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await tamanhoModel.delete(parseInt(id));
    res.redirect('/cadastros/tamanhos');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir tamanho' });
  }
};