export type VisibilityRating = "poor" | "fair" | "good" | "excellent";
export type Confidence = "low" | "medium" | "high";
export type PilingLabel = "close R" | "back R" | "back L" | "far L";

export interface VisibilityAssessment {
  description: string;
  pilingCount: number;
  visiblePilings: PilingLabel[];
  estimatedVisibilityFt: number;
  rating: VisibilityRating;
  confidence: Confidence;
}
