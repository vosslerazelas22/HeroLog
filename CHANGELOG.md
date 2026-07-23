# Changelog

Todas as alterações relevantes do HeroLog serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.1.X] - Planejado

### Planejado

- **Catálogo ampliado de Guild Quests** — expandir as Teses de Campanha com novos objetivos permanentes, mantendo reivindicação única por save e integração com o Mural de Contratos Ativos.

---

## [1.1.8] - 2026-07-22

### Adicionado

- **Modal de Detalhe de Item reutilizável (`ItemInspectModal`)** — Bênçãos/Elixires Ativos e Equipamentos na Ficha de Personagem agora são clicáveis e abrem um modal de detalhe completo (efeito, descrição, cargas), substituindo o tooltip nativo `title=` que não funcionava em touch/mobile.
- **Tooltip de Chance de Saque (Modo Padrão)** — novo indicador "🎯 Modo Padrão • Chance de Saque: X%" na tela de Foco, com modal explicativo detalhando os limiares de chance por duração de sessão e os bônus de títulos raros equipados, calculados dinamicamente a partir da mesma lógica usada pelo motor de jogo.
- **Catálogo único de itens de loot (`LOOT_TABLE`)** — 14 itens (4 Especiais e 10 Comuns) com efeitos, descrições e raridade centralizados em um só lugar, com resolução da rolagem no momento do drop (não mais em duas etapas desconexas).

### Alterado

- **Redesenho do Modal de Recompensas (Tesouro)** — itens obtidos e título raro dropado agora são exibidos em um grid compacto estilo "bento" (em vez de lista vertical com scroll interno duplo), eliminando o conflito de rolagem que existia em sessões de Masmorra com múltiplos drops.
- **Copy revisado nos modais de conclusão de sessão** — linguagem simplificada em diversos textos ("Sessão Concluída", "Duração da Sessão", "Anotações da Sessão", "Vincular Subskill", "Continuar", "Reivindicar Recompensas"), removendo floreios narrativos sem valor funcional (ex.: frases motivacionais genéricas nos modais de Level Up e Login Diário).
- **Campo de Subskill na Crônica da Missão** — a seção de vínculo de subskill agora só é exibida quando existem subskills cadastradas para a habilidade ativa, eliminando espaço vertical desnecessário no modal.
- **Focus Orb (timer central)** — aumento de aproximadamente 15% nas dimensões em todos os perfis de exibição (compacto, padrão e tela cheia).
- **Performance de abertura de modais (mobile)** — eliminado travamento perceptível ao abrir modais em dispositivos móveis; animações de fundo (partículas, brilhos, ícones giratórios) agora pausam automaticamente enquanto um modal está aberto, via classe CSS global em vez de re-render de estado React.

### Corrigido

- **Bônus de ouro de Masmorra não creditado** — corrigido bug em que o bônus de +2.500 GP ao concluir uma Masmorra (`dungeonClearGoldBonus`) nunca era somado ao saldo real de ouro do jogador.
- **Duplicação da lógica de chance de drop** — a regra de cálculo de chance de saque (por duração de sessão e bônus de título equipado) existia de forma duplicada em dois arquivos; agora centralizada em uma única função (`calculateLootChance`), usada tanto pelo motor de jogo quanto pelo novo tooltip informativo.

### Removido

- **Frases decorativas sem função nos modais** — removidas ou simplificadas falas de tom fantasioso em Tesouro, Crônica da Missão, Level Up (Personagem e Habilidade), Login Diário e Modo Selvagem, mantendo apenas o conteúdo funcional de cada texto.
- **Código morto no fluxo de recompensas** — removido bloco de fallback legado (`!lootedItems && lootName`) que nunca mais era acionado desde a migração para o catálogo único de itens.
- **Banner vertical de Título Raro** — o card de título raro obtido no drop (antes um banner de largura total) foi integrado ao mesmo grid compacto dos itens de loot comuns/especiais.

### Conhecido

