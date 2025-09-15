import { Request, Response } from 'express';
import { familiaModel } from '../models/familia';
import { tamanhoModel } from '../models/tamanho';
import { corModel } from '../models/cor';

// Familia Controllers
export const getFamilias = async (req: Request, res: Response) => {
  try {
    const familias = await familiaModel.findAll();
    const totalFamilias = await familiaModel.count();
    res.render('cadastros/familias/index', {
      familias,
      totalFamilias,
      title: 'Família',
      currentPage: 'familia',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar famílias' });
  }
};

export const getNovaFamilia = (req: Request, res: Response) => {
  res.render('cadastros/familias/form', {
    familia: null,
    title: 'Nova Família',
    currentPage: 'familia',
    layout: 'layouts/base',
    user: (req as any).user
  });
};

export const postFamilia = async (req: Request, res: Response) => {
  try {
    const { nome, descricao, codigo_old, nome_old, legado } = req.body;

    const familiaData = {
      nome,
      descricao: descricao || null,
      codigo_old: codigo_old || null,
      nome_old: nome_old || null,
      legado: legado || null,
      ativo: 1
    };

    await familiaModel.create(familiaData);
    res.redirect('/cadastros/familias');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar família' });
  }
};

export const getEditarFamilia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const familia = await familiaModel.findById(parseInt(id));

    if (!familia) {
      return res.status(404).json({ error: 'Família não encontrada' });
    }

    res.render('cadastros/familias/form', {
      familia,
      title: 'Editar Família',
      currentPage: 'familia',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar família' });
  }
};

export const putFamilia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao, codigo_old, nome_old, legado, ativo } = req.body;

    const familiaData = {
      nome,
      descricao: descricao || null,
      codigo_old: codigo_old || null,
      nome_old: nome_old || null,
      legado: legado || null,
      ativo: ativo ? 1 : 0
    };

    await familiaModel.update(parseInt(id), familiaData);
    res.redirect('/cadastros/familias');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar família' });
  }
};

export const deleteFamilia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await familiaModel.delete(parseInt(id));
    res.redirect('/cadastros/familias');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir família' });
  }
};