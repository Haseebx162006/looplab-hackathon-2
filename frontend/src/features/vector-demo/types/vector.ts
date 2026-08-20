export interface VectorItem {
  id?: number;
  title: string;
  content: string;
  embedding: number[];
}

export interface VectorSearchResult {
  id: number;
  title: string;
  content: string;
  distance: number;
}
