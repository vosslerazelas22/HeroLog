# Changelog

Todas as alterações relevantes do HeroLog serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.8] - 2026-06-27

### Adicionado

- **Aba lateral arrastável em mobile** — o painel de navegação esquerdo agora pode ser puxado a partir da borda esquerda da tela, com abertura progressiva, overlay sincronizado e fechamento por arraste de volta para a esquerda.

### Alterado

- **Menu mobile** — preservado o botão superior esquerdo existente, agora convivendo com o gesto de slide sem afetar o layout desktop.

### Arquivos alterados

- `/src/App.tsx` — adicionados controles de gesto, faixa lateral sensível ao toque, thresholds de abertura/fechamento e animação por `translateX`.

---

## [1.0.7] - 2026-06-26

### Adicionado

- **Acesso direto às configurações de tarefas** — clicar em qualquer área neutra do cartão de um Hábito, Diária ou Afazer abre automaticamente o painel flutuante de edição. Propagação de clique contida (`stopPropagation`) nos botões de ação específicos de cada cartão para evitar conflitos de eventos.

### Alterado

- **Tela de Missão Concluída** — refinamento estético completo da interface de celebração ao término de um ciclo Pomodoro, tornando a conquista mais imersiva e gratificante.
- **Tela de Descanso** — ajustes semânticos e motivacionais nos diálogos e indicadores da interface de pausa entre ciclos, promovendo melhor transição mental.
- **Modal de Level Up de Habilidade** — atualização de textos e registro nos logs do sistema:
  - *Tagline*: `"Novo patamar alcançado."`
  - *Título*: `"MAESTRIA APRIMORADA"` em tipografia serifada de alto impacto.
  - *Corpo*: `"Nenhum nível é concedido por acaso. Este foi conquistado minuto após minuto."`
  - *Log do Sistema*: padronizado com emoji de livros — `📚 {Nome da Habilidade} alcançou o Nível {Novo Nível}.`

### Arquivos alterados

- `/src/App.tsx` — tela de missão concluída, tela de descanso e modal de level up de habilidade.
- `/src/components/HabitsTab.tsx` — acesso direto às configurações via clique no cartão.
- `/src/components/DailiesTab.tsx` — acesso direto às configurações via clique no cartão.
- `/src/components/TodosTab.tsx` — acesso direto às configurações via clique no cartão.

---

## [1.0.6] - 2026-06-23
 
### Adicionado
 
- **Hook `useGameState.ts`** — extraída a lógica de persistência de estado do `App.tsx` para um hook isolado, encapsulando:
  - A constante `INITIAL_STATE`.
  - A função `normalizeGameState()` para normalização estrutural de saves antigos.
  - A sincronização local automatizada com o `localStorage`.
  - As funções utilitárias `resetGameState()` (purga total) e `importGameState(parsed)` (restauração de backup).
- **Integração com Supabase** — arquitetura preparada e integração implementada para sincronização cross-device:
  - Autenticação via Magic Link.
  - Salvamento do estado do jogo em tabela `campaign_saves` com debounce, acionado em momentos-chave (ex.: conclusão de sessão de foco).
  - Estratégia de resolução de conflitos por `updated_at`, impedindo que um dispositivo desatualizado sobrescreva o save mais recente.
### Alterado
 
- **`/src/App.tsx`** — substituídas ~150 linhas de estado e inicializadores de `localStorage` pelo hook `useGameState`. Funções `handleSanctizeCampaignData`, `handleImportCampaignJSON` e `handleImportSaveFromText` simplificadas com a nova API do hook, sem alteração nas regras de negócio.
### Arquivos alterados
 
- `/src/hooks/useGameState.ts` — novo arquivo.
- `/src/App.tsx` — refatoração da camada de persistência.
---
 
## [1.0.5] - 2026-06-23
 
### Adicionado
 
- **Modal de Level Up (Nível de Combate)** — celebração visual e sonora ao subir de nível:
  - Contêiner com borda dourada envolto por aura pulsante (`animate-level-up-glow`).
  - 16 partículas medievais geradas proceduralmente (`rising-spark`) que sobem pela tela.
  - Reprodução imediata de arpejo ascendente de RPG retrô (`sound.playLevelUp()`).
  - Exibição do nome do personagem em tipografia de destaque e texto contextual de lore.
- **Modal de Evolução de Habilidade (Maestria Aprimorada)** — celebração ao evoluir uma habilidade:
  - Brilho radiante verde-esmeralda (`animate-skill-up-glow`) com partículas cósmicas flutuantes.
  - Destaque da habilidade específica e seu emoji correspondente.
  - Exibição de `"MAESTRIA APRIMORADA: [NOME] evoluiu para o NÍVEL X"`.
