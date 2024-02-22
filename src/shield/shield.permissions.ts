import { allow, and, or, shield } from 'graphql-shield';
import { FORBIDDEN } from '../common/common.constants';
import { isAuthenticated } from './rules/auth.rules';
import {
  canManageComments,
  isOwnComment,
  isPublicComment,
  isPublicCommentImage,
} from './rules/comment.rules';
import {
  canManageEvents,
  isPublicEvent,
  isPublicEventImage,
  isPublicEventPost,
} from './rules/event.rules';
import {
  canApproveGroupMemberRequests,
  canCreateGroupEvents,
  canDeleteGroup,
  canManageGroupComments,
  canManageGroupEvents,
  canManageGroupPosts,
  canManageGroupRoles,
  canManageGroupSettings,
  canUpdateGroup,
  isGroupMember,
  isProposalGroupJoinedByMe,
  isPublicGroup,
  isPublicGroupImage,
  isPublicGroupRole,
} from './rules/group.rules';
import { isPublicLike } from './rules/like.rules';
import { isOwnNotification } from './rules/notification.rules';
import {
  canManagePosts,
  isOwnPost,
  isPublicPost,
  isPublicPostImage,
} from './rules/post.rules';
import {
  canRemoveProposals,
  hasNoVotes,
  isOwnProposal,
  isPublicProposal,
  isPublicProposalAction,
  isPublicProposalImage,
  isPublicProposalVote,
} from './rules/proposal.rules';
import {
  canManageQuestionnaireTickets,
  isOwnAnswer,
  isOwnQuestion,
  isOwnQuestionnaireTicket,
  isOwnQuestionnaireTicketReviewer,
  isOwnQuestionnaireTicketReviewerAvatar,
} from './rules/question.rules';
import { canManageServerRoles } from './rules/role.rules';
import { canManageRules, isPublicRule } from './rules/rule.rules';
import { canManageServerSettings } from './rules/server-config.rules';
import {
  canCreateServerInvites,
  canManageServerInvites,
} from './rules/server-invite.rules';
import {
  canRemoveMembers,
  isMe,
  isOwnUserAvatar,
  isPublicUserAvatar,
  isUserInPublicGroups,
  isVerified,
} from './rules/user.rules';

export const shieldPermissions = shield(
  {
    Query: {
      me: isAuthenticated,
      users: canRemoveMembers,
      isFirstUser: allow,
      serverInvite: allow,
      serverInvites: or(canCreateServerInvites, canManageServerInvites),
      serverConfig: canManageServerSettings,
      post: or(isVerified, isPublicPost, isPublicEventPost),
      likes: or(isVerified, isPublicComment, isPublicEventPost, isPublicPost),
      proposal: or(isVerified, isPublicProposal),
      group: or(isVerified, isPublicGroup),
      event: or(isVerified, isPublicEvent),
      groupRole: isGroupMember,
      publicGroupsFeed: allow,
      publicGroups: allow,
      publicGroupsCount: allow,
      publicCanary: allow,
      serverRules: allow,
      events: allow,
    },
    Mutation: {
      login: allow,
      logOut: allow,
      signUp: allow,
      updatePost: isOwnPost,
      deletePost: or(isOwnPost, canManagePosts, canManageGroupPosts),
      deleteProposal: or(and(isOwnProposal, hasNoVotes), canRemoveProposals),
      createVote: or(isProposalGroupJoinedByMe, canManageQuestionnaireTickets),
      createServerInvite: or(canCreateServerInvites, canManageServerInvites),
      deleteServerInvite: canManageServerInvites,
      updateServerConfig: canManageServerSettings,
      createServerRole: canManageServerRoles,
      updateServerRole: canManageServerRoles,
      deleteServerRole: canManageServerRoles,
      deleteServerRoleMember: canManageServerRoles,
      approveGroupMemberRequest: canApproveGroupMemberRequests,
      updateGroupConfig: canManageGroupSettings,
      updateGroup: canUpdateGroup,
      deleteGroup: canDeleteGroup,
      createGroupRole: canManageGroupRoles,
      updateGroupRole: canManageGroupRoles,
      deleteGroupRole: canManageGroupRoles,
      deleteGroupRoleMember: canManageGroupRoles,
      createEvent: or(canCreateGroupEvents, canManageGroupEvents),
      deleteEvent: or(canManageEvents, canManageGroupEvents),
      updateEvent: or(canManageEvents, canManageGroupEvents),
      createRule: canManageRules,
      deleteRule: canManageRules,
      updateRule: canManageRules,
      updateRulesPriority: canManageRules,
      updateNotification: isOwnNotification,
      deleteNotification: isOwnNotification,
      updateComment: isOwnComment,
      deleteComment: or(
        isOwnComment,
        canManageComments,
        canManageGroupComments,
      ),
    },
    User: {
      id: or(
        isMe,
        isVerified,
        isUserInPublicGroups,
        isOwnQuestionnaireTicketReviewer,
      ),
      name: or(
        isMe,
        isVerified,
        isUserInPublicGroups,
        isOwnQuestionnaireTicketReviewer,
      ),
      profilePicture: or(
        isMe,
        isVerified,
        isUserInPublicGroups,
        isOwnQuestionnaireTicketReviewer,
      ),
      questionnaireTicket: isMe,
    },
    Group: {
      id: or(isVerified, isPublicGroup),
      name: or(isVerified, isPublicGroup),
      description: or(isVerified, isPublicGroup),
      coverPhoto: or(isVerified, isPublicGroup),
      settings: or(isVerified, isPublicGroup),
      feed: or(isVerified, isPublicGroup),
      feedCount: or(isVerified, isPublicGroup),
      futureEvents: or(isVerified, isPublicGroup),
      pastEvents: or(isVerified, isPublicGroup),
      memberCount: or(isVerified, isPublicGroup),
      memberRequests: canApproveGroupMemberRequests,
      memberRequestCount: canApproveGroupMemberRequests,
      roles: isGroupMember,
    },
    GroupConfig: or(isVerified, isPublicGroup),
    GroupRole: {
      id: or(isVerified, isPublicGroupRole),
      name: or(isVerified, isPublicGroupRole),
      color: or(isVerified, isPublicGroupRole),
    },
    FeedItemsConnection: or(
      isVerified,
      isPublicEventPost,
      isPublicProposal,
      isPublicPost,
    ),
    PublicFeedItemsConnection: allow,
    Image: {
      id: or(
        isOwnQuestionnaireTicketReviewerAvatar,
        isOwnUserAvatar,
        isPublicCommentImage,
        isPublicEventImage,
        isPublicGroupImage,
        isPublicPostImage,
        isPublicProposalImage,
        isPublicUserAvatar,
        isVerified,
      ),
      filename: or(
        isVerified,
        isPublicCommentImage,
        isPublicPostImage,
        isPublicProposalImage,
      ),
    },
    ServerInvite: {
      id: allow,
      token: allow,
    },
    Canary: {
      id: allow,
      statement: allow,
      updatedAt: allow,
    },
    QuestionnaireTicket: {
      id: or(isOwnQuestionnaireTicket, canManageQuestionnaireTickets),
      prompt: or(isOwnQuestionnaireTicket, canManageQuestionnaireTickets),
      questions: or(isOwnQuestionnaireTicket, canManageQuestionnaireTickets),
      comments: or(isOwnQuestionnaireTicket, canManageQuestionnaireTickets),
      status: or(isOwnQuestionnaireTicket, canManageQuestionnaireTickets),
    },
    Question: or(isOwnQuestion, canManageQuestionnaireTickets),
    Answer: or(isOwnAnswer, canManageQuestionnaireTickets),
    AuthPayload: {
      access_token: allow,
    },
    Rule: or(isVerified, isPublicRule),
    Event: or(isVerified, isPublicEvent),
    Post: or(isVerified, isPublicPost, isPublicEventPost),
    Like: or(isVerified, isPublicLike),
    Comment: or(isVerified, isPublicComment, isOwnQuestionnaireTicket),
    Proposal: or(isVerified, isPublicProposal),
    ProposalConfig: or(isVerified, isPublicProposal),
    ProposalAction: or(isVerified, isPublicProposalAction),
    ProposalActionEvent: or(isVerified, isPublicProposalAction),
    ProposalActionEventHost: or(isVerified, isPublicProposalAction),
    ProposalActionPermission: or(isVerified, isPublicProposalAction),
    ProposalActionRole: or(isVerified, isPublicProposalAction),
    ProposalActionRoleMember: or(isVerified, isPublicProposalAction),
    ProposalActionGroupConfig: or(isVerified, isPublicProposalAction),
    Vote: or(isVerified, isPublicProposalVote),
  },
  {
    fallbackRule: isVerified,
    fallbackError: FORBIDDEN,
    allowExternalErrors: true,
  },
);
