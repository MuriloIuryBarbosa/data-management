const mysql = require('mysql2/promise');

// Script para demonstrar o histórico melhorado
async function demonstrarHistorico() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456789',
      database: 'datalake'
    });

    console.log('🔍 Demonstrando Histórico Melhorado de Ordens de Compra\n');

    // Buscar ordens de compra com histórico
    const [ordens] = await connection.execute(`
      SELECT oc.id, oc.sku, COUNT(h.id) as total_alteracoes
      FROM ordem_compra oc
      LEFT JOIN ordem_compra_historico h ON oc.id = h.ordem_compra_id
      GROUP BY oc.id, oc.sku
      HAVING total_alteracoes > 0
      ORDER BY oc.id DESC
      LIMIT 3
    `);

    if (ordens.length === 0) {
      console.log('📝 Nenhuma ordem de compra com histórico encontrada.');
      console.log('💡 Para testar:');
      console.log('   1. Crie uma nova ordem de compra');
      console.log('   2. Edite alguns campos');
      console.log('   3. Visualize o histórico em /planejamento/ordem-compra/{id}/historico');
      return;
    }

    console.log(`📊 Encontradas ${ordens.length} ordens de compra com histórico:\n`);

    for (const ordem of ordens) {
      console.log(`🛒 Ordem #${ordem.id} - SKU: ${ordem.sku}`);
      console.log(`📈 Total de alterações: ${ordem.total_alteracoes}`);

      // Buscar histórico detalhado
      const [historico] = await connection.execute(`
        SELECT campo_alterado, valor_anterior, valor_novo, usuario_nome,
               DATE_FORMAT(data_alteracao, '%d/%m/%Y %H:%i') as data_formatada
        FROM ordem_compra_historico
        WHERE ordem_compra_id = ?
        ORDER BY data_alteracao DESC
        LIMIT 5
      `, [ordem.id]);

      console.log('   📝 Últimas alterações:');
      historico.forEach(item => {
        const campoLabel = getCampoLabel(item.campo_alterado);
        const valorAntes = formatarValor(item.campo_alterado, item.valor_anterior);
        const valorDepois = formatarValor(item.campo_alterado, item.valor_novo);

        console.log(`      • ${campoLabel}: ${valorAntes} → ${valorDepois}`);
        console.log(`        👤 ${item.usuario_nome || 'Sistema'} | 📅 ${item.data_formatada}`);
      });

      console.log('');
    }

    console.log('🎯 Melhorias implementadas:');
    console.log('   ✅ Mostra apenas campos alterados');
    console.log('   ✅ Formatação inteligente de valores (R$, datas, status)');
    console.log('   ✅ Labels descritivos para campos');
    console.log('   ✅ Agrupamento por data/hora');
    console.log('   ✅ Interface visual clara e intuitiva');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function getCampoLabel(campo) {
  const labels = {
    'familia_id': 'Família',
    'tamanho_id': 'Tamanho',
    'cor_id': 'Cor',
    'sku': 'SKU',
    'quantidade': 'Quantidade',
    'unidade_medida': 'Unidade',
    'valor_compra_brl': 'Valor R$',
    'cotacao_dolar': 'Cotação USD',
    'etd_planejado': 'ETD Planejado',
    'etd_proposto': 'ETD Proposto',
    'etd_real': 'ETD Real',
    'status': 'Status'
  };
  return labels[campo] || campo;
}

function formatarValor(campo, valor) {
  if (!valor) return 'N/A';

  if (['quantidade', 'valor_compra_brl', 'cotacao_dolar'].includes(campo)) {
    const num = parseFloat(valor);
    if (!isNaN(num)) {
      if (campo.includes('valor')) return `R$ ${num.toFixed(2)}`;
      return num.toString();
    }
  }

  if (campo.includes('etd') || campo.includes('data')) {
    try {
      const date = new Date(valor);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch (e) {}
  }

  if (campo === 'status') {
    const statusMap = {
      'planejado': 'Planejado',
      'aprovado': 'Aprovado',
      'em_transito': 'Em Trânsito',
      'recebido': 'Recebido',
      'cancelado': 'Cancelado'
    };
    return statusMap[valor] || valor;
  }

  return valor;
}

demonstrarHistorico();