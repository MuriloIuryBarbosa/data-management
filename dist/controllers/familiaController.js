"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFamilia = exports.putFamilia = exports.getEditarFamilia = exports.postFamilia = exports.getNovaFamilia = exports.getFamilias = void 0;
const familia_1 = require("../models/familia");
// Familia Controllers
const getFamilias = async (req, res) => {
    try {
        const familias = await familia_1.familiaModel.findAll();
        const totalFamilias = await familia_1.familiaModel.count();
        res.render('cadastros/familias/index', {
            familias,
            totalFamilias,
            title: 'Família',
            currentPage: 'familia',
            user: req.user
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar famílias' });
    }
};
exports.getFamilias = getFamilias;
const getNovaFamilia = (req, res) => {
    res.render('cadastros/familias/form', {
        familia: null,
        title: 'Nova Família',
        currentPage: 'familia',
        layout: 'layouts/base',
        user: req.user
    });
};
exports.getNovaFamilia = getNovaFamilia;
const postFamilia = async (req, res) => {
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
        await familia_1.familiaModel.create(familiaData);
        res.redirect('/cadastros/familias');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar família' });
    }
};
exports.postFamilia = postFamilia;
const getEditarFamilia = async (req, res) => {
    try {
        const { id } = req.params;
        const familia = await familia_1.familiaModel.findById(parseInt(id));
        if (!familia) {
            return res.status(404).json({ error: 'Família não encontrada' });
        }
        res.render('cadastros/familias/form', {
            familia,
            title: 'Editar Família',
            currentPage: 'familia',
            layout: 'layouts/base',
            user: req.user
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar família' });
    }
};
exports.getEditarFamilia = getEditarFamilia;
const putFamilia = async (req, res) => {
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
        await familia_1.familiaModel.update(parseInt(id), familiaData);
        res.redirect('/cadastros/familias');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar família' });
    }
};
exports.putFamilia = putFamilia;
const deleteFamilia = async (req, res) => {
    try {
        const { id } = req.params;
        await familia_1.familiaModel.delete(parseInt(id));
        res.redirect('/cadastros/familias');
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao excluir família' });
    }
};
exports.deleteFamilia = deleteFamilia;
