import React from 'react';
import { BookMarked, Swords, Skull, Flame, Sparkles } from 'lucide-react';

export const GuideTab: React.FC = () => {
  return (
    <div className="p-4 max-w-xl mx-auto space-y-5 leading-relaxed font-serif text-amber-100/80">
      <h3 className="text-lg text-amber-400 border-b border-amber-500/20 pb-2 mb-4 tracking-wider uppercase flex items-center gap-2">
        <BookMarked className="w-5 h-5 text-amber-500" />
        Tutorial
      </h3>

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
