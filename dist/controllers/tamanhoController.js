"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTamanho = exports.putTamanho = exports.getEditarTamanho = exports.postTamanho = exports.getNovoTamanho = exports.getTamanhos = void 0;
const tamanho_1 = require("../models/tamanho");
// Tamanho Controllers
const getTamanhos = async (req, res) => {
    try {
        const tamanhos = await tamanho_1.tamanhoModel.findAll();
        res.render('cadastros/tamanhos/index', {
            tamanhos,
            title: 'Tamanho',
            currentPage: 'tamanho',
            layout: 'layouts/base',
            user: req.user
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tamanhos' });
    }
};
exports.getTamanhos = getTamanhos;
const getNovoTamanho = (req, res) => {
    res.render('cadastros/tamanhos/form', {
        tamanho: null,
        title: 'Novo Tamanho',
        currentPage: 'tamanho',
        layout: 'layouts/base',
        user: req.user
    });
};
exports.getNovoTamanho = getNovoTamanho;
const postTamanho = async (req, res) => {
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
        await tamanho_1.tamanhoModel.create(tamanhoData);
        res.redirect('/cadastros/tamanhos');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar tamanho' });
    }
};
exports.postTamanho = postTamanho;
const getEditarTamanho = async (req, res) => {
    try {
        const { id } = req.params;
        const tamanho = await tamanho_1.tamanhoModel.findById(parseInt(id));
        if (!tamanho) {
            return res.status(404).json({ error: 'Tamanho não encontrado' });
        }
        res.render('cadastros/tamanhos/form', {
            tamanho,
            title: 'Editar Tamanho',
            currentPage: 'tamanho',
            layout: 'layouts/base',
            user: req.user
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tamanho' });
    }
};
exports.getEditarTamanho = getEditarTamanho;
const putTamanho = async (req, res) => {
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
        await tamanho_1.tamanhoModel.update(parseInt(id), tamanhoData);
        res.redirect('/cadastros/tamanhos');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar tamanho' });
    }
};
exports.putTamanho = putTamanho;
const deleteTamanho = async (req, res) => {
    try {
        const { id } = req.params;
        await tamanho_1.tamanhoModel.delete(parseInt(id));
        res.redirect('/cadastros/tamanhos');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao excluir tamanho' });
    }
};
exports.deleteTamanho = deleteTamanho;
