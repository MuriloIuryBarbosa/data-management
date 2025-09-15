import { deleteUserByEmail, findUserByEmail } from './src/models/user';

async function deleteUser() {
  try {
    console.log('🔍 Verificando se o usuário existe...');
    const user = await findUserByEmail('murilo.iury@corttex.com.br');

    if (!user) {
      console.log('ℹ️ Usuário murilo.iury@corttex.com.br não encontrado no banco.');
      return;
    }

    console.log('👤 Usuário encontrado:', user.email);
    console.log('🗑️ Deletando usuário...');

    const deleted = await deleteUserByEmail('murilo.iury@corttex.com.br');

    if (deleted) {
      console.log('✅ Usuário murilo.iury@corttex.com.br deletado com sucesso!');
    } else {
      console.log('⚠️ Falha ao deletar o usuário.');
    }

    // Verificar novamente
    const checkUser = await findUserByEmail('murilo.iury@corttex.com.br');
    if (!checkUser) {
      console.log('✅ Confirmação: Usuário removido do banco de dados.');
    } else {
      console.log('❌ Erro: Usuário ainda existe após tentativa de deleção.');
    }

  } catch (error) {
    console.error('❌ Erro:', (error as Error).message);
  }
}

deleteUser();