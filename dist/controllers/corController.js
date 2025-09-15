"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCor = exports.putCor = exports.getEditarCor = exports.postCor = exports.getNovaCor = exports.getCores = void 0;
const cor_1 = require("../models/cor");
// Cor Controllers
const getCores = async (req, res) => {
    try {
        const cores = await cor_1.corModel.findAll();
        res.render('cadastros/cores/index', { cores, title: 'Cores' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar cores' });
    }
};
exports.getCores = getCores;
const getNovaCor = (req, res) => {
    res.render('cadastros/cores/form', { cor: null, title: 'Nova Cor' });
};
exports.getNovaCor = getNovaCor;
const postCor = async (req, res) => {
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
        await cor_1.corModel.create(corData);
        res.redirect('/cadastros/cores');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar cor' });
    }
};
exports.postCor = postCor;
const getEditarCor = async (req, res) => {
    try {
        const { id } = req.params;
        const cor = await cor_1.corModel.findById(parseInt(id));
        if (!cor) {
            return res.status(404).json({ error: 'Cor não encontrada' });
        }
        res.render('cadastros/cores/form', { cor, title: 'Editar Cor' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar cor' });
    }
};
exports.getEditarCor = getEditarCor;
const putCor = async (req, res) => {
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
        await cor_1.corModel.update(parseInt(id), corData);
        res.redirect('/cadastros/cores');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar cor' });
    }
};
exports.putCor = putCor;
const deleteCor = async (req, res) => {
    try {
        const { id } = req.params;
        await cor_1.corModel.delete(parseInt(id));
        res.redirect('/cadastros/cores');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao excluir cor' });
    }
};
exports.deleteCor = deleteCor;