- **Nomes de título raro sem tradução no catálogo** — alguns títulos (SHADOW, IMMORTAL SCHOLAR, NOCTURNAL) ainda não possuem nome em português no `TITLE_CATALOG`, aparecendo em inglês onde outros já estão traduzidos; candidato a revisão em ciclo futuro.
- **Validação em APK/produção pendente** para a otimização de performance de abertura de modais — validado em dev build; build de produção ainda não testado diretamente em dispositivo.

### Arquivos alterados

- `/src/App.tsx`
- `/src/components/Modal.tsx`
- `/src/modules/focus/FocusOrb.tsx`
- `/src/modules/skills/SkillsScreen.tsx`
- `/src/modules/quests/QuestsTab.tsx`
- `/src/index.css`
- `/src/modules/character/InventoryScreen.tsx`
- `/src/modules/character/CharacterScreen.tsx`
- `/src/types.ts`
- `/src/modules/focus/types.ts`
- `/src/modules/focus/useFocusSession.ts`
- `/src/modules/focus/ModeDescriptionModal.tsx`

### Arquivos criados

- `/src/utils/modalHelper.ts`
- `/src/components/ItemInspectModal.tsx`
- `/src/modules/focus/lootTable.ts`
- `/src/modules/focus/lootConfig.ts`

### Arquivos removidos

- `/src/components/ModalState.ts` (criado na Tarefa C, substituído pelo mecanismo em `modalHelper.ts` na Tarefa C2)

---

## [1.1.7] - 2026-07-17

### Corrigido
- **Fundo preto vazando atrás dos painéis (Foco, Habilidades, Inventário, Ficha de Personagem)** — corrigido vazamento do fundo escuro do body por trás dos painéis em telas altas ou com pouco conteúdo cadastrado, fazendo a cor obsidian se estender continuamente até o fim da rolagem, como já ocorria em Hábitos, Tarefas Diárias e Afazeres.
- **Divergência entre Sequência (Streak) e Consistência no Heatmap** — corrigido cálculo que penalizava indevidamente o dia em andamento antes de haver atividade registrada, fazendo a Consistência exibir 29/30 mesmo com uma sequência ativa de 30 dias.

### Alterado
- **Cabeçalhos internos padronizados** — título e ícone de ajuda "?" com posicionamento consistente entre as abas Habilidades, Hábitos, Tarefas Diárias e Afazeres (título à esquerda, ação/ajuda à direita).
- **Botão de nova habilidade reposicionado e renomeado** — "+ Nova Habilidade" (barra separada abaixo dos cards) foi substituído por "NOVA", agora integrado ao cabeçalho da aba Habilidades, no mesmo padrão das demais abas de listas.
- **Tooltip de Mecânica de Prestígio (Habilidades)** unificado visualmente com o popover de ajuda já usado na Trompeta de Foco.
- **Botão "Gerenciar Habilidades" oculto em mobile** na Ficha de Personagem, por ser redundante nesse contexto.
- **Aproveitamento de espaço horizontal em Habilidades** — removido padding duplicado e limite de altura desnecessário da lista; campo de criação de subskills reestruturado para layout horizontal (input expansível + botão de ação com largura fixa), eliminando empilhamento vertical denso.
- **Copy revisado**: "Inventário de Equipamentos & Consumíveis" → "Equipamentos & Itens"; "Subskills (Tags de Foco):" → "Subskills:".

### Investigado
- **Assimetria visual no arredondamento do header global** — identificada como artefato do frame de preview do ambiente de desenvolvimento (AI Studio), sem correspondência no código-fonte. Nenhuma alteração aplicada.

### Conhecido
- **Quebra de layout no header em viewport estreito** com valores numéricos altos de sequência/moedas — não reproduzida em condições normais de uso; candidato a revisão futura.

---

## [1.1.6] - 2026-07-16

