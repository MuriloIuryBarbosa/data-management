import { Request, Response } from 'express';
import { familiaModel } from '../models/familia';
import { tamanhoModel } from '../models/tamanho';
import { corModel } from '../models/cor';
import { ordemCompraModel } from '../models/ordemCompra';
import { OrdemCompraHistoricoModel } from '../models/ordemCompraHistorico';
import { pool } from '../models/database';

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
    console.log('Received data:', req.body);

    // Extrair itens do corpo da requisição
    const itens = req.body.itens;

    // Se não temos itens estruturados, verificar se é formato antigo
    if (!itens) {
      console.log('No structured items found, trying single item format');
      return await createOrdemCompraUnicoItem(req, res);
    }

    // Converter objeto de itens para array se necessário
    let itensArray = [];
    if (typeof itens === 'object' && !Array.isArray(itens)) {
      // Converter de object para array
      itensArray = Object.values(itens);
    } else if (Array.isArray(itens)) {
      itensArray = itens;
    }

    console.log('Processed items array:', itensArray);

    if (!itensArray || itensArray.length === 0) {
      return res.status(400).json({ error: 'A ordem de compra deve ter pelo menos um item' });
    }

    // Criar OC com múltiplos itens
    return await createOrdemCompraComItens(req, res, itensArray);
  } catch (error) {
    console.error('Erro ao criar ordem de compra:', error);
    res.status(500).json({ error: 'Erro ao criar ordem de compra' });
  }
};

// Função para criar OC com múltiplos itens (nova estrutura)
const createOrdemCompraComItens = async (req: Request, res: Response, itensArray?: any[]) => {
  try {
    // Se itensArray não foi passado, extrair do req.body
    let itens = itensArray;
    if (!itens) {
      const bodyItens = req.body.itens;
      if (typeof bodyItens === 'object' && !Array.isArray(bodyItens)) {
        itens = Object.values(bodyItens);
      } else {
        itens = bodyItens;
      }
    }

    console.log('Processing items:', itens);

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'A ordem de compra deve ter pelo menos um item' });
    }

    // Preparar dados dos itens
    const itensPreparados = [];
    for (const item of itens) {
      console.log('Processing item:', item);
      
      // Validar item
      if (!item.familia_id || !item.tamanho_id || !item.cor_id || !item.quantidade || !item.unidade_medida || !item.valor_unitario_brl) {
        console.error('Missing required fields in item:', item);
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos para cada item' });
      }

      // Buscar detalhes para gerar SKU
      const familia = await familiaModel.findById(parseInt(item.familia_id));
      const tamanho = await tamanhoModel.findById(parseInt(item.tamanho_id));
      const cor = await corModel.findById(parseInt(item.cor_id));

      if (!familia || !tamanho || !cor) {
        console.error('Invalid familia, tamanho or cor:', { familia_id: item.familia_id, tamanho_id: item.tamanho_id, cor_id: item.cor_id });
        return res.status(400).json({ error: 'Família, tamanho ou cor inválidos' });
      }

      // Preparar item
      const sku = item.sku || `${familia.nome}${tamanho.sigla || tamanho.nome}${cor.nome}`.toUpperCase().replace(/\s+/g, '');

      itensPreparados.push({
        familia_id: parseInt(item.familia_id),
        tamanho_id: parseInt(item.tamanho_id),
        cor_id: parseInt(item.cor_id),
        sku,
        quantidade: parseFloat(item.quantidade),
        unidade_medida: item.unidade_medida,
        valor_unitario_brl: parseFloat(item.valor_unitario_brl),
        valor_total_brl: parseFloat(item.quantidade) * parseFloat(item.valor_unitario_brl),
        cotacao_dolar: item.cotacao_dolar ? parseFloat(item.cotacao_dolar) : null,
        valor_unitario_usd: item.valor_unitario_usd ? parseFloat(item.valor_unitario_usd) : null,
        valor_total_usd: item.valor_unitario_usd ? parseFloat(item.quantidade) * parseFloat(item.valor_unitario_usd) : null,
        etd_planejado: item.etd_planejado || null,
        etd_proposto: null,
        etd_real: null,
        status: item.status || 'pendente'
      });
    }

    console.log('Prepared items:', itensPreparados);

    // Preparar dados da OC - extrair diretamente do req.body
    const ordemCompraData = {
      numero_oc: req.body.numero_oc || null,
      fornecedor: req.body.fornecedor || null,
      data_emissao: req.body.data_emissao || new Date().toISOString().split('T')[0],
      data_entrega_prevista: req.body.data_entrega_prevista || null,
      observacoes: req.body.observacoes || null,
      status: req.body.status_oc || 'rascunho'
    };

    console.log('OC data:', ordemCompraData);

    // Criar OC com itens
    const ordemCompraCriada = await ordemCompraModel.createWithItems(ordemCompraData, itensPreparados);

    console.log('OC created:', ordemCompraCriada);

    // Registrar histórico de criação
    const usuario = (req as any).user;
    await OrdemCompraHistoricoModel.registrarAlteracao(
      ordemCompraCriada.id,
      'ordem_compra',
      null,
      `Ordem de compra criada com ${itensPreparados.length} item(s)`,
      usuario?.id,
      usuario?.email,
      'criacao'
    );

    // Responder com sucesso e redirecionamento
    if (req.headers.accept?.includes('application/json')) {
      res.json({ id: ordemCompraCriada.id, message: 'Ordem de compra criada com sucesso' });
    } else {
      // Redirecionar para a página de visualização da OC criada
      res.redirect(`/planejamento/ordem-compra/${ordemCompraCriada.id}`);
    }
  } catch (error) {
    console.error('Erro ao criar OC com itens:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ error: 'Erro ao criar ordem de compra: ' + errorMessage });
  }
};

