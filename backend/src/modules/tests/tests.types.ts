export interface GenerateTestInput {
  module_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionAnswer {
  question_id: string;
  selected_answer: string;
}

export interface TestSubmissionInput {
  answers: QuestionAnswer[];
}