### Alterado
- **Nomes e cabeçalhos padronizados em todo o módulo Reino** — eliminados cabeçalhos duplicados que se repetiam dentro de várias sub-abas (ex.: "Atributos Totais & Análise Avançada" seguido de "Santuário das Crônicas"), consolidando cada seção em um único título. Nomes simplificados: Ficha Corporal → "Estatísticas do Herói", Feitos de Alma → "Conquistas", Bazar de Mystara (Loja) → "Bazar de Mystara", Mercado de Títulos → "Títulos", Ficha de Personagem (Status) → "Ficha de Personagem", Habilidades Ativas & Subskills → "Habilidades", Calendário de Constância (Heatmap) → "Heatmap", Logs Celestiais → "Registro de Atividades".
- **Cores dos cabeçalhos internos unificadas** — todos os títulos de seção do módulo Reino agora seguem a mesma paleta âmbar, eliminando a inconsistência visual entre abas (antes em tons de roxo, vermelho e verde).
- **"Contratos da Gilda" renomeado para "Contratos"** — grafia inconsistente de "Gilda/Guilda" eliminada. A aba agora conta com duas sub-seções dedicadas, no mesmo padrão visual da Loja: "Contratos Diários" (missões do dia) e "Marcos da Jornada" (progresso de longo prazo do herói). O painel flutuante de Contratos na aba Foco foi atualizado para refletir a mesma nomenclatura.
- **Legibilidade dos textos de orientação em Contratos** — textos explicativos das sub-seções "Contratos Diários" e "Marcos da Jornada" ganharam contraste adequado, antes quase ilegíveis por baixa opacidade.
- **Textos do Heatmap revisados** — "Consistência do Guerreiro (Últimos 30 Dias)" tornou-se "Consistência nos Últimos 30 Dias"; "Conservação do Dever" tornou-se "Visão Geral do Período".

### Removido
- **Painel "Bolsa de Espólios de Ouro"** removido do Bazar de Mystara, por ser redundante com o saldo de ouro já visível permanentemente no cabeçalho do aplicativo.

---

## [1.1.5] - 2026-07-15
### Corrigido
- **Espaço em branco/preto no painel de Hábitos, Tarefas Diárias e Afazeres (mobile)** — o ajuste de compactação visual do 1.1.2 não havia corrigido o problema em sua raiz. Identificada e corrigida uma quebra na cadeia de herança de altura entre o container principal e o painel das abas, que impedia o fundo de preencher corretamente o espaço disponível da tela em dispositivos com poucos itens cadastrados.
### Alterado
- **Painéis de Hábitos, Tarefas Diárias, Afazeres e Habilidades agora ocupam toda a largura da tela no mobile ("edge-to-edge")** — removida a moldura flutuante (bordas, cantos arredondados, sombra e margens laterais) característica do layout desktop, adotando um visual de tela cheia mais alinhado aos padrões de aplicativos mobile modernos. O visual de painel flutuante é mantido em telas maiores (tablet/desktop).
### Conhecido
- **Ausência de tratamento de safe-area em dispositivos com tela sem borda física** (ex.: iPhones recentes, Androids com navegação por gestos) — o espaçamento reservado para o menu de navegação inferior atualmente usa um valor fixo, sem considerar a área de segurança do sistema. Avaliação prevista para um ciclo futuro.

---

## [1.1.4] - 2026-07-14

### Adicionado

- **Contador regressivo de recarga da Masmorra** — o segmento "Masmorra" no seletor de Modo de Incursão agora exibe um cronômetro em tempo real (`HH:MM:SS`) enquanto o modo estiver em recarga, substituindo o aviso silencioso anterior que só aparecia no log de sistema.
- **Botão flutuante de Contratos (QuestFab)** — novo botão fixo com badge de contagem, substituindo o antigo Mural de Contratos inline e eliminando corte visual em qualquer celular moderno.

### Alterado