// Função para criar OC com único item (compatibilidade com estrutura antiga)
const createOrdemCompraUnicoItem = async (req: Request, res: Response) => {
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
      status: 'planejado'
    };

    const ordemCompraCriada = await ordemCompraModel.create(data);

    // Registrar histórico de criação
    const usuario = (req as any).user;
    await OrdemCompraHistoricoModel.registrarAlteracao(
      ordemCompraCriada.id,
      'ordem_compra',
      null,
      'Ordem de compra criada',
      usuario?.id,
      usuario?.email,
      'criacao'
    );

    res.redirect('/planejamento/ordem-compra');
  } catch (error) {
    console.error('Erro ao criar OC único item:', error);
    res.status(500).json({ error: 'Erro ao criar ordem de compra' });
  }
};

export const getVerOrdemCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ordemCompra = await ordemCompraModel.findById(parseInt(id));

    if (!ordemCompra) {
      return res.status(404).render('error', {
        message: 'Ordem de compra não encontrada',
        error: { status: 404 },
        title: 'Erro 404',
        layout: 'layouts/base',
        user: (req as any).user
      });
    }

    // Buscar detalhes relacionados
    const familia = ordemCompra.familia_id ? await familiaModel.findById(ordemCompra.familia_id) : null;
    const tamanho = ordemCompra.tamanho_id ? await tamanhoModel.findById(ordemCompra.tamanho_id) : null;
    const cor = ordemCompra.cor_id ? await corModel.findById(ordemCompra.cor_id) : null;

    res.render('planejamento/ordem-compra/ver', {
      ordemCompra,
      familia,
      tamanho,
      cor,
      title: `Ordem de Compra #${ordemCompra.id}`,
      currentPage: 'ordem-compra',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ordem de compra' });
  }
};

