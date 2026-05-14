export type Review = {
  quote: string;
  source: "Zillow" | "Google" | "Realtor.com";
  short?: string;
};

// Empty by default — real reviews are added through admin → Reviews.
// (When this array is empty, the homepage reviews strip + /reviews page
// gracefully hide review-specific UI.)
export const reviews: Review[] = [];

export const ratingsLine: Array<{ source: string; value: number; count: string }> = [
  { source: "Zillow", value: 5.0, count: "12 reviews" },
];
