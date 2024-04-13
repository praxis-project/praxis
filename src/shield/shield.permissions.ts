import { allow, or, shield } from 'graphql-shield';
import * as hash from 'object-hash';
import { FORBIDDEN } from '../common/common.constants';
import { authPermissions } from './permissions/auth.permissions';
import { groupPermissions } from './permissions/group.permissions';
import { imagePermissions } from './permissions/image.permissions';
import { proposalPermissions } from './permissions/proposal.permissions';
import { userPermissions } from './permissions/user.permissions';
import { isAuthenticated } from './rules/auth.rules';
import {
  canManageComments,
  isOwnComment,
  isPublicComment,
} from './rules/comment.rules';
import {
  canManageEvents,
  isPublicEvent,
  isPublicEventPost,
} from './rules/event.rules';
import {
  canCreateGroupEvents,
  canManageGroupComments,
  canManageGroupEvents,
  canManageGroupPosts,
  isProposalGroupJoinedByMe,
} from './rules/group.rules';
import { isPublicLike } from './rules/like.rules';
import { isOwnNotification } from './rules/notification.rules';
import { canManagePosts, isOwnPost, isPublicPost } from './rules/post.rules';
import { isPublicProposal, isPublicProposalVote } from './rules/proposal.rules';
import {
  canManageQuestionnaireTickets,
  isOwnAnswer,
  isOwnQuestion,
  isOwnQuestionComment,
  isOwnQuestionnaireTicket,
  isOwnQuestionnaireTicketComment,
} from './rules/question.rules';
import { canManageServerRoles } from './rules/role.rules';
import { canManageRules, isPublicRule } from './rules/rule.rules';
import { canManageServerSettings } from './rules/server-config.rules';
import {
  canCreateServerInvites,
  canManageServerInvites,
} from './rules/server-invite.rules';
import { isVerified } from './rules/user.rules';

export const shieldPermissions = shield(
  {
    Query: {
      ...authPermissions.Query,
      ...groupPermissions.Query,
      ...proposalPermissions.Query,
      ...userPermissions.Query,
      notifications: isAuthenticated,
      notificationsCount: isAuthenticated,
      unreadNotificationsCount: isAuthenticated,
      serverInvite: allow,
      serverInvites: or(canCreateServerInvites, canManageServerInvites),
      serverConfig: canManageServerSettings,
      post: or(isVerified, isPublicPost, isPublicEventPost),
      event: or(isVerified, isPublicEvent),
      publicCanary: allow,
      serverRules: allow,
      question: or(isOwnQuestion, canManageQuestionnaireTickets),
      events: allow,
      likes: or(
        isAuthenticated,
        isPublicComment,
        isPublicEventPost,
        isPublicPost,
      ),
    },
    Mutation: {
      ...userPermissions.Mutation,
      ...authPermissions.Mutation,
      ...groupPermissions.Mutation,
      ...proposalPermissions.Mutation,
      updatePost: isOwnPost,
      deletePost: or(isOwnPost, canManagePosts, canManageGroupPosts),
      createVote: or(isProposalGroupJoinedByMe, canManageQuestionnaireTickets),
      createServerInvite: or(canCreateServerInvites, canManageServerInvites),
      deleteServerInvite: canManageServerInvites,
      updateServerConfig: canManageServerSettings,
      createServerRole: canManageServerRoles,
      updateServerRole: canManageServerRoles,
      deleteServerRole: canManageServerRoles,
      deleteServerRoleMember: canManageServerRoles,
      readNotifications: isAuthenticated,
      clearNotifications: isAuthenticated,
      createEvent: or(canCreateGroupEvents, canManageGroupEvents),
      deleteEvent: or(canManageEvents, canManageGroupEvents),
      updateEvent: or(canManageEvents, canManageGroupEvents),
      answerQuestions: isAuthenticated,
      createRule: canManageRules,
      deleteRule: canManageRules,
      updateRule: canManageRules,
      updateRulesPriority: canManageRules,
      updateNotification: isOwnNotification,
      deleteNotification: isOwnNotification,
      createComment: or(isVerified, isOwnQuestion, isOwnQuestionnaireTicket),
      updateComment: isOwnComment,
      deleteComment: or(
        isOwnComment,
        canManageComments,
        canManageGroupComments,
      ),
      createLike: or(
        isOwnQuestion,
        isOwnQuestionComment,
        isOwnQuestionnaireTicketComment,
        isVerified,
      ),
      deleteLike: or(
        isOwnQuestion,
        isOwnQuestionComment,
        isOwnQuestionnaireTicketComment,
        isVerified,
      ),
    },
    Subscription: {
      notification: isAuthenticated,
    },
    ...authPermissions.ObjectTypes,
    ...groupPermissions.ObjectTypes,
    ...imagePermissions.ObjectTypes,
    ...proposalPermissions.ObjectTypes,
    ...userPermissions.ObjectTypes,
    ServerPermissions: isAuthenticated,
    FeedItemsConnection: or(
      isVerified,
      isPublicEventPost,
      isPublicProposal,
      isPublicPost,
    ),
    PublicFeedItemsConnection: allow,
    Comment: or(
      isOwnQuestionComment,
      isOwnQuestionnaireTicketComment,
      isPublicComment,
      isVerified,
    ),
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
      user: or(isOwnQuestionnaireTicket, canManageQuestionnaireTickets),
    },
    Question: or(isOwnQuestion, canManageQuestionnaireTickets),
    Answer: or(isOwnAnswer, canManageQuestionnaireTickets),
    Notification: isOwnNotification,
    AnswerQuestionsPayload: isAuthenticated,
    CreateCommentPayload: isAuthenticated,
    CreateLikePayload: isAuthenticated,
    UpdateCommentPayload: isAuthenticated,
    UpdateNotificationPayload: isAuthenticated,
    Rule: or(isVerified, isPublicRule),
    Event: or(isVerified, isPublicEvent),
    Post: or(isVerified, isPublicPost, isPublicEventPost),
    Like: or(isAuthenticated, isPublicLike),
    Vote: or(isVerified, isPublicProposalVote),
  },
  {
    fallbackRule: isVerified,
    fallbackError: FORBIDDEN,
    allowExternalErrors: true,

    /**
     * Convert `args` object to a string to avoid caching errors when
     * some fields are promises. This is required because of how
     * GraphQL Upload sends files as promises.
     */
    hashFunction: ({ parent, args }) => {
      const argsString = JSON.stringify(args);
      return hash({ parent, args: argsString });
    },
  },
);