- **Fila de notificações (`levelUpQueue`)** — arquitetura reativa que enfileira múltiplos eventos de level up ocorridos simultaneamente, exibindo-os sequencialmente.
- **Referências de segurança (bypass refs)** — prevenção de disparo duplicado ou indevido dos modais durante login inicial, restauração de backups e reinicializações do sistema.
### Arquivos alterados
 
- `/src/index.css` — adicionados keyframes `riseFast`, `goldenRadiance`, `emeraldRadiance` e `pulsingAura`.
- `/src/App.tsx` — declaradas estruturas `LevelUpModalType`; adicionados estados de fila, rastreadores e modais com `<AnimatePresence>`.

---

## [1.0.4] - 2026-06-22

### Adicionado

- **Mural de Contratos Ativos** — novo painel na aba de Foco, substituindo o campo de Notas Teológicas, composto por duas colunas:
  - *Proclamações do Dia*: lista de Quests Diárias com progresso em tempo real.
  - *Tese de Campanha de Guilda*: exibe dinamicamente a Quest de Guilda mais próxima da conclusão, com barra de progresso em gradiente dourado.
  - Botão de atalho *"Painel de Contratos →"* para navegação direta à aba de conquistas.
- **Menu Contextual (⋮)** — botões fixos de editar e excluir nas abas de Hábitos, Dailies e Todos substituídos por menu flutuante de três pontos, liberando espaço horizontal nos cartões.

### Alterado

- **Hierarquia visual dos cartões** (Hábitos, Dailies e Todos) — reestruturação da ordem interna dos elementos: nome e dificuldade → descrição → sequência → status diário → estatísticas → tags → ações.
- **Tamanho de fontes** — leve aumento nos títulos dos cartões (`text-sm` em mobile, `text-[15px]` em desktop) com peso em negrito e fonte serifada para maior legibilidade.
- **Indicador de sequência** — substituído o texto anterior por medalha compacta 🏅 (ex.: `🏅 3`).
- **Indicador "Registrado Hoje"** — crachá dourado (`✓ Hoje`) para hábitos já registrados; crachá discreto (`○ Hoje`) para os pendentes.
- **Alinhamento dos botões de ação** — ajuste responsivo (`items-start md:items-center`) para garantir simetria em telas móveis com cartões de conteúdo variável.
- **Posicionamento do menu contextual** — dropdown configurado para abrir à esquerda (`right-full mr-1.5`), evitando corte em listas com poucos itens ou posicionadas na base da tela.

### Corrigido

- **Overflow dos contêineres de cartão** — alterado de `overflow-hidden` para `overflow-visible` nos invólucros das listas, permitindo que menus flutuantes sejam exibidos corretamente sem corte.
- **Fechamentos de chaves no map de hábitos** (`HabitsTab.tsx`) — corrigida inconsistência estrutural no JSX.

### Arquivos alterados

- `/src/types.ts` — adicionado atributo opcional `lastTriggeredDate?: string` à interface `Habit`.
- `/src/App.tsx` — atualizada lógica de acionamento de hábitos; substituído campo de notas pelo Mural de Contratos.
- `/src/components/HabitsTab.tsx` — novo layout de cartão, indicadores visuais e correção estrutural.
- `/src/components/DailiesTab.tsx` — reestruturação dos cartões de Tarefas Diárias.
- `/src/components/TodosTab.tsx` — modernização de espaçamentos, fontes e alinhamento.

---

## [1.0.3] - 2026-06-19

### Adicionado

- **Descanso Longo configurável** — adicionada propriedade `longBreakMinutes: number` à interface `CharacterState`, com valor padrão de 15 minutos persistido no `localStorage` e integrado às mecânicas de importação/exportação de progresso.
- **Seletor de duração de descanso** — novo estado local `selectedBreakMins` (padrão: 5 minutos) que armazena e pré-seleciona a última duração escolhida pelo usuário nas sessões fora do Modo Masmorra.
- **Campo "Descanso Longo (min)"** no modal de Ajustes Sagrados, aceitando valores entre 1 e 120 minutos.
- **Tooltip interativo no Heatmap** — popup flutuante exibido ao passar o mouse ou tocar nos blocos diários, com data por extenso em português (ex.: `SEXTA-FEIRA, 19 DE JUNHO DE 2026`) e tempo total focado (ex.: `1H 30M ESTUDADO` ou `PORTAL DO AMANHÃ` para dias futuros).
- **Seletor de escopo temporal no Heatmap** — alternância entre visualização de `[3 MESES]` e `[6 MESES]`.
- **Card de Consistência (últimos 30 dias)** — painel heráldico no topo do Heatmap exibindo percentual de foco recente com barra segmentada e contador de dias cumpridos (ex.: `26 / 30 dias`).
- **Destaque da semana atual no Heatmap** — contorno dourado com glow, fundo enriquecido e etiqueta animada `ATUAL` sob a última coluna.
- **Modal de conclusão de sessão em 3 etapas**:
  - *Etapa I — A Conquista*: cartaz de missão concluída com classificação e resumo de XP e Gold.
  - *Etapa II — O Tesouro*: tela de drop de itens/títulos com efeitos visuais (glow roxo, luzes).
  - *Etapa III — A Crônica*: área de anotações e vinculação de Subskills.

