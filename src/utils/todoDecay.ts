import { Todo } from '../types';

export function getTodoDecayValue(todo: Todo, currentDate: Date): number {
  if (todo.completed) return 0; // Não decai após concluído
  if (!todo.createdAt) return 0; // Fallback seguro para legados
  
  const created = new Date(todo.createdAt);
  const createdZero = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const dateZero = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  const diffDays = Math.max(0, Math.round((dateZero.getTime() - createdZero.getTime()) / 86400000));
  const decayed = Math.floor(diffDays / 2) * -1;
  
  return Math.max(decayed, -20); // Limita ao piso de -20
}
