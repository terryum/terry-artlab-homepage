# On the Manifold — Terry's External Brain

[한국어](README_ko.md) | **English**

> A personal homepage and AI-operated knowledge management system for robotics & AI research.

**Live**: [terry.artlab.ai](https://terry.artlab.ai)

## What This Is

This is the source code for [On the Manifold](https://terry.artlab.ai), a bilingual (Korean/English) research blog and knowledge graph. Inspired by [Andrej Karpathy's approach](https://x.com/karpathy/status/1911080111710109960) to personal knowledge management, the entire system is operated by Claude Code as an AI agent — papers are summarized, indexed, connected, and published through natural language commands.

The site hosts 25+ research paper summaries, tech essays, and an interactive paper relationship graph, all managed through an AI-powered pipeline.

## Architecture

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 |
| **Deployment** | Cloudflare (DNS/CDN) + Vercel |
| **Database** | Supabase (paper relationships, knowledge graph) |
| **Knowledge Base** | Obsidian (local graph viewer) + Claude Code (operating agent) |
| **Content** | Bilingual (Korean/English) MDX posts |

## Skills (Claude Code Commands)

| Skill | Description | Example |
|-------|-------------|---------|
| `/post` | Publish a research post from arXiv, blog, or journal URL | `/post https://arxiv.org/abs/2505.22159` |
| `/write` | Generate a styled draft from Obsidian memos, or save conversation insights | `/write #-1 #-3 --type=tech` |
| `/memo` | Create an Obsidian memo with auto-indexed metadata | `/memo AI와 로보틱스의 접점` |
| `/paper-search` | Recommend Top 10 papers based on knowledge graph + external search | `/paper-search #16 리타게팅 한계를 해결하는 연구` |
| `/post-share` | Publish a post to social media (Facebook, X, LinkedIn, Bluesky, Substack) | `/post-share #5 facebook,x` |
| `/project` | Add a project to the gallery | `/project https://github.com/user/repo` |

## How It Works

```
                    Claude Code (AI Agent)
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   /post, /write      /paper-search      /memo, /write
        │                  │               (insight)
        ▼                  ▼                  │
  posts/ (MDX)      Semantic Scholar          ▼
  meta.json          + arXiv API        Obsidian Vault
  index.json              │             (From AI/, From
        │                 ▼              Terry/, Meta/)
        ├──► Supabase (graph)                 │
        ├──► Obsidian (sync)                  │
        └──► Vercel (deploy)                  │
                                              ▼
                                     Knowledge Graph
                                    (wikilinks + Dataview)
```

- **Public posts** are indexed with positive IDs (`#1`, `#2`, ...)
- **Private memos/drafts** use negative IDs (`#-1`, `#-2`, ...)
- Any document is referenceable by its `#number` across all commands

## Note

This is a personal project, not a template or starter kit. It requires environment variables, API keys, and infrastructure configurations not included in the repository. If you find the workflow interesting, feel free to draw inspiration — but please build your own from scratch.

## License

MIT