- **Seletor de Modo de Incursão redesenhado** — os três botões independentes (Padrão, Masmorra, Selvagem) foram unificados visualmente em um único controle segmentado, mantendo as cores temáticas de cada modo.
- **Contraste dos textos de suporte** — a segunda linha dos botões "Som Ambiente" e "Ajustes" (ex.: "Sintonizado", "Desativado", "Timer") ganhou uma cor sólida e mais legível, substituindo o esmaecimento duplo anterior.
- **Textos de status da sessão removidos** — os avisos textuais abaixo do cronômetro central (ex.: "Pronto para Começar", "Missão de Foco Ativa") foram removidos em todos os estados, já que o próprio cronômetro e os controles já comunicam claramente a situação atual.
- **Nomenclatura padronizada** — "Wilderness" foi renomeado para "Terra Selvagem" no modo de tela cheia, alinhando com o restante do app.
- **Layout mais compacto na aba Foco (mobile)** — espaçamentos internos reduzidos e rodapé ocultado em telas pequenas, diminuindo a necessidade de rolagem vertical.
- **Timer central (FocusOrb)** — cronômetro central redesenhado em formato de orbe/poção com animação fluida de líquido, substituindo o display textual anterior.

### Corrigido

- **Quebra de linha no botão "Masmorra"** — corrigido um problema visual em que o emoji ⚔️ podia cair para uma segunda linha, separado do texto "Masmorra", dependendo do modo selecionado.
- **Espaço reservado em excesso para o menu inferior** — ajustado o espaçamento abaixo do conteúdo principal, que reservava mais espaço do que o necessário para o menu de navegação inferior no mobile.

### Removido

- **Mural de Contratos inline** — componente antigo removido por completo, substituído pelo novo botão flutuante de Contratos (QuestFab).

### Arquivos alterados

- `/src/App.tsx`
- `/src/index.css`
- `/src/modules/focus/AmbientSoundButton.tsx`
- `/src/modules/focus/FocusModeScreen.tsx`
- `/src/modules/focus/index.ts`
- `/src/modules/focus/QuestFab.tsx` (novo)

---

## [1.1.3] - 2026-07-09

### Adicionado
- Indicador de progresso de Masmorra na tela de conclusão de foco em tela cheia (`⚔️ Sala X/4 concluída` / `⚔️ Masmorra Completa`), espelhando o tratamento que o modo Selvagem já recebia na classificação.

### Alterado
- Copy da tela de conclusão de foco simplificada: título principal ("Foco Concluído"), legenda de pausas ("Nenhuma pausa." / "X pausa(s) registrada(s).") e texto de apoio ("Recompensas liberadas para coleta."), com tom mais direto.

### Removido
- Cabeçalho secundário ("Missão Concluída") da tela de conclusão de foco, eliminando redundância com o título principal logo abaixo.

### Arquivos alterados
- `/src/modules/focus/FocusModeScreen.tsx`

---

## [1.1.2] - 2026-07-08

### Adicionado
- Cor dinâmica de fundo nos cards de hábitos, tarefas diárias e afazeres, refletindo a pontuação atual em 7 faixas de intensidade (do vermelho escuro ao azul brilhante).
- Decaimento temporal de pontuação em afazeres pendentes há muito tempo, incentivando a conclusão de tarefas mais antigas.
- Confirmação de descarte ao cancelar a criação ou edição de hábitos, tarefas diárias e afazeres, evitando perda acidental de alterações não salvas ao fechar o formulário de qualquer forma (botão de fechar, clique fora, tecla Esc ou botão Cancelar).

### Alterado
- Layout dos cards de hábitos, tarefas diárias e afazeres ajustado para um padrão visual mais compacto e consistente, com redução de espaçamento interno desnecessário.
- Metadados dos cards (sequência, status do dia, estatísticas) reorganizados em uma linha única e mais compacta, separados por marcadores visuais.
- Fluxo de exclusão de itens simplificado: confirmação passou a ser feita diretamente no card, sem menus adicionais.
- Formulários de criação e edição de hábitos, tarefas diárias e afazeres migrados para janelas modais, com visual mais consistente entre os três módulos.
- Padronização dos rótulos dos formulários ("Título", "Notas", "Dificuldade", "Checklist") entre os três módulos.
- Padronização dos títulos e textos de botão dos formulários conforme o modo ativo ("Nova Tarefa" / "Editar Tarefa", "Criar" / "Salvar").
- Botão de criação de nova tarefa simplificado para "Novo" nos três módulos.

### Corrigido
- Bug de agendamento de tarefas diárias que podia considerar dias incorretamente como "programados" antes da data real de criação da tarefa.

### Removido
- Menu de opções (⋮) nos cards de hábitos, tarefas diárias e afazeres, substituído pela confirmação de exclusão inline.
- Indicador numérico de saldo (medalha) e exibição de categorias (tags) na visualização em lista de hábitos, tarefas diárias e afazeres — ambos continuam disponíveis na tela de edição.
- Linguagem narrativa e emojis dos títulos dos formulários de criação e edição.

---
 
## [1.1.1] - 2026-07-06
 
### Corrigido
 
- **Perda de progresso da Masmorra (dungeon mode)** — corrigido bug em que o contador de sessões consecutivas (`dungeonSessions`) e o estado de incursão ativa (`isDungeonMode`) podiam ser zerados silenciosamente ao pausar a sessão, abandoná-la, completá-la normalmente, ou reidratar após queda de conexão/encerramento do processo da aba (comum no Android, que libera abas em segundo plano). Causa raiz: os dois campos existiam apenas em estado efêmero (`sessionConfig`, React state) e na chave `herolog_active_session` do `localStorage` — que é deletada em 4 pontos distintos do fluxo (pausar, cancelar, completar, completar via reload) — sem nenhuma cópia durável sobrevivendo a esses eventos.
### Alterado
 
- **Persistência do progresso de Masmorra** — `isDungeonMode` e `dungeonSessions` passam a ser espelhados automaticamente para `gameState` (`CharacterState`) a cada alteração, herdando a persistência já existente via `localStorage` + sincronização debounced com Supabase. Comportamento de UI e regras de jogo permanecem inalterados; a mudança é inteiramente de camada de persistência.
### Arquivos alterados
 
- `/src/types.ts` — adicionados os campos `isDungeonMode: boolean` e `dungeonSessions: number` à interface `CharacterState`.
- `/src/hooks/useGameState.ts` — adicionados os valores padrão correspondentes ao `INITIAL_STATE` (`false` / `0`); saves antigos herdam os defaults automaticamente via `normalizeGameState`.
- `/src/App.tsx` — inicializador de `sessionConfig` passa a usar `gameState.isDungeonMode` / `gameState.dungeonSessions` como fallback (em vez de `false` / `0` fixos); novo `useEffect` de espelhamento sincroniza `sessionConfig` → `gameState` a cada alteração dos dois campos.

---

## [1.1.0] - 2026-07-06

### Adicionado