### Alterado

- **Tela de preparação de descanso (`isBreakPrep`)** — quando o Modo Masmorra está desativado, exibe dois botões de seleção: `5 MIN` (Descanso Curto) e o valor configurado dinamicamente (ex.: `15 MIN`). A escolha é persistida e pré-selecionada na sessão seguinte.
- **Portal da Habilidade** — detalhes em bronze cintilante, barra de progresso em gradiente e selos rústicos de progressão medieval.
- **Ficha de Personagem** — redesenhada em layout de duas colunas:
  - *Coluna esquerda*: avatar ampliado (`w-24 h-24`) com degradê purpurado, estatísticas de sequência e tempo total de foco.
  - *Coluna direita*: nome, título honorífico e classe com tipografia fluida; placa de nível de combate em formato de medalhão RPG; barra de XP posicionada acima da barra de HP.
  - Fontes de XP e HP reduzidas (`text-[8.5px]`) para acabamento mais limpo.
- **Alinhamento do painel de Foco** — ajustado para `items-start`, eliminando espaço vazio entre a Trompeta de Foco e a Ficha de Personagem em telas médias e grandes.

### Corrigido

- **Reset de Quests Diárias** — substituído reset por IDs fixos por filtragem dinâmica de prefixo:
  ```ts
  achievements: (prev.achievements || []).filter(tag => !tag.startsWith('claimed_daily_'))
  ```
  Quaisquer novas quests diárias cujo estado seja salvo com o prefixo `claimed_daily_` serão automaticamente reiniciadas no início de um novo dia.

### Arquivos alterados

- `/src/types.ts` — adicionada propriedade `longBreakMinutes` à interface `CharacterState`.
- `/src/App.tsx` — lógica de descanso configurável, modal em 3 etapas, Portal da Habilidade, Ficha de Personagem e reset dinâmico de quests.
- `/src/components/HeatmapTab.tsx` — tooltip interativo, seletor de escopo, card de consistência e destaque da semana atual.

---

## [1.0.2] - 2026-06-18

### Alterado

- **Realce de aba ativa no menu lateral** — redesenho do sistema de guias (`activeTab`) com os seguintes elementos:
  - Filete dourado de 2px na borda esquerda (`border-l-2 border-l-amber-400`) indicando a localização atual.
  - Compensação de espaçamento interno (`pl-3.5`) para evitar deslocamento de ícones e rótulos ao exibir a borda.
  - Transições suaves em todos os estados (`transition-all`) para fluxo contínuo de cores e guarnição.
  - Expansão sutil de 2% ao selecionar (`scale-[1.02]`), criando efeito de profundidade e relevo.
  - Fundo âmbar de baixa opacidade (`bg-amber-500/[0.06]`) substituindo o preenchimento opaco anterior.

### Arquivos alterados

- `/src/App.tsx` — classes utilitárias de estilo aplicadas ao menu lateral esquerdo de navegação.

---

## [1.0.1] - 2026-06-17

### Adicionado

- **Sumário de Sessão** — novo painel de encerramento de missão com estética inspirada nos RPGs clássicos, redesenhado para maior legibilidade, responsividade ao volume de conteúdo e coerência com a identidade visual sombria do Obsidiana.
- **Integração de Subskills no Sumário de Sessão** — sessões de foco agora podem ser categorizadas com Subskills diretamente no painel de encerramento, permitindo registro preciso sob cada Habilidade principal.

### Corrigido

- **Notas de reflexão não sendo salvas** — corrigido um problema intermitente que poderia impedir o salvamento das notas de reflexão ao término de uma sessão Pomodoro. As anotações agora são armazenadas de forma confiável no histórico da aplicação.

---

## [1.0.0] - 2026-05-01

- Lançamento inicial.
