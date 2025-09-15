import { Request, Response } from 'express';

export const getCadastros = (req: Request, res: Response) => {
  res.render('cadastros/index', {
    title: 'Cadastros',
    currentPage: 'cadastros',
    layout: 'layouts/base',
    user: (req as any).user,
    modulos: [
      {
        nome: 'Famílias',
        descricao: 'Gerenciar famílias de produtos',
        url: '/cadastros/familia',
        icone: 'fas fa-users'
      },
      {
        nome: 'Tamanhos',
        descricao: 'Gerenciar tamanhos de produtos',
        url: '/cadastros/tamanho',
        icone: 'fas fa-expand'
      },
      {
        nome: 'Cores',
        descricao: 'Gerenciar cores de produtos',
        url: '/cadastros/cor',
        icone: 'fas fa-palette'
      }
    ]
  });
};