- **Seletor de Modo de Incursão (segmented control)** — novo controle `Padrão | Masmorra ⚔️ | Selvagem 💀` reposicionado entre o seletor de habilidade ativa e o timer central, sobre a mesma lógica de estado já existente (`isDungeonMode` / `isWildernessChecked`).
- **`ModeDescriptionModal.tsx`** — modal único e reutilizável para as descrições de Masmorra e Selvagem, substituindo dois popovers duplicados que sofriam corte visual (clipping) no mobile.
- **Modal de Ajustes do Foco** — painel de Ajustes migrado para modal (`Modal.tsx` genérico), agora também responsável pelos Presets de Duração (25/50/90min), com seção de Duração Personalizada sempre visível (habilitada/desabilitada por toggle) e toggles independentes de Auto-Iniciar Descanso/Foco.
- **`SkillSelectorModal.tsx`** — seletor de habilidade ativa migrado do `<select>` nativo para modal em cartas, exibindo emoji, nome, nível, prestígio, tags e barra de progresso (`xp / (level * 80) * 100`).
- **Modal de criação de habilidade** — formulário de criação de nova habilidade (grid de ícones, nome customizado, sugestões rápidas) extraído da tela de Skills para modal dedicado, acessado por um único botão "+ Nova Habilidade".
- **Tooltip da Mecânica de Prestígio** — texto explicativo (antes fixo no topo da tela de Skills) convertido em ícone "?" com modal, no mesmo padrão visual do "?" da Trompeta de Foco.
- **Nova seção em Tutoriais** — `GuideTab.tsx` ganhou seção "Modos de Incursão de Foco", com regras/recompensas espelhando fielmente os modais de Masmorra/Selvagem, tabela comparativa de risco vs. recompensa e diretrizes de escolha.
- **`TitleEquipModal.tsx`** — segundo ponto de acesso para equipar título honorífico, diretamente na Ficha de Personagem (badge do título clicável), com títulos organizados por categoria (Lendários, Épicos, Raros, Comuns, Conquistas). A aba "Títulos" original permanece intacta como via alternativa.
- **Lista suspensa de sub-abas no Bottom Nav** — módulos com sub-navegação (Personagem, Missões, Reino) passam a abrir uma lista flutuante ancorada ao próprio botão do Bottom Nav, sempre que tocados (mesmo já ativos), com a sub-aba atual destacada.
- **Aba "Logs" dedicada no submenu Reino** — Registros Celestiais migrados de painel fixo (presente em todas as telas) para sub-aba própria em Reino (📜), com atalho equivalente na sidebar do desktop.
- **Sistema de toast** — notificações temporárias (canto superior direito, ~4s, não bloqueantes) para os três eventos que não possuíam nenhum feedback visual fora do log: equipamento quebrado por esgotamento de cargas, erro de nome de habilidade duplicado, e bloqueio de remoção de habilidade durante foco ativo.

### Alterado

- **Sinfonia Mística** — botão de som ambiente saiu da posição isolada (bloco "SINFONIA MÍSTICA") e passou a integrar uma fileira de dois botões junto do gatilho de Ajustes; ícone reflete dinamicamente o estado (🔇 parado / ícone de som + "Sintonizado" ativo).
- **Rótulos de ajuda dos Modos de Incursão** — simplificados de "Descrever ?" para apenas "?".
- **Mural de Contratos Ativos** — header ajustado para `flex-col md:flex-row` no mobile, eliminando colisão entre o título e o link "Painel de Contratos →".
- **Navegação de sub-abas** — pílulas horizontais (`SubNavPills`) removidas por completo de Personagem, Missões e Reino, substituídas pela lista suspensa do Bottom Nav.
- **Botão "Tela Cheia"** (ex-"Entrar na Câmara do Foco") — renomeado, reposicionado para abaixo dos controles de Pausar/Retomar e Abandonar Missão, e estilo visual rebaixado para outline/ghost discreto, reservando destaque sólido às ações primárias da sessão.
- **Citação filosófica do topo** — oculta apenas em viewports abaixo de `md` (768px), liberando espaço vertical no mobile; mantida sem alteração no desktop.
- **Cards de habilidade (Skills)** — nome com prioridade de espaço (quebra em até 2 linhas em vez de truncar), badge de nível reposicionado abaixo do nome, botão "Esquecer" isolado no canto superior direito.
- **Grid de seleção de ícone/emoji (Skills)** — convertido para grid fluido de 8 colunas, eliminando overflow horizontal.
- **Botões de Sugestões Rápidas (Skills)** — ajuste de padding/fonte e `break-words`, eliminando truncamento inconsistente entre termos curtos e longos.
- **Largura da lista de habilidades ativas** — removido padding lateral duplicado (`p-6` do container root somado ao `p-5` do painel externo), lista e cards agora ocupam a largura total disponível no mobile.

### Corrigido

