export interface AmbientTrack {
  id: string;
  nome: string;
  icone: string;
  arquivo: string;
}

export const AMBIENT_SOUNDS: AmbientTrack[] = [
  { id: 'floresta', nome: 'Floresta', icone: '🌲', arquivo: 'sounds/floresta.mp3' },
  { id: 'chuva', nome: 'Chuva', icone: '🌧', arquivo: 'sounds/chuva.mp3' },
  { id: 'taverna', nome: 'Taverna', icone: '🍺', arquivo: 'sounds/taverna.mp3' },
  { id: 'biblioteca', nome: 'Biblioteca', icone: '📚', arquivo: 'sounds/biblioteca.mp3' },
  { id: 'ruinas', nome: 'Ruínas', icone: '🏛', arquivo: 'sounds/ruinas.mp3' },
  { id: 'montanha', nome: 'Montanha', icone: '⛰', arquivo: 'sounds/montanha.mp3' },
  { id: 'cidade', nome: 'Cidade', icone: '🏘', arquivo: 'sounds/cidade.mp3' },
  { id: 'templo', nome: 'Templo', icone: '⛩', arquivo: 'sounds/templo.mp3' },
];
