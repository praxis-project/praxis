import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { CommentsService } from '../comments/comments.service';
import { Dataloaders } from '../dataloader/dataloader.types';
import { EventsService } from '../events/events.service';
import { GroupRolesService } from '../groups/group-roles/group-roles.service';
import { GroupsService } from '../groups/groups.service';
import { ImagesService } from '../images/images.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PostsService } from '../posts/posts.service';
import { ProposalActionsService } from '../proposals/proposal-actions/proposal-actions.service';
import { ProposalsService } from '../proposals/proposals.service';
import { ShieldService } from '../shield/shield.service';
import { User } from '../users/models/user.model';
import { UserPermissions } from '../users/user.types';
import { UsersService } from '../users/users.service';

export interface ContextServices {
  commentsService: CommentsService;
  eventsService: EventsService;
  groupRolesService: GroupRolesService;
  groupsService: GroupsService;
  imagesService: ImagesService;
  notificationsService: NotificationsService;
  postsService: PostsService;
  proposalActionsService: ProposalActionsService;
  proposalsService: ProposalsService;
  shieldService: ShieldService;
  usersService: UsersService;
}

export interface Context {
  loaders: Dataloaders;
  permissions: UserPermissions | null;
  services: ContextServices;
  user: User | null;
  logger: Logger;
  res?: Response;
}

export interface GetContextOptions {
  connectionParams?: { authorization: string };
  req?: Request;
  res?: Response;
}
