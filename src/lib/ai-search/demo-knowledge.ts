import type { KnowledgeMatch } from "@/lib/ai-search/types";

const demoEntries = [
  ["Detroit places", "Detroit dining, coffee, parks, museums, music, and family activities can be explored by neighborhood. This is demo guidance only; confirm current hours, prices, availability, and accessibility directly with each venue before visiting."],
  ["Neighborhoods", "Downtown Detroit is a civic and entertainment center. Midtown is known for museums, cafes, and the arts corridor. Corktown is known for restaurants, local shops, and historic character. Southwest Detroit is known for food, murals, and community roots. This is demo guidance only, not a housing recommendation."],
  ["Housing and schools", "For housing, schools, childcare, and family services, compare current official information, visit the area, and speak with qualified local professionals. Detroit Connect does not verify school quality, housing availability, pricing, or credentials in this demo knowledge base."],
  ["Transportation", "Detroit travel planning may involve walking, biking, driving, public transit, or rideshare. Check current schedules, service alerts, parking rules, and accessibility information with the official provider before traveling. This is demo guidance only."],
  ["Jobs and services", "Local jobs, legal help, healthcare, childcare, nonprofits, and small-business services should be verified through the provider's current official website or phone number. Detroit Connect does not confirm availability or credentials in this demo knowledge base."],
  ["Events and activities", "Events, festivals, performances, markets, and community activities change frequently. Confirm the date, location, ticketing, age requirements, and cancellation policy with the official organizer. This is demo guidance only."],
] as const;

export function getDemoKnowledge(query: string): KnowledgeMatch[] {
  return demoEntries.map(([title, content], index) => ({
    id: `demo-${index + 1}`,
    sourceId: "demo-knowledge-base",
    kind: "file",
    title: `Demo knowledge base — ${title}`,
    href: null,
    heading: "Demo content — verify before relying on it",
    content: `${content} User question: ${query}`,
    similarity: 0,
  }));
}
