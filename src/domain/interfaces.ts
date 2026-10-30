import { Projeto, Profissional, Recomendacao, EquipeSugerida } from './entities';

export interface RecommendationStrategy {
  recommend(project: Projeto, professionals: Profissional[]): Recomendacao[];
}

export interface ProjectVisitor {
  visitProject(project: Projeto): void;
  visitProfessional(profissional: Profissional, papel?: string): void;
  getResult(): any;
}