export const getEditarOrdemCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ordemCompra = await ordemCompraModel.findByIdWithItems(parseInt(id));

    if (!ordemCompra) {
      return res.status(404).render('error', {
        message: 'Ordem de compra não encontrada',
        error: { status: 404 },
        title: 'Erro 404',
        layout: 'layouts/base',
        user: (req as any).user
      });
    }

    const familias = await familiaModel.findAll();
    const tamanhos = await tamanhoModel.findAll();
    const cores = await corModel.findAll();

    res.render('planejamento/ordem-compra/editar', {
      ordemCompra,
      familias,
      tamanhos,
      cores,
      title: `Editar Ordem de Compra #${ordemCompra.id}`,
      currentPage: 'ordem-compra',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar formulário de edição' });
  }
};

export const getHistoricoOrdemCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ordemCompra = await ordemCompraModel.findById(parseInt(id));

    if (!ordemCompra) {
      return res.status(404).render('error', {
        message: 'Ordem de compra não encontrada',
        error: { status: 404 },
        title: 'Erro 404',
        layout: 'layouts/base',
        user: (req as any).user
      });
    }

    const historico = await OrdemCompraHistoricoModel.findByOrdemCompraId(parseInt(id));

    res.render('planejamento/ordem-compra/historico', {
      ordemCompra,
      historico,
      title: `Histórico - Ordem de Compra #${ordemCompra.id}`,
      currentPage: 'ordem-compra',
      layout: 'layouts/base',
      user: (req as any).user,
      // Helper functions for formatting
      getCampoLabel: (campo: string) => {
        const labels: { [key: string]: string } = {
          'familia_id': 'Família',
          'tamanho_id': 'Tamanho',
          'cor_id': 'Cor',
          'sku': 'SKU',
          'quantidade': 'Quantidade',
          'unidade_medida': 'Unidade de Medida',
          'valor_compra_brl': 'Valor em R$',
          'cotacao_dolar': 'Cotação do Dólar',
          'valor_compra_usd': 'Valor em USD',
          'etd_planejado': 'ETD Planejado',
          'etd_proposto': 'ETD Proposto',
          'etd_real': 'ETD Real',
          'status': 'Status'
        };
        return labels[campo] || campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      },
      formatarValor: (campo: string, valor: any) => {
        if (!valor) return 'N/A';

        // Campos numéricos
        if (['quantidade', 'valor_compra_brl', 'cotacao_dolar', 'valor_compra_usd'].includes(campo)) {
          const num = parseFloat(valor);
          if (!isNaN(num)) {
            if (campo.includes('valor')) {
              return 'R$ ' + num.toFixed(2);
            }
            return num.toString();
          }
        }

        // Campos de data
        if (campo.includes('etd') || campo.includes('data')) {
          try {
            const date = new Date(valor);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('pt-BR');
            }
          } catch (e) {
            // Se não conseguir formatar como data, continua
          }
        }

        // IDs de referência (família, tamanho, cor)
        if (campo.includes('_id')) {
          return `ID: ${valor}`;
        }

        // Status
        if (campo === 'status') {
          const statusLabels: { [key: string]: string } = {
            'planejado': 'Planejado',
            'aprovado': 'Aprovado',
            'em_transito': 'Em Trânsito',
            'recebido': 'Recebido',
            'cancelado': 'Cancelado'
          };
          return statusLabels[valor] || valor;
        }

        return valor;
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico da ordem de compra' });
  }
};

