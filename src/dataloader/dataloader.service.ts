/**
 * TODO: Determine whether data loaders should be renamed to more
 * clearly indicate whether IDs are being mapped to one or many
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { EventAttendeeStatus } from '../events/models/event-attendee.model';
import { Event } from '../events/models/event.model';
import { initGroupRolePermissions } from '../groups/group-roles/group-role.utils';
import { GroupPermissions } from '../groups/group-roles/models/group-permissions.type';
import { GroupRole } from '../groups/group-roles/models/group-role.model';
import { GroupMemberRequestStatus } from '../groups/models/group-member-request.model';
import { Group } from '../groups/models/group.model';
import { ImageTypes } from '../images/image.constants';
import { Image } from '../images/models/image.model';
import { Like } from '../likes/models/like.model';
import { Post } from '../posts/models/post.model';
import { Proposal } from '../proposals/models/proposal.model';
import { ProposalAction } from '../proposals/proposal-actions/models/proposal-action.model';
import { ServerRole } from '../server-roles/models/server-role.model';
import { User } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { Vote } from '../votes/models/vote.model';
import {
  Dataloaders,
  EventWithGoingCount,
  EventWithInterestedCount,
  GroupRoleWithMemberCount,
  GroupWithMemberCount,
  GroupWithMemberRequestCount,
  IsFollowedByMeKey,
  IsLikedByMeKey,
  MyGroupsKey,
  PostWithCommentCount,
  PostWithLikeCount,
  ProposalWithCommentCount,
  ProposalWithVoteCount,
  ServerRoleWithMemberCount,
} from './dataloader.types';

@Injectable()
export class DataloaderService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,

    @InjectRepository(ProposalAction)
    private proposalActionRepository: Repository<ProposalAction>,

    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,

    @InjectRepository(Post)
    private postRepository: Repository<Post>,

    @InjectRepository(Like)
    private likeRepository: Repository<Like>,

    @InjectRepository(Group)
    private groupRepository: Repository<Group>,

    @InjectRepository(GroupRole)
    private groupRoleRepository: Repository<GroupRole>,

    @InjectRepository(ServerRole)
    private serverRoleRepository: Repository<ServerRole>,

    @InjectRepository(Event)
    private eventRepository: Repository<Event>,

    @InjectRepository(Image)
    private imageRepository: Repository<Image>,

    private usersService: UsersService,
  ) {}

  getLoaders(): Dataloaders {
    return {
      // Proposals & Votes
      proposalActionsLoader: this._createProposalActionsLoader(),
      proposalImagesLoader: this._createProposalImagesLoader(),
      proposalVoteCountLoader: this._createProposalVoteCountLoader(),
      proposalVotesLoader: this._createProposalVotesLoader(),
      proposalCommentCountLoader: this._createProposalCommentCountLoader(),

      // Posts
      isPostLikedByMeLoader: this._createIsPostLikedByMeLoader(),
      postCommentCountLoader: this._createPostCommentCountLoader(),
      postImagesLoader: this._createPostImagesLoader(),
      postLikeCountLoader: this._createPostLikeCountLoader(),
      postLikesLoader: this._createPostLikesLoader(),

      // Comments
      commentImagesLoader: this._createCommentImagesLoader(),

      // Groups
      groupCoverPhotosLoader: this._createGroupCoverPhotosLoader(),
      groupMemberCountLoader: this._createGroupMemberCountLoader(),
      groupMembersLoader: this._createGroupMembersLoader(),
      groupsLoader: this._createGroupsLoader(),
      isJoinedByMeLoader: this._createIsJoinedByMeLoader(),
      memberRequestCountLoader: this._createMemberRequestCountLoader(),

      // Users
      followerCountLoader: this._createFollowerCountLoader(),
      followingCountLoader: this._createFollowingCountLoader(),
      isFollowedByMeLoader: this._createIsFollowedByMeLoader(),
      profilePicturesLoader: this._createProfilePicturesLoader(),
      usersLoader: this._createUsersLoader(),

      // Roles & Permissions
      groupRoleMemberCountLoader: this._createGroupRoleMemberCountLoader(),
      serverRoleMemberCountLoader: this._createServerRoleMemberCountLoader(),
      myGroupPermissionsLoader: this._createMyGroupPermissionsLoader(),

      // Events
      eventCoverPhotosLoader: this._createEventCoverPhotosLoader(),
      interestedCountLoader: this._createInterestedCountLoader(),
      goingCountLoader: this._createGoingCountLoader(),
      eventsLoader: this._createEventsLoader(),
    };
  }

  /**
   * Creates a new dataloader with the given batch function and options.
   *
   * Passing a custom batch schedule function enables dataloader to work
   * with asyncronous middleware.
   *
   * Source: https://dev.to/tsirlucas/integrating-dataloader-with-concurrent-react-53h1
   */
  private _getDataLoader<K, V, C = K>(
    batchFn: DataLoader.BatchLoadFn<K, V>,
    options: DataLoader.Options<K, V, C> = {},
  ) {
    return new DataLoader<K, V, C>(batchFn, {
      batchScheduleFn: (callback) => setTimeout(callback, 5),
      ...options,
    });
  }

  // -------------------------------------------------------------------------
  // Proposals & Votes
  // -------------------------------------------------------------------------

  private _createProposalVotesLoader() {
    return this._getDataLoader<number, Vote[]>(async (proposalIds) => {
      const votes = await this.voteRepository.find({
        where: { proposalId: In(proposalIds) },
      });
      const mappedVotes = proposalIds.map(
        (id) =>
          votes.filter((vote: Vote) => vote.proposalId === id) ||
          new Error(`Could not load votes for proposal: ${id}`),
      );
      return mappedVotes;
    });
  }

  private _createProposalVoteCountLoader() {
    return this._getDataLoader<number, number>(async (proposalIds) => {
      const proposals = (await this.proposalRepository
        .createQueryBuilder('proposal')
        .leftJoinAndSelect('proposal.votes', 'vote')
        .loadRelationCountAndMap('proposal.voteCount', 'proposal.votes')
        .select(['proposal.id'])
        .whereInIds(proposalIds)
        .getMany()) as ProposalWithVoteCount[];

      return proposalIds.map((id) => {
        const proposal = proposals.find(
          (proposal: Proposal) => proposal.id === id,
        );
        if (!proposal) {
          return new Error(`Could not load vote count for proposal: ${id}`);
        }
        return proposal.voteCount;
      });
    });
  }

  private _createProposalImagesLoader() {
    return this._getDataLoader<number, Image[]>(async (proposalIds) => {
      const images = await this.imageRepository.find({
        where: { proposalId: In(proposalIds) },
      });
      const mappedImages = proposalIds.map(
        (id) =>
          images.filter((image: Image) => image.proposalId === id) ||
          new Error(`Could not load images for proposal: ${id}`),
      );
      return mappedImages;
    });
  }

  private _createProposalActionsLoader() {
    return this._getDataLoader<number, ProposalAction>(
      async (proposalActionIds) => {
        const proposalActions = await this.proposalActionRepository.find({
          where: { id: In(proposalActionIds) },
        });
        return proposalActionIds.map(
          (id) =>
            proposalActions.find(
              (proposalAction: ProposalAction) => proposalAction.id === id,
            ) || new Error(`Could not load proposal action: ${id}`),
        );
      },
    );
  }

  private _createProposalCommentCountLoader() {
    return this._getDataLoader<number, number>(async (proposalIds) => {
      const proposals = (await this.proposalRepository
        .createQueryBuilder('proposal')
        .leftJoinAndSelect('proposal.comments', 'comment')
        .loadRelationCountAndMap('proposal.commentCount', 'proposal.comments')
        .select(['proposal.id'])
        .whereInIds(proposalIds)
        .getMany()) as ProposalWithCommentCount[];

      return proposalIds.map((id) => {
        const proposal = proposals.find(
          (proposal: Proposal) => proposal.id === id,
        );
        if (!proposal) {
          return new Error(`Could not load comment count for proposal: ${id}`);
        }
        return proposal.commentCount;
      });
    });
  }

  // -------------------------------------------------------------------------
  // Posts
  // -------------------------------------------------------------------------

  private _createIsPostLikedByMeLoader() {
    return this._getDataLoader<IsLikedByMeKey, boolean, number>(
      async (keys) => {
        const postIds = keys.map(({ postId }) => postId);
        const likes = await this.likeRepository.find({
          where: {
            postId: In(postIds),
            userId: keys[0].currentUserId,
          },
        });
        return postIds.map((postId) =>
          likes.some((like: Like) => like.postId === postId),
        );
      },
      { cacheKeyFn: (key) => key.postId },
    );
  }

  private _createPostImagesLoader() {
    return this._getDataLoader<number, Image[]>(async (postIds) => {
      const images = await this.imageRepository.find({
        where: { postId: In(postIds) },
      });
      return postIds.map(
        (id) =>
          images.filter((image: Image) => image.postId === id) ||
          new Error(`Could not load images for post: ${id}`),
      );
    });
  }

  private _createPostLikesLoader() {
    return this._getDataLoader<number, Like[]>(async (postIds) => {
      const likes = await this.likeRepository.find({
        where: { postId: In(postIds) },
      });
      return postIds.map(
        (id) =>
          likes.filter((like: Like) => like.postId === id) ||
          new Error(`Could not load likes for post: ${id}`),
      );
    });
  }

  private _createPostLikeCountLoader() {
    return this._getDataLoader<number, number>(async (postIds) => {
      const posts = (await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.likes', 'like')
        .loadRelationCountAndMap('post.likeCount', 'post.likes')
        .select(['post.id'])
        .whereInIds(postIds)
        .getMany()) as PostWithLikeCount[];

      return postIds.map((id) => {
        const post = posts.find((post: Post) => post.id === id);
        if (!post) {
          return new Error(`Could not load like count for post: ${id}`);
        }
        return post.likeCount;
      });
    });
  }

  private _createPostCommentCountLoader() {
    return this._getDataLoader<number, number>(async (postIds) => {
      const posts = (await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.comments', 'comment')
        .loadRelationCountAndMap('post.commentCount', 'post.comments')
        .select(['post.id'])
        .whereInIds(postIds)
        .getMany()) as PostWithCommentCount[];

      return postIds.map((id) => {
        const post = posts.find((post: Post) => post.id === id);
        if (!post) {
          return new Error(`Could not load comment count for post: ${id}`);
        }
        return post.commentCount;
      });
    });
  }

  // -------------------------------------------------------------------------
  // Comments
  // -------------------------------------------------------------------------

  private _createCommentImagesLoader() {
    return this._getDataLoader<number, Image[]>(async (commentIds) => {
      const images = await this.imageRepository.find({
        where: { commentId: In(commentIds) },
      });
      return commentIds.map(
        (id) =>
          images.filter((image: Image) => image.commentId === id) ||
          new Error(`Could not load images for comment: ${id}`),
      );
    });
  }

  // -------------------------------------------------------------------------
  // Groups
  // -------------------------------------------------------------------------

  private _createGroupsLoader() {
    return this._getDataLoader<number, Group>(async (groupIds) => {
      const groups = await this.groupRepository.find({
        where: { id: In(groupIds) },
      });
      return groupIds.map(
        (id) =>
          groups.find((group: Group) => group.id === id) ||
          new Error(`Could not load group: ${id}`),
      );
    });
  }

  private _createGroupCoverPhotosLoader() {
    return this._getDataLoader<number, Image>(async (groupIds) => {
      const coverPhotos = await this.imageRepository.find({
        where: { groupId: In(groupIds), imageType: ImageTypes.CoverPhoto },
      });
      const mappedCoverPhotos = groupIds.map(
        (id) =>
          coverPhotos.find((coverPhoto: Image) => coverPhoto.groupId === id) ||
          new Error(`Could not load cover photo for group: ${id}`),
      );
      return mappedCoverPhotos;
    });
  }

  private _createMemberRequestCountLoader() {
    return this._getDataLoader<number, number>(async (groupIds) => {
      const groups = (await this.groupRepository
        .createQueryBuilder('group')
        .leftJoinAndSelect('group.memberRequests', 'memberRequest')
        .loadRelationCountAndMap(
          'group.memberRequestCount',
          'group.memberRequests',
          'memberRequest',
          (qb) =>
            qb.andWhere('memberRequest.status = :status', {
              status: GroupMemberRequestStatus.Pending,
            }),
        )
        .select(['group.id'])
        .whereInIds(groupIds)
        .getMany()) as GroupWithMemberRequestCount[];

      return groupIds.map((id) => {
        const group = groups.find((group: Group) => group.id === id);
        if (!group) {
          return new Error(`Could not load member request count: ${id}`);
        }
        return group.memberRequestCount;
      });
    });
  }

  private _createGroupMemberCountLoader() {
    return this._getDataLoader<number, number>(async (groupIds) => {
      const groups = (await this.groupRepository
        .createQueryBuilder('group')
        .leftJoinAndSelect('group.members', 'groupMember')
        .loadRelationCountAndMap('group.memberCount', 'group.members')
        .select(['group.id'])
        .whereInIds(groupIds)
        .getMany()) as GroupWithMemberCount[];

      return groupIds.map((id) => {
        const group = groups.find((group: Group) => group.id === id);
        if (!group) {
          return new Error(`Could not load group member count: ${id}`);
        }
        return group.memberCount;
      });
    });
  }

  private _createGroupMembersLoader() {
    return this._getDataLoader<number, User[]>(async (groupIds) => {
      const groups = await this.groupRepository.find({
        where: { id: In(groupIds) },
        relations: ['members'],
      });
      return groupIds.map((groupId) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) {
          return new Error(`Could not load group members: ${groupId}`);
        }
        return group.members;
      });
    });
  }

  private _createIsJoinedByMeLoader() {
    return this._getDataLoader<MyGroupsKey, boolean, number>(
      async (keys) => {
        const groupIds = keys.map(({ groupId }) => groupId);
        const groups = await this.groupRepository.find({
          where: { id: In(groupIds) },
          relations: ['members'],
        });

        return groupIds.map((groupId) => {
          const group = groups.find((g) => g.id === groupId);
          if (!group) {
            return new Error(`Could not load group: ${groupId}`);
          }
          return group.members.some(
            (member) => member.id === keys[0].currentUserId,
          );
        });
      },
      { cacheKeyFn: (key) => key.groupId },
    );
  }

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------

  private _createFollowerCountLoader() {
    return this._getDataLoader<number, number>(async (userIds) =>
      this.usersService.getFollowerCountBatch(userIds as number[]),
    );
  }

  private _createFollowingCountLoader() {
    return this._getDataLoader<number, number>(async (userIds) =>
      this.usersService.getFollowingCountBatch(userIds as number[]),
    );
  }

  private _createIsFollowedByMeLoader() {
    return this._getDataLoader<IsFollowedByMeKey, boolean, number>(
      async (keys) =>
        this.usersService.getIsFollowedByMeBatch(keys as IsFollowedByMeKey[]),
      { cacheKeyFn: (key) => key.followedUserId },
    );
  }

  private _createUsersLoader() {
    return this._getDataLoader<number, User>(async (userIds) =>
      this.usersService.getUsersBatch(userIds as number[]),
    );
  }

  private _createProfilePicturesLoader() {
    return this._getDataLoader<number, Image>(async (userIds) =>
      this.usersService.getProfilePicturesBatch(userIds as number[]),
    );
  }

  // -------------------------------------------------------------------------
  // Roles & Permissions
  // -------------------------------------------------------------------------

  private _createGroupRoleMemberCountLoader() {
    return this._getDataLoader<number, number>(async (roleIds) => {
      const roles = (await this.groupRoleRepository
        .createQueryBuilder('role')
        .leftJoinAndSelect('role.members', 'roleMember')
        .loadRelationCountAndMap('role.memberCount', 'role.members')
        .select(['role.id'])
        .whereInIds(roleIds)
        .getMany()) as GroupRoleWithMemberCount[];

      return roleIds.map((id) => {
        const role = roles.find((role: GroupRole) => role.id === id);
        if (!role) {
          return new Error(`Could not load role member count: ${id}`);
        }
        return role.memberCount;
      });
    });
  }

  private _createServerRoleMemberCountLoader() {
    return this._getDataLoader<number, number>(async (roleIds) => {
      const roles = (await this.serverRoleRepository
        .createQueryBuilder('role')
        .leftJoinAndSelect('role.members', 'roleMember')
        .loadRelationCountAndMap('role.memberCount', 'role.members')
        .select(['role.id'])
        .whereInIds(roleIds)
        .getMany()) as ServerRoleWithMemberCount[];

      return roleIds.map((id) => {
        const role = roles.find((role: ServerRole) => role.id === id);
        if (!role) {
          return new Error(`Could not load role member count: ${id}`);
        }
        return role.memberCount;
      });
    });
  }

  private _createMyGroupPermissionsLoader() {
    return this._getDataLoader<MyGroupsKey, GroupPermissions, number>(
      async (keys) => {
        const groupIds = keys.map(({ groupId }) => groupId);
        const { groupPermissions } = await this.usersService.getUserPermissions(
          keys[0].currentUserId,
        );
        return groupIds.map((id) => {
          if (!groupPermissions[id]) {
            return initGroupRolePermissions();
          }
          return groupPermissions[id];
        });
      },
      { cacheKeyFn: (key) => key.groupId },
    );
  }

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  private _createEventCoverPhotosLoader() {
    return this._getDataLoader<number, Image>(async (eventIds) => {
      const coverPhotos = await this.imageRepository.find({
        where: { eventId: In(eventIds), imageType: ImageTypes.CoverPhoto },
      });
      const mappedCoverPhotos = eventIds.map(
        (id) =>
          coverPhotos.find((coverPhoto: Image) => coverPhoto.eventId === id) ||
          new Error(`Could not load cover photo for event: ${id}`),
      );
      return mappedCoverPhotos;
    });
  }

  private _createEventsLoader() {
    return this._getDataLoader<number, Event>(async (eventIds) => {
      const events = await this.eventRepository.find({
        where: { id: In(eventIds) },
      });
      return eventIds.map(
        (id) =>
          events.find((event: Event) => event.id === id) ||
          new Error(`Could not load event: ${id}`),
      );
    });
  }

  private _createInterestedCountLoader() {
    return this._getDataLoader<number, number>(async (eventIds) => {
      const events = (await this.eventRepository
        .createQueryBuilder('event')
        .loadRelationCountAndMap(
          'event.interestedCount',
          'event.attendees',
          'eventAttendee',
          (qb) =>
            qb.where('eventAttendee.status = :status', {
              status: EventAttendeeStatus.Interested,
            }),
        )
        .select(['event.id'])
        .whereInIds(eventIds)
        .getMany()) as EventWithInterestedCount[];

      return eventIds.map((id) => {
        const event = events.find((event: Event) => event.id === id);
        if (!event) {
          return new Error(`Could not load interested count for event: ${id}`);
        }
        return event.interestedCount;
      });
    });
  }

  private _createGoingCountLoader() {
    return this._getDataLoader<number, number>(async (eventIds) => {
      const events = (await this.eventRepository
        .createQueryBuilder('event')
        .loadRelationCountAndMap(
          'event.goingCount',
          'event.attendees',
          'eventAttendee',
          (qb) =>
            qb.where('eventAttendee.status = :status', {
              status: EventAttendeeStatus.Going,
            }),
        )
        .select(['event.id'])
        .whereInIds(eventIds)
        .getMany()) as EventWithGoingCount[];

      return eventIds.map((id) => {
        const event = events.find((event: Event) => event.id === id);
        if (!event) {
          return new Error(`Could not load going count for event: ${id}`);
        }
        return event.goingCount;
      });
    });
  }
}
