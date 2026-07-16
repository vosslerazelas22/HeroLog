import React from 'react';
import { BookMarked, Swords, Skull, Flame, Sparkles, Compass, Shield, Coins, RotateCcw } from 'lucide-react';

export const GuideTab: React.FC = () => {
  return (
    <div className="p-4 max-w-xl mx-auto space-y-5 leading-relaxed font-serif text-amber-100/80">
      <div className="space-y-4 text-xs md:text-sm">
        <section className="bg-amber-500/[0.02] border border-amber-500/10 rounded-lg p-4">
          <h4 className="text-amber-300 font-bold mb-1.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Como Funciona o Jogo?
          </h4>
          <p>
            HeroLog funde a famosa técnica Pomodoro com elementos clássicos de RPG de Fantasia Escura. Cada minuto dedicado ao estudo desenvolve suas verdadeiras habilidades, gera fortunas de Ouro do Reino (GP) e concede experiência (XP) ao seu nível de combate heróico. 
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-amber-300 font-bold flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-500" /> Escolha sua Classe e Atributos:
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-amber-100/60 font-serif">
            <li>
              <strong className="text-amber-100 italic">Mago (Mage):</strong> O arquétipo do intelecto puro. Concede <strong className="text-amber-400">+20% de bônus de XP</strong> fixo ao concluir qualquer Missão de Foco.
            </li>
            <li>
              <strong className="text-amber-100 italic">Guerreiro (Warrior):</strong> Robustez e disciplina firme. Concede <strong className="text-amber-400">+20% de bônus de Ouro (GP)</strong> fixo em todas as aventuras.
            </li>
            <li>
              <strong className="text-amber-100 italic">Patrulheiro (Ranger):</strong> Velocidade e rastro de precisão. Concede <strong className="text-amber-400">+15% de bônus de Série de Ofício</strong>, reduzindo as penalidades por atraso na consistência.
            </li>
          </ul>
        </section>

        {/* NEW SECTION: Modos de Incursão */}
        <section className="bg-stone-950/40 border border-amber-500/15 rounded-lg p-4 space-y-3">
          <h4 className="text-amber-300 font-bold mb-1 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500" /> Modos de Incursão de Foco
          </h4>
          <p className="text-xs text-amber-100/70 leading-relaxed">
            O HeroLog oferece três modos de foco (incursões) adaptados para diferentes níveis de compromisso e tolerância a riscos. Ajuste seu modo no painel de preparação antes de iniciar uma sessão:
          </p>

          <div className="space-y-3 pt-1">
            {/* Modo Padrão Card */}
            <div className="p-3 rounded-lg bg-stone-900/30 border border-stone-850">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-serif font-black text-stone-300 uppercase tracking-wider text-[11px]">
                  Modo Padrão (Neutro)
                </span>
              </div>
              <p className="text-[11px] text-amber-100/65 font-sans leading-relaxed">
                <strong className="text-stone-300">Regras:</strong> Sem regras especiais ou restrições. É o caminho seguro e flexível.<br />
                <strong className="text-stone-300">Recompensas:</strong> Multiplicadores padrão (neutro), sem bônus adicionais.
              </p>
            </div>

            {/* Modo Masmorra Card */}
            <div className="p-3 rounded-lg bg-purple-950/[0.08] border border-purple-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Swords className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span className="font-serif font-black text-purple-400 uppercase tracking-wider text-[11px]">
                  Modo Masmorra (Dungeon)
                </span>
              </div>
              <div className="text-[11px] text-amber-100/65 font-sans leading-relaxed space-y-1">
                <p>
                  <strong className="text-purple-300">Regras da Jornada:</strong> Exige o compromisso absoluto de realizar <strong className="text-purple-200">4 sessões consecutivas</strong> de foco sem abandonar a jornada.
                </p>
                <p>
                  <strong className="text-purple-300">Recompensas Magnas:</strong> Receba <strong className="text-purple-200">+50% de XP por minuto</strong> em cada sessão, rolos de saque quadruplicados (<strong className="text-purple-200">Quad Loot</strong>), <strong className="text-purple-200">40% de chance de saque Lendário</strong> e um bônus monumental de <strong className="text-purple-200">+2.500 GP</strong> ao concluir as 4 sessões.
                </p>
                <p className="text-purple-300/80 italic text-[10px] flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Tempo de recarga de 2 horas após a conclusão. Não acumulável com o Modo Selvagem.
                </p>
              </div>
            </div>

            {/* Modo Selvagem Card */}
            <div className="p-3 rounded-lg bg-red-950/[0.08] border border-red-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Skull className="w-3.5 h-3.5 text-red-400" />
                <span className="font-serif font-black text-red-400 uppercase tracking-wider text-[11px]">
                  Modo Selvagem (Wilderness)
                </span>
              </div>
              <p className="text-[11px] text-amber-100/65 font-sans leading-relaxed">
                <strong className="text-red-300">Regras da Jornada:</strong> Voto cognitivo severo. Qualquer tentativa de minimizar ou trocar de aba do navegador convoca a morte e falha o bônus automaticamente (perda instantânea da recompensa da sessão).<br />
                <strong className="text-red-300">Recompensas Magnas:</strong> Sobreviventes ganham <strong className="text-red-200">+25% de XP & GP extras</strong> no fechamento do foco.
              </p>
            </div>
          </div>

          {/* Tabela Comparativa Lado a Lado */}
          <div className="mt-3 pt-3.5 border-t border-amber-500/10">
            <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2 font-serif flex items-center gap-1">
              <Coins className="w-3 h-3" /> Tabela Rápida (Risco vs. Recompensa)
            </h5>
            <div className="overflow-x-auto rounded border border-stone-900 bg-stone-950/40">
              <table className="w-full text-[10px] text-left border-collapse text-amber-100/65 font-sans">
                <thead>
                  <tr className="border-b border-amber-500/15 bg-stone-900/60 font-serif">
                    <th className="py-2 px-2.5 text-amber-300 font-bold">Modo</th>
                    <th className="py-2 px-2.5 text-amber-300 font-bold">Compromisso</th>
                    <th className="py-2 px-2.5 text-amber-300 font-bold">Bônus Ativo</th>
                    <th className="py-2 px-2.5 text-amber-300 font-bold">Penalidade de Falha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-900">
                  <tr className="hover:bg-stone-900/20">
                    <td className="py-2 px-2.5 font-semibold text-stone-300">Padrão</td>
                    <td className="py-2 px-2.5">Flexível / Livre</td>
                    <td className="py-2 px-2.5 text-stone-400">Nenhum</td>
                    <td className="py-2 px-2.5">Sem punição extra</td>
                  </tr>
                  <tr className="bg-purple-950/15 hover:bg-purple-950/25">
                    <td className="py-2 px-2.5 font-semibold text-purple-400 font-serif">Masmorra</td>
                    <td className="py-2 px-2.5">Alto (4 sessões)</td>
                    <td className="py-2 px-2.5 text-purple-300 font-medium">+50% XP, Quad Loot, +2500 GP</td>
                    <td className="py-2 px-2.5 text-red-400/80">Perda de progresso do combo</td>
                  </tr>
                  <tr className="bg-red-950/15 hover:bg-red-950/25">
                    <td className="py-2 px-2.5 font-semibold text-red-400 font-serif">Selvagem</td>
                    <td className="py-2 px-2.5">Extremo (Foco Único)</td>
                    <td className="py-2 px-2.5 text-red-300 font-medium">+25% XP & GP extras</td>
                    <td className="py-2 px-2.5 text-red-400">Morte (Perda dos bônus e ganhos)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Guia de Decisão */}
          <div className="mt-3.5 p-3 bg-amber-500/[0.01] border border-amber-500/5 rounded-lg text-[10.5px] font-sans text-amber-100/60 leading-relaxed space-y-1.5">
            <h5 className="font-serif font-black text-amber-300 uppercase tracking-wider text-[9.5px]">
              Orientação: Quando escolher cada modo?
            </h5>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong className="text-stone-300">Escolha o Modo Padrão:</strong> Quando precisar de foco maleável, onde interrupções externas, trocas de aba rápidas ou pausas imprevistas podem ocorrer.
              </li>
              <li>
                <strong className="text-purple-300">Escolha o Modo Masmorra:</strong> Para maratonas intensas e estruturadas de estudo (ex: blocos de 2 horas), potencializando a experiência heróica e a conquista de tesouros lendários de alto valor.
              </li>
              <li>
                <strong className="text-red-300">Escolha o Modo Selvagem:</strong> Quando precisar de disciplina absoluta contra distrações digitais, usando o perigo iminente de perder o progresso como âncora de atenção inquebrável.
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-red-500/[0.02] border border-red-500/10 rounded-lg p-4 space-y-2">
          <h4 className="text-rose-400 font-bold flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-500" /> 💀 Terra Selvagem (Modo Wilderness):
          </h4>
          <p className="text-amber-100/70">
            A Wilderness é uma região de altíssimo perigo cognitivo. Se você ativá-lo antes de iniciar a Missão de Foco:
          </p>
          <ul className="list-disc pl-5 mt-1 space-y-1 text-amber-100/50 text-xs">
            <li>
              Qualquer tentativa de sair do navegador ou trocar de aba invoca a sombra da morte.
            </li>
            <li>
              Você escutará o bater rápido de seu próprio coração e receberá um alerta crítico com <strong>3 segundos de período de carência</strong> para retornar antes da punição total.
            </li>
            <li>
              A morte causa perda instantâneo de toda a recompensa acumulada na sessão atual. No entanto, os fortes que sobrevivem à incursão ganham um multiplicador glorioso de <strong>+25% extras de Ouro e XP</strong>.
            </li>
          </ul>
        </section>

        <section className="space-y-1">
          <h4 className="text-amber-300 font-bold flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" /> Combo de consistência (streak):
          </h4>
          <p className="text-amber-100/60 font-serif">
            Sessões completas sequencialmente geram um combo multiplicador acumulado de <strong className="text-amber-400">+5% bônus de XP por foco extra consecutivo</strong>, até o teto místico de +50% no total. Não desista e mantenha a chama viva!
          </p>
        </section>
      </div>
    </div>
  );
};
