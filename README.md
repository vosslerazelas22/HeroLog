# ⚔️ HeroLog
> Transforme sua produtividade em uma jornada de RPG.

HeroLog é um app de produtividade gamificado baseado na técnica Pomodoro. A cada sessão de foco concluída, seu personagem ganha XP, sobe de nível, coleta loot e evolui suas habilidades — tornando o trabalho do dia a dia uma aventura.

---

## ✨ Funcionalidades

- **Timer Pomodoro** com pausas curtas e longas configuráveis
- **Dungeon Mode** — 4 sessões consecutivas com recompensas elevadas
- **Mecânicas de RPG** — XP, HP, Gold, Loot e Equipamentos
- **Sistema de Skills e Subskills** — categorize suas sessões por área de foco
- **Anotações de sessão** — ao concluir um foco, registre uma nota livre e marque a subskill trabalhada, formando um histórico consultável
- **Autenticação e persistência de dados** via Supabase

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Vite |
| Estilo | Tailwind CSS |
| Animações | Framer Motion |
| Backend / Auth / Dados | Supabase |
| Servidor de dev/build | Express (via `server.ts`, com Vite em middleware mode) |
| Mobile | Capacitor (Android) |
| Hospedagem | GitHub Pages |
| CI/CD | GitHub Actions |

---

## 🚀 Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/vosslerazelas22/herolog.git
cd herolog

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Build para produção

```bash
npm run build
```

### Deploy no GitHub Pages

O deploy é feito automaticamente via GitHub Actions a cada push na branch `main`. O build gerado (`dist/`) é publicado como site estático — o servidor Express (`server.ts`) é usado apenas em desenvolvimento local.

---

## 📱 Build Android (Capacitor)

> A pasta `android/` é mantida apenas localmente e não está versionada neste repositório.

```bash
# Gera o build web
npm run build

# Sincroniza com o Capacitor
npx cap sync android

# Abre no Android Studio
npx cap open android
```

> O app Android carrega a versão hospedada no GitHub Pages, não um bundle local.

---

## 📁 Estrutura do projeto

```
herolog/
├── src/
│   ├── components/       # Componentes React compartilhados (modais, navegação)
│   ├── hooks/            # Hooks customizados (ex: useGameState.ts, useAuth.ts)
│   ├── modules/          # Lógica de domínio por área (focus, skills, kingdom, quests, character)
│   ├── lib/              # Integrações externas (Supabase client, auth)
│   ├── utils/            # Funções utilitárias (áudio, scheduling, cores, etc.)
│   └── main.tsx
├── public/
├── server.ts             # Servidor Express (dev local + build)
├── vite.config.ts
└── CHANGELOG.md
```

---

## 📋 Changelog

Consulte o [CHANGELOG.md](./CHANGELOG.md) para o histórico de versões.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
