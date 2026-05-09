import { eventDetails, events } from "@/shared/mock/events";
import type { EventDetail, LeagueEvent } from "@/shared/data/types";

export function getEvents(): LeagueEvent[] {
  return events;
}

export function getFeaturedEvent(): LeagueEvent {
  return events[0];
}

export function getEventDetail(slug: string): EventDetail | undefined {
  return eventDetails[slug];
}
