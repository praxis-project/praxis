import { allow, or, shield } from 'graphql-shield';
import * as hash from 'object-hash';
import { FORBIDDEN } from '../../common/common.constants';
import { isAuthenticated } from '../rules/auth.rules';
import {
  canManageComments,
  isOwnComment,
  isPublicComment,
} from '../rules/comment.rules';
import {
  canManageEvents,
  isPublicEvent,
  isPublicEventPost,
} from '../rules/event.rules';
import {
  canCreateGroupEvents,
  canManageGroupComments,
  canManageGroupEvents,
  isProposalGroupJoinedByMe,
} from '../rules/group.rules';
import { isPublicLike } from '../rules/like.rules';
import { isPublicPost } from '../rules/post.rules';
import { isPublicProposalVote } from '../rules/proposal.rules';
import {
  canManageQuestionnaireTickets,
  isOwnAnswer,
  isOwnQuestion,
  isOwnQuestionComment,
  isOwnQuestionnaireTicket,
  isOwnQuestionnaireTicketComment,
} from '../rules/question.rules';
import { canManageServerRoles } from '../rules/role.rules';
import { canManageRules, isPublicRule } from '../rules/rule.rules';
import { isVerified } from '../rules/user.rules';
import { authPermissions } from './auth.permissions';
import { groupPermissions } from './group.permissions';
import { imagePermissions } from './image.permissions';
import { notificationPermissions } from './notification.permissions';
import { postPermissions } from './post.permissions';
import { proposalPermissions } from './proposal.permissions';
import { serverConfigPermissions } from './server-config.permissions';
import { serverInvitePermissions } from './server-invite.permissions';
import { userPermissions } from './user.permissions';

export const shieldPermissions = shield(
  {
    Query: {
      ...authPermissions.Query,
      ...groupPermissions.Query,
      ...notificationPermissions.Query,
      ...postPermissions.Query,
      ...proposalPermissions.Query,
      ...serverConfigPermissions.Query,
      ...serverInvitePermissions.Query,
      ...userPermissions.Query,
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
      ...authPermissions.Mutation,
      ...groupPermissions.Mutation,
      ...notificationPermissions.Mutation,
      ...postPermissions.Mutation,
      ...proposalPermissions.Mutation,
      ...serverConfigPermissions.Mutation,
      ...serverInvitePermissions.Mutation,
      ...userPermissions.Mutation,
      createVote: or(isProposalGroupJoinedByMe, canManageQuestionnaireTickets),
      createServerRole: canManageServerRoles,
      updateServerRole: canManageServerRoles,
      deleteServerRole: canManageServerRoles,
      deleteServerRoleMember: canManageServerRoles,
      createEvent: or(canCreateGroupEvents, canManageGroupEvents),
      deleteEvent: or(canManageEvents, canManageGroupEvents),
      updateEvent: or(canManageEvents, canManageGroupEvents),
      answerQuestions: isAuthenticated,
      createRule: canManageRules,
      deleteRule: canManageRules,
      updateRule: canManageRules,
      updateRulesPriority: canManageRules,
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
    ...authPermissions.ObjectTypes,
    ...groupPermissions.ObjectTypes,
    ...imagePermissions.ObjectTypes,
    ...notificationPermissions.ObjectTypes,
    ...postPermissions.ObjectTypes,
    ...proposalPermissions.ObjectTypes,
    ...serverInvitePermissions.ObjectTypes,
    ...userPermissions.ObjectTypes,
    ServerPermissions: isAuthenticated,
    Comment: or(
      isOwnQuestionComment,
      isOwnQuestionnaireTicketComment,
      isPublicComment,
      isVerified,
    ),
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
    AnswerQuestionsPayload: isAuthenticated,
    CreateCommentPayload: isAuthenticated,
    CreateLikePayload: isAuthenticated,
    UpdateCommentPayload: isAuthenticated,
    Rule: or(isVerified, isPublicRule),
    Event: or(isVerified, isPublicEvent),
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
