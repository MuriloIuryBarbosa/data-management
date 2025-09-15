import { Request, Response } from 'express';

export const getCadastros = (req: Request, res: Response) => {
  res.render('cadastros/index', {
    title: 'Cadastros',
    modulos: [
      {
        nome: 'Famílias',
        descricao: 'Gerenciar famílias de produtos',
        url: '/cadastros/familias',
        icone: 'fas fa-sitemap'
      },
      {
        nome: 'Tamanhos',
        descricao: 'Gerenciar tamanhos de produtos',
        url: '/cadastros/tamanhos',
        icone: 'fas fa-expand'
      },
      {
        nome: 'Cores',
        descricao: 'Gerenciar cores de produtos',
        url: '/cadastros/cores',
        icone: 'fas fa-palette'
      }
    ]
  });
};