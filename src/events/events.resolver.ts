import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Dataloaders } from "../dataloader/dataloader.types";
import { Group } from "../groups/models/group.model";
import { Image } from "../images/models/image.model";
import { User } from "../users/models/user.model";
import { EventAttendeesService } from "./event-attendees/event-attendees.service";
import { EventAttendee } from "./event-attendees/models/event-attendee.model";
import { EventsService } from "./events.service";
import { CreateEventInput } from "./models/create-event.input";
import { CreateEventPayload } from "./models/create-event.payload";
import { Event } from "./models/event.model";
import { EventsInput } from "./models/events.input";
import { UpdateEventInput } from "./models/update-event.input";
import { UpdateEventPayload } from "./models/update-event.payload";

@Resolver(() => Event)
export class EventsResolver {
  constructor(
    private eventsService: EventsService,
    private eventAttendeesService: EventAttendeesService
  ) {}

  @Query(() => Event)
  async event(@Args("id", { type: () => Int, nullable: true }) id: number) {
    return this.eventsService.getEvent({ id });
  }

  @Query(() => [Event])
  async events(@Args("filter") eventsInput: EventsInput) {
    return this.eventsService.getEvents(eventsInput);
  }

  @ResolveField(() => [EventAttendee])
  async attendees(@Parent() { id }: Event) {
    return this.eventAttendeesService.getEventAttendees({ eventId: id });
  }

  @ResolveField(() => String, { nullable: true })
  async attendingStatus(
    @CurrentUser() { id: currentUserId }: User,
    @Parent() { id }: Event
  ) {
    return this.eventsService.getAttendingStatus(id, currentUserId);
  }

  @ResolveField(() => Group)
  async group(
    @Context() { loaders }: { loaders: Dataloaders },
    @Parent() { groupId }: Event
  ) {
    return groupId ? loaders.groupsLoader.load(groupId) : null;
  }

  @ResolveField(() => Image)
  async coverPhoto(
    @Parent() { id }: Event,
    @Context() { loaders }: { loaders: Dataloaders }
  ) {
    return loaders.eventCoverPhotosLoader.load(id);
  }

  @Mutation(() => CreateEventPayload)
  async createEvent(
    @Args("eventData") eventData: CreateEventInput,
    @CurrentUser() { id }: User
  ) {
    return this.eventsService.createEvent(eventData, id);
  }

  @Mutation(() => UpdateEventPayload)
  async updateEvent(@Args("eventData") eventData: UpdateEventInput) {
    return this.eventsService.updateEvent(eventData);
  }

  @Mutation(() => Boolean)
  async deleteEvent(@Args("id", { type: () => Int }) id: number) {
    return this.eventsService.deleteEvent(id);
  }
}
