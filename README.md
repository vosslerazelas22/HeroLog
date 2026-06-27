# ⚔️ HeroLog

> Transforme sua produtividade em uma jornada de RPG.

HeroLog é um app de produtividade gamificado baseado na técnica Pomodoro. A cada sessão de foco concluída, seu personagem ganha XP, sobe de nível, coleta loot e evolui suas habilidades — tornando o trabalho do dia a dia uma aventura.

---

## ✨ Funcionalidades

- **Timer Pomodoro** com pausas curtas e longas configuráveis
- **Dungeon Mode** — 4 sessões consecutivas com recompensas elevadas
- **Mecânicas de RPG** — XP, HP, Gold, Loot e Equipamentos
- **Sistema de Skills e Subskills** — categorize suas sessões por área de foco
- **Reflexão pós-sessão** — anote aprendizados e aplique tags de subskills
- **Design system Obsidiana** — interface dark e imersiva

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Vite |
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

O deploy é feito automaticamente via GitHub Actions a cada push na branch `main`.

---

## 📱 Build Android (Capacitor)

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
│   ├── components/       # Componentes React
│   ├── hooks/            # Hooks customizados (ex: useGameState.ts)
│   ├── styles/           # Design system Obsidiana
│   └── main.tsx
├── android/              # Projeto Capacitor/Android
├── public/
├── vite.config.ts
└── CHANGELOG.md
```

---

## 📋 Changelog

Consulte o [CHANGELOG.md](./CHANGELOG.md) para o histórico de versões.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
