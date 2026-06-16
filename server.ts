import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API: Generate AI Chronicle from study notes
app.post("/api/oracle/chronicle", async (req: express.Request, res: express.Response) => {
  try {
    const { charName, charClass, skillName, duration, notes, combo, wilderness } = req.body;

    if (!notes || !notes.trim()) {
      res.status(400).json({ error: "Notas da sessão estão vazias." });
      return;
    }

    if (!ai) {
      // Return a mocked elegant fallback text if API key is not ready, to ensure 100% graceful degradation
      res.json({
        chronicle: `*Os arquivos sagrados tremeluziram, nas cinzas da biblioteca celestial.* Mas um grande feito foi executado: **${charName}**, o(a) valente **${charClass}**, dedicou seu foco por longos **${duration} minutos** decifrando os códigos de **${skillName}**.\n\n"Tudo o que ouvimos é uma opinião, não um fato. Tudo o que vemos é uma perspectiva, não a verdade." — *Marco Aurélio*\n\n*(Nota: O Gemini API não está configurado ou chave inválida. Defina as credenciais para ativar o Oráculo Real.)*`
      });
      return;
    }

    const thematicPrompt = `
Personagem: ${charName} (Classe: ${charClass})
Tarefa de Estudo / Habilidade focada: ${skillName}
Duração oficial: ${duration} minutes
Wilderness Ativo? ${wilderness ? "Sim, a jornada ocorreu nas profundezas da Terra Selvagem de altíssimo perigo e vigilância máxima" : "Não, foi uma zona segura de foco controlado."}
Combo de foco atual: ${combo}x vezes focado consecutivamente.

Anotações do usuário feitas durante o estudo:
"${notes}"

Instruções:
Como o Oráculo Místico de HeroLog, escreva uma Crônica de Aventura baseada nessas notas de estudo.
Construa uma narrativa medieval-fantástica em português onde o esforço cognitivo do usuário representa o aprendizado de magias, alquimia ou golpes de combate.
Use a classe (${charClass}) para ditar o tom (Mago usa runas/intelecto, Guerreiro disciplina física/espada, Ranger precisão/arcos).
Após a crônica de aventura dramática, adicione uma linha de espaço e uma seção chamada "**[CONSELHO DO ORÁCULO]**" trazendo um ensinamento filosófico e inspirador voltado à disciplina, estoicismo ou foco, com 2-3 frases de autores renomados adaptadas ao contexto.
Seja imersivo, medieval, místico e poético. Escreva de forma empolgante!
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: thematicPrompt,
      config: {
        systemInstruction: "Você é o Oráculo de HeroLog. Sua função é receber anotações escolares, profissionais ou de programação de um aventureiro e transformá-las em narrativas épicas de RPG em português-brasileiro, ensinando sobre resiliência e força mental.",
        temperature: 0.8,
      }
    });

    const chronicle = response.text || "As runas do destino perderam o brilho antes de revelar a crônica mística...";
    res.json({ chronicle });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "As trevas consumiram as comunicações com o Oráculo: " + error.message });
  }
});

// Configure Vite or Static Assets serving based on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve HTML
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HeroLog server running on http://0.0.0.0:${PORT} [ENV: ${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();