- **Clipping do popover de Masmorra** — popover cortado no mobile (incluindo o título) devido a `overflow-hidden` da `<section>` pai; resolvido pela migração a modal (`ModeDescriptionModal.tsx`).
- **Modal comprimido ao abrir Sinfonia Mística** — causado por ancestral com `transform`/`animate-spin`/`scale-110` ativo quebrando o contexto de empilhamento de elementos `position: fixed`; corrigido reposicionando o gatilho para fora da árvore de elementos transformados.
- **Truncamento severo de nomes de habilidade** — nomes exibidos como uma única letra + reticências (ex.: "P...") por disputa de espaço com badge de nível e ícone de editar.
- **Botão duplicado de criação de habilidade** — consolidado em um único ponto de entrada.
- **Cor e posicionamento incorretos do ícone "?" de Mecânica de Prestígio** — corrigido para amarelo/dourado, ancorado ao título já existente (sem título duplicado).

### Arquivos alterados

- `/src/App.tsx` — Seletor de Modo de Incursão, remoção das pílulas de sub-navegação, remoção do painel fixo de logs, nova sub-aba "Logs" em Reino, ajustes de layout do Mural de Contratos e da tela de Foco.
- `/src/components/ModeDescriptionModal.tsx` — criado; modal unificado de descrição de Masmorra/Selvagem.
- `/src/components/navigation/BottomNav.tsx` — diferenciação de comportamento por módulo (navegação direta vs. lista suspensa de sub-abas), atalho de Logs na sidebar desktop.
- `/src/modules/skills/SkillsScreen.tsx` — correções de truncamento, grid de ícones, sugestões rápidas, tooltip de Prestígio, modal de criação de habilidade, largura da lista.
- `/src/components/SkillSelectorModal.tsx` — criado; seletor de habilidade em cartas.
- `/src/modules/character/CharacterScreen.tsx` — badge de título clicável, integração com `TitleEquipModal`.
- `/src/components/TitleEquipModal.tsx` — criado; equipar título diretamente na Ficha de Personagem.
- `/src/modules/kingdom/GuideTab.tsx` — nova seção sobre os 3 Modos de Incursão.
- `/src/modules/skills/useSkills.ts` — disparo de toast em erro de nome duplicado e bloqueio de remoção durante foco.
- Componente de toast (novo) — sistema de notificação temporária reutilizável.

---


### Adicionado

- **Modo Foco (`FocusModeScreen.tsx`)** — novo componente de interface imersiva para a Câmara do Foco, integrado ao `App.tsx` com sincronização de estados e controle do timer Pomodoro.

### Alterado

- **Textos do Modo Foco** — legendas de status atualizadas:
  - Sessão ativa: `SESSÃO EM ANDAMENTO`.
  - Sessão pausada: `SESSÃO PAUSADA`.
- **Layout responsivo** — instruções de teclas de atalho físicas ocultadas na versão mobile; exibidas exclusivamente em desktop (`hidden md:block`): `ESC para sair • ESPAÇO para pausar`.

### Arquivos alterados

- `/src/components/FocusModeScreen.tsx` — criado; interface imersiva da Câmara do Foco.
- `/src/App.tsx` — integração do Modo Foco e sincronização com o timer Pomodoro.

---

## [1.0.12] - 2026-06-28

### Adicionado

- **Relatório Diário (Daily Report)** — modal exibido no início de um novo dia de foco, com identidade visual consistente ao restante do jogo (paleta escura, bordas douradas, aura pulsante, tipografia RPG). Exibe:
  - Bônus de ouro diário.
  - Situação da sequência de dias (streak), com alertas de perda ou proteção por escudo.
  - Sumário de tarefas diárias concluídas ou negligenciadas no dia anterior.

### Alterado

- **Indicador de sincronização (`SyncIndicator`)** — reformulado para ser silencioso por padrão:
  - Estados `idle` e `syncing` agora são completamente invisíveis; o salvamento automático ocorre em segundo plano sem notificações visuais.
  - Componente renderizado exclusivamente em dois estados críticos:
    - *Erro de sincronização*: alerta discreto sinalizando instabilidade na conexão, informando que os dados estão protegidos localmente.
    - *Conflito de save*: alerta solicitando escolha do jogador entre o progresso local e o da nuvem.
  - Estilização migrada de inline para classes Tailwind: fundo `bg-stone-950/95`, `backdrop-blur-md`, tipografia serifada, bordas temáticas e ponto indicador pulsante (`ping glow`) proporcional à gravidade do alerta.
