import { Router } from 'express';
import { listKnowledgeArticles, getKnowledgeArticleById } from '../repositories/knowledgeRepository';

const router = Router();

router.get('/', async (req, res) => {
  const { category, search, limit } = req.query;
  const articles = await listKnowledgeArticles({
    category: category as string | undefined,
    search: search as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  res.json({ articles });
});

router.get('/:id', async (req, res) => {
  const article = await getKnowledgeArticleById(req.params.id);
  if (!article) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  res.json({ article });
});

export default router;