export const updateOrdemCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { numero_oc, fornecedor, status_oc, data_emissao, data_entrega_prevista, observacoes, itens, familia_id, tamanho_id, cor_id, quantidade, unidade_medida, valor_compra_brl, cotacao_dolar, etd_planejado, etd_proposto, etd_real } = req.body;

    // Get current order data for history comparison
    const ordemAtual = await ordemCompraModel.findByIdWithItems(parseInt(id));
    if (!ordemAtual) {
      return res.status(404).json({ error: 'Ordem de compra não encontrada' });
    }

    // Verificar se é a nova estrutura (com múltiplos itens) ou a antiga
    if (itens && (Array.isArray(itens) || typeof itens === 'object') && Object.keys(itens).length > 0) {
      // Nova estrutura: múltiplos itens
      return await updateOrdemCompraComItens(req, res);
    } else {
      // Estrutura antiga: compatibilidade
      return await updateOrdemCompraUnicoItem(req, res);
    }
  } catch (error) {
    console.error('Erro ao atualizar ordem de compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para atualizar OC com múltiplos itens (nova estrutura)
const updateOrdemCompraComItens = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { numero_oc, fornecedor, status_oc, data_emissao, data_entrega_prevista, observacoes, itens } = req.body;

    if (!itens || (!Array.isArray(itens) && typeof itens !== 'object') || Object.keys(itens).length === 0) {
      return res.status(400).json({ error: 'A ordem de compra deve ter pelo menos um item' });
    }

    // Preparar dados dos itens
    const itensPreparados = [];
    const itensArray = Array.isArray(itens) ? itens : Object.values(itens);

    for (const item of itensArray) {
      // Validar item
      if (!item.familia_id || !item.tamanho_id || !item.cor_id || !item.quantidade || !item.unidade_medida || !item.valor_unitario_brl) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos para cada item' });
      }

      // Buscar detalhes para gerar SKU
      const familia = await familiaModel.findById(parseInt(item.familia_id));
      const tamanho = await tamanhoModel.findById(parseInt(item.tamanho_id));
      const cor = await corModel.findById(parseInt(item.cor_id));

      if (!familia || !tamanho || !cor) {
        return res.status(400).json({ error: 'Família, tamanho ou cor inválidos' });
      }

      // Preparar item
      const sku = item.sku || `${familia.nome}${tamanho.sigla || tamanho.nome}${cor.nome}`.toUpperCase().replace(/\s+/g, '');

      itensPreparados.push({
        familia_id: parseInt(item.familia_id),
        tamanho_id: parseInt(item.tamanho_id),
        cor_id: parseInt(item.cor_id),
        sku,
        quantidade: parseFloat(item.quantidade),
        unidade_medida: item.unidade_medida,
        valor_unitario_brl: parseFloat(item.valor_unitario_brl),
        cotacao_dolar: parseFloat(item.cotacao_dolar || 5.0),
        valor_total_brl: parseFloat(item.quantidade) * parseFloat(item.valor_unitario_brl),
        status: item.status || 'pendente',
        etd_planejado: item.etd_planejado || null
      });
    }

    // Calcular totais da OC
    const valor_total_brl = itensPreparados.reduce((sum, item) => sum + item.valor_total_brl, 0);
    const valor_total_usd = itensPreparados.reduce((sum, item) => sum + (item.valor_total_brl / item.cotacao_dolar), 0);

    // Preparar dados da OC
    const ordemCompraData = {
      numero_oc: numero_oc || null,
      fornecedor: fornecedor || null,
      status: status_oc || 'rascunho',
      data_emissao: data_emissao || null,
      data_entrega_prevista: data_entrega_prevista || null,
      observacoes: observacoes || null,
      valor_total_brl,
      valor_total_usd
    };

    // Atualizar OC com itens
    const success = await ordemCompraModel.updateWithItems(parseInt(id), ordemCompraData, itensPreparados);

    if (success) {
      res.redirect(`/planejamento/ordem-compra/${id}`);
    } else {
      res.status(500).json({ error: 'Erro ao atualizar ordem de compra' });
    }
  } catch (error) {
    console.error('Erro ao atualizar ordem de compra com itens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para atualizar OC com único item (compatibilidade)
const updateOrdemCompraUnicoItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { familia_id, tamanho_id, cor_id, quantidade, unidade_medida, valor_compra_brl, cotacao_dolar, etd_planejado, etd_proposto, etd_real } = req.body;

    // Get current order data for history comparison
    const ordemAtual = await ordemCompraModel.findById(parseInt(id));
    if (!ordemAtual) {
      return res.status(404).json({ error: 'Ordem de compra não encontrada' });
    }

    // Get details to compose SKU
    const familia = await familiaModel.findById(parseInt(familia_id));
    const tamanho = await tamanhoModel.findById(parseInt(tamanho_id));
    const cor = await corModel.findById(parseInt(cor_id));

    if (!familia || !tamanho || !cor) {
      return res.status(400).json({ error: 'Família, tamanho ou cor inválidos' });
    }

    // Compose SKU
    const sku = `${familia.nome}${tamanho.nome}${cor.nome}`;

    // Prepare update data
    const updateData = {
      familia_id: parseInt(familia_id),
      tamanho_id: parseInt(tamanho_id),
      cor_id: parseInt(cor_id),
      sku,
      quantidade: parseInt(quantidade),
      unidade_medida,
      valor_compra_brl: parseFloat(valor_compra_brl),
      cotacao_dolar: parseFloat(cotacao_dolar),
      etd_planejado: etd_planejado || null,
      etd_proposto: etd_proposto || null,
      etd_real: etd_real || null
    };

    // Update the order
    const success = await ordemCompraModel.update(parseInt(id), updateData);

    if (success) {
      // Log changes to history
      await OrdemCompraHistoricoModel.registrarAlteracoes(
        parseInt(id),
        ordemAtual,
        updateData,
        (req as any).user?.id,
        (req as any).user?.email || 'Sistema'
      );

      res.redirect(`/planejamento/ordem-compra/${id}`);
    } else {
      res.status(500).json({ error: 'Erro ao atualizar ordem de compra' });
    }
  } catch (error) {
    console.error('Erro ao atualizar ordem de compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Aprovar Ordem de Compra
export const approveOrdemCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ordemCompra = await ordemCompraModel.findById(parseInt(id));

    if (!ordemCompra) {
      return res.status(404).json({ error: 'Ordem de compra não encontrada' });
    }

    // Verificar se já está aprovado
    if (ordemCompra.status === 'aprovado') {
      return res.status(400).json({ error: 'Esta ordem de compra já foi aprovada' });
    }

    // Verificar se pode ser aprovado (só ordens planejadas podem ser aprovadas)
    if (ordemCompra.status !== 'planejado') {
      return res.status(400).json({ error: 'Apenas ordens de compra com status "planejado" podem ser aprovadas' });
    }

    // Atualizar status para aprovado
    const success = await ordemCompraModel.update(parseInt(id), { status: 'aprovado' });

    if (success) {
      // Registrar no histórico
      await OrdemCompraHistoricoModel.registrarAlteracao(
        parseInt(id),
        'status',
        ordemCompra.status,
        'aprovado',
        (req as any).user?.id,
        (req as any).user?.email || 'Sistema',
        'edicao'
      );

      res.json({
        success: true,
        message: 'Ordem de compra aprovada com sucesso',
        redirectUrl: `/planejamento/purchase-order/${id}`
      });
    } else {
      res.status(500).json({ error: 'Erro ao aprovar ordem de compra' });
    }
  } catch (error) {
    console.error('Erro ao aprovar ordem de compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Purchase Order Controllers
export const getPurchaseOrder = async (req: Request, res: Response) => {
  try {
    // Buscar apenas ordens de compra aprovadas
    const ordensCompra = await ordemCompraModel.findAllWithDetails();
    const purchaseOrders = ordensCompra.filter(oc => oc.status === 'aprovado');

    res.render('planejamento/purchase-order/index', {
      purchaseOrders,
      title: 'Purchase Order',
      currentPage: 'purchase-order',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    console.error('Erro ao buscar purchase orders:', error);
    res.status(500).json({ error: 'Erro ao buscar purchase orders' });
  }
};

export const getVerPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ordemCompra = await ordemCompraModel.findByIdWithItems(parseInt(id));

    if (!ordemCompra) {
      return res.status(404).render('error', {
        error: 'Purchase Order não encontrada',
        title: 'Erro 404',
        layout: 'layouts/base',
        user: (req as any).user
      });
    }

    // Verificar se é uma purchase order (aprovada)
    if (ordemCompra.status !== 'aprovado') {
      return res.status(403).render('error', {
        error: 'Esta ordem ainda não foi aprovada para Purchase Order',
        title: 'Acesso Negado',
        layout: 'layouts/base',
        user: (req as any).user
      });
    }

    res.render('planejamento/purchase-order/ver', {
      ordemCompra,
      title: `Purchase Order #${ordemCompra.id}`,
      currentPage: 'purchase-order',
      layout: 'layouts/base',
      user: (req as any).user
    });
  } catch (error) {
    console.error('Erro ao buscar purchase order:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updatePurchaseOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validar status permitido
    const statusPermitidos = ['aprovado', 'em_transito', 'recebido'];
    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Buscar a ordem de compra
    const ordemCompra = await ordemCompraModel.findById(parseInt(id));
    if (!ordemCompra) {
      return res.status(404).json({ error: 'Purchase Order não encontrada' });
    }

    // Verificar se é uma purchase order (aprovada)
    if (ordemCompra.status !== 'aprovado' && ordemCompra.status !== 'em_transito') {
      return res.status(403).json({ error: 'Esta ordem não está no fluxo de Purchase Order' });
    }

    // Validar transição de status
    if (ordemCompra.status === 'aprovado' && status !== 'em_transito') {
      return res.status(400).json({ error: 'De "aprovado" só pode ir para "em_transito"' });
    }

    if (ordemCompra.status === 'em_transito' && status !== 'recebido') {
      return res.status(400).json({ error: 'De "em_transito" só pode ir para "recebido"' });
    }

    // Atualizar status
    await ordemCompraModel.update(parseInt(id), { status });

    // Registrar no histórico
    await OrdemCompraHistoricoModel.create({
      ordem_compra_id: parseInt(id),
      campo_alterado: 'status',
      valor_anterior: ordemCompra.status,
      valor_novo: status,
      usuario_nome: (req as any).user?.nome || 'Sistema',
      tipo_alteracao: 'edicao'
    });

    res.json({
      success: true,
      message: 'Status da Purchase Order atualizado com sucesso',
      novoStatus: status
    });
  } catch (error) {
    console.error('Erro ao atualizar status da purchase order:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteOrdemCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const ordemCompraId = Number(id);

    // Verificar se a ordem de compra existe
    const ordemCompra = await ordemCompraModel.findById(ordemCompraId);
    if (!ordemCompra) {
      return res.status(404).json({ error: 'Ordem de compra não encontrada' });
    }

    // Verificar se a ordem pode ser excluída (não está aprovada)
    if (ordemCompra.status === 'aprovado') {
      return res.status(400).json({
        error: 'Não é possível excluir uma ordem de compra aprovada. Use o fluxo de Purchase Order para gerenciar ordens aprovadas.'
      });
    }

    // Excluir histórico relacionado primeiro
    await OrdemCompraHistoricoModel.deleteByOrdemCompraId(ordemCompraId);

    // Excluir itens relacionados
    const { OrdemCompraItemModel } = await import('../models/ordemCompraItem');
    if (ordemCompra.numero_oc) {
        await OrdemCompraItemModel.deleteByNumeroOC(ordemCompra.numero_oc);
    }

    // Excluir a ordem de compra
    const deleted = await ordemCompraModel.delete(ordemCompraId);

    if (deleted) {
      res.json({ success: true, message: 'Ordem de compra excluída com sucesso' });
    } else {
      res.status(500).json({ error: 'Erro ao excluir ordem de compra' });
    }
  } catch (error) {
    console.error('Erro ao excluir ordem de compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Dashboard Controller
export const getDashboard = async (req: Request, res: Response) => {
  try {
    console.log('📊 Carregando dashboard de planejamento...');

    const conn = await pool.getConnection();

    try {
      // 1. Dados gerais de faturamento
      const [faturamentoGeral] = await conn.execute(`
        SELECT
          SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_total,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade_total,
          COUNT(*) as total_registros
        FROM tab_dados_faturamento
        WHERE INDICADOR = 'Faturamento'
          AND VALOR IS NOT NULL
          AND QTDE IS NOT NULL
          AND VALOR != ''
          AND QTDE != ''
      `);

      // 2. Dados por empresa
      const [faturamentoPorEmpresa] = await conn.execute(`
        SELECT
          Empresa,
          SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_total,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade_total,
          COUNT(*) as total_registros
        FROM tab_dados_faturamento
        WHERE INDICADOR = 'Faturamento'
          AND VALOR IS NOT NULL
          AND QTDE IS NOT NULL
          AND VALOR != ''
          AND QTDE != ''
        GROUP BY Empresa
        ORDER BY valor_total DESC
      `);

      // 3. Dados por mês (últimos 12 meses)
      const [faturamentoPorMes] = await conn.execute(`
        SELECT
          CONCAT(Ano, '-', LPAD(Mes, 2, '0')) as periodo,
          SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_total,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade_total,
          COUNT(*) as total_registros
        FROM tab_dados_faturamento
        WHERE INDICADOR = 'Faturamento'
          AND VALOR IS NOT NULL
          AND QTDE IS NOT NULL
          AND VALOR != ''
          AND QTDE != ''
          AND Ano IS NOT NULL
          AND Mes IS NOT NULL
        GROUP BY Ano, Mes
        ORDER BY Ano DESC, Mes DESC
        LIMIT 12
      `);

      // 4. Top famílias por faturamento
      const [topFamilias] = await conn.execute(`
        SELECT
          \`Codigo Familia\` as familia,
          SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_total,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade_total
        FROM tab_dados_faturamento
        WHERE INDICADOR = 'Faturamento'
          AND VALOR IS NOT NULL
          AND QTDE IS NOT NULL
          AND VALOR != ''
          AND QTDE != ''
          AND \`Codigo Familia\` IS NOT NULL
          AND \`Codigo Familia\` != ''
        GROUP BY \`Codigo Familia\`
        ORDER BY valor_total DESC
        LIMIT 10
      `);

      // 5. Dados de estoque atual
      const [estoqueAtual] = await conn.execute(`
        SELECT
          SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_estoque,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade_estoque,
          COUNT(*) as total_itens_estoque
        FROM tab_dados_estoque
        WHERE INDICADOR = 'Estoque'
          AND VALOR IS NOT NULL
          AND QTDE IS NOT NULL
          AND VALOR != ''
          AND QTDE != ''
      `);

      // 6. Dados de business plan
      const [businessPlan] = await conn.execute(`
        SELECT
          SUM(CAST(VALOR AS DECIMAL(15,2))) as valor_planejado,
          SUM(CAST(QTDE AS DECIMAL(15,2))) as quantidade_planejada,
          COUNT(*) as total_itens_planejados
        FROM tab_dados_business_plan
        WHERE INDICADOR = 'Business Plan'
          AND VALOR IS NOT NULL
          AND QTDE IS NOT NULL
          AND VALOR != ''
          AND QTDE != ''
      `);

      const dashboardData = {
        faturamentoGeral: (faturamentoGeral as any)[0],
        faturamentoPorEmpresa: faturamentoPorEmpresa as any,
        faturamentoPorMes: (faturamentoPorMes as any).reverse(), // Inverter para mostrar do mais antigo para o mais recente
        topFamilias: topFamilias as any,
        estoqueAtual: (estoqueAtual as any)[0],
        businessPlan: (businessPlan as any)[0]
      };

      console.log('✅ Dashboard carregado com sucesso');

      res.render('planejamento/dashboard/index', {
        dashboardData,
        title: 'Dashboard de Planejamento',
        currentPage: 'dashboard',
        layout: 'layouts/base',
        user: (req as any).user
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('❌ Erro ao carregar dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};