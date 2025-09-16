import { Request, Response } from 'express';
import { familiaModel } from '../models/familia';
import { tamanhoModel } from '../models/tamanho';
import { corModel } from '../models/cor';
import { ordemCompraModel } from '../models/ordemCompra';

// Planejamento Controllers
export const getOrdemCompra = async (req: Request, res: Response) => {
  try {
    const ordensCompra = await ordemCompraModel.findAllWithDetails();

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

export const getNovoOrdemCompra = async (req: Request, res: Response) => {
  try {
    const familias = await familiaModel.findAll();
    const tamanhos = await tamanhoModel.findAll();
    const cores = await corModel.findAll();

    res.render('planejamento/ordem-compra/novo', {
      familias,
      tamanhos,
      cores,
      title: 'Nova Ordem de Compra',
      currentPage: 'ordem-compra',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar formulário' });
  }
};

export const createOrdemCompra = async (req: Request, res: Response) => {
  try {
    const { familia_id, tamanho_id, cor_id, quantidade, unidade_medida, valor_compra_brl, cotacao_dolar, etd_planejado, etd_proposto, etd_real } = req.body;

    // Get details to compose SKU
    const familia = await familiaModel.findById(parseInt(familia_id));
    const tamanho = await tamanhoModel.findById(parseInt(tamanho_id));
    const cor = await corModel.findById(parseInt(cor_id));

    if (!familia || !tamanho || !cor) {
      return res.status(400).json({ error: 'Família, tamanho ou cor inválidos' });
    }

    const sku = `${familia.nome}-${tamanho.sigla || tamanho.nome}-${cor.nome}`;

    const valor_compra_usd = parseFloat(valor_compra_brl) / parseFloat(cotacao_dolar);

    const data = {
      familia_id: parseInt(familia_id),
      tamanho_id: parseInt(tamanho_id),
      cor_id: parseInt(cor_id),
      sku,
      quantidade: parseFloat(quantidade),
      unidade_medida,
      valor_compra_brl: parseFloat(valor_compra_brl),
      cotacao_dolar: parseFloat(cotacao_dolar),
      valor_compra_usd,
      etd_planejado,
      etd_proposto: etd_proposto || null,
      etd_real: etd_real || null,
      status: 'planejado',
      ativo: 1
    };

    await ordemCompraModel.create(data);

    res.redirect('/planejamento/ordem-compra');
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar ordem de compra' });
  }
};