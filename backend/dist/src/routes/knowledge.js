"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const knowledgeRepository_1 = require("../repositories/knowledgeRepository");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const { category, search, limit } = req.query;
    const articles = await (0, knowledgeRepository_1.listKnowledgeArticles)({
        category: category,
        search: search,
        limit: limit ? parseInt(limit) : undefined,
    });
    res.json({ articles });
});
router.get('/:id', async (req, res) => {
    const article = await (0, knowledgeRepository_1.getKnowledgeArticleById)(req.params.id);
    if (!article) {
        res.status(404).json({ error: 'Article not found' });
        return;
    }
    res.json({ article });
});
exports.default = router;
//# sourceMappingURL=knowledge.js.map