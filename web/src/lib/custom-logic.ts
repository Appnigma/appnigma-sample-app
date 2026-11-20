import type { CustomLogicItem } from "@server-types";

// "put-our-account-tier-into" reads as "Put our account tier into".
const titleOf = (name: string): string => {
  const words = name.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// What the rule does, in the best words there are: the agent's summary of the
// latest change, what is live, or what was asked.
const whatItDoes = (item: CustomLogicItem): string | null => item.summary ?? item.description ?? item.asked;

const switchWordsOf = (item: CustomLogicItem): string => {
  if (!item.alwaysOn) return "Runs when the data is read or saved";
  return item.on ? "On" : "Off";
};

export { switchWordsOf, titleOf, whatItDoes };