- **Textos e vocabulário**:
  - Loja: `"para gastar na Taverna do Goblin"` → `"para gastar na loja"`.
  - Mensagem de streak zerado: removido o termo `"cognitiva"` da frase de resfriamento de sequência.
  - Mensagem de tarefas concluídas: `"seladas"` substituído por `"concluídas"`; texto de sucesso diário atualizado.

### Arquivos alterados

- `/src/App.tsx` — Relatório Diário e ajustes de textos.
- `/src/components/AuthGate.tsx` — reformulação do `SyncIndicator`.

---

## [1.0.11] - 2026-06-27

### Adicionado

- **Catálogo ampliado de Daily Quests** — adicionadas 20 Proclamações do Dia seguras, baseadas em minutos de foco, sessões concluídas, Wilderness, variedade de skills, XP do dia e Dailies concluídas.
- **Rotação diária de quests** — o usuário agora recebe 3 Daily Quests por dia, escolhidas por sorteio determinístico baseado na data, sem criar novos campos no save state.
- **Definições reutilizáveis de quests** — Daily Quests e Guild Quests passam a seguir o mesmo modelo `QuestDef`, com `getProgress(state)` calculando o progresso a partir do estado atual.

### Alterado

- **Painel de Quests** — a seção de Proclamações do Dia passa a exibir apenas as 3 quests sorteadas para o dia atual.
- **Mural de Contratos Ativos** — o resumo exibido na aba de Foco usa a mesma rotação diária e a mesma fonte de definições do painel completo de Quests.
- **Claims de quests centralizados** — a leitura de recompensas já reivindicadas foi extraída para uma função compartilhada, reduzindo duplicação entre o Painel de Quests e o Mural de Contratos Ativos.
- **Compatibilidade com claims diários datados** — preservado o prefixo `daily_*` para garantir que Daily Quests continuem podendo ser reivindicadas novamente em dias futuros quando retornarem na rotação.

### Arquivos alterados

- `/src/components/QuestsTab.tsx` — criado catálogo rotativo de Daily Quests com definições reutilizáveis (`QuestDef`), métricas derivadas do estado atual e helpers compartilhados de claim.
- `/src/App.tsx` — atualizado o Mural de Contratos Ativos para refletir as mesmas 3 Daily Quests do dia e reutilizar a regra centralizada de claims.

### Observação

- **Guild Quests** — o aumento do rol de Guild Quests não faz parte da `1.0.11`; essa expansão fica planejada para a `1.0.12`.

---

## [1.0.10] - 2026-06-27

### Adicionado

- **Reset diário de Daily Quests** — recompensas de Proclamações do Dia agora são registradas com a data do dia, permitindo que a mesma quest diária volte a ser reivindicável em dias seguintes.

### Alterado

- **Claims de quests** — Daily Quests passam a usar chaves datadas (`claimed_daily_*_<data>`), enquanto Guild Quests permanecem com reivindicação única por save.
- **Mural de Contratos Ativos** — o resumo da aba de Foco usa a mesma regra de claim diário datado do painel completo de Quests.

### Arquivos alterados

- `/src/App.tsx` — atualizado o handler de resgate de quests e o resumo do Mural de Contratos Ativos.
- `/src/components/QuestsTab.tsx` — adicionada leitura de claims diários por data, preservando compatibilidade com claims antigos do mesmo dia.

---

## [1.0.9] - 2026-06-27

### Corrigido

- **Gesto de puxar a aba lateral** — estabilizado o rastreamento do arraste em mobile, evitando falhas intermitentes quando o primeiro movimento acontece antes da atualização visual do estado. A área sensível da borda também foi ampliada para melhorar a pegada do gesto.

### Arquivos alterados

- `/src/App.tsx` — ajustados o rastreamento interno do gesto, a largura da faixa lateral sensível ao toque e o threshold de abertura.

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
