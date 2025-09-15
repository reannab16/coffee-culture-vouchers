export type OfferConfig = {
  name: string; // cafe display name
  offerName: string; // e.g., "Welcome Bundle"
  included: { name: string; number: number }[];
  pin?: string; // staff PIN in plain (we'll hash into DB on seed)
};

export const offersByCafe: Record<string, OfferConfig> = {
  "kasa-cafe": {
    name: "Kasa Café",
    offerName: "Freshers Freebies",
    included: [
      { name: "50% off Drink", number: 1 },
      { name: "Cookie", number: 1 }
    ],
    pin: "8421"
  }
};