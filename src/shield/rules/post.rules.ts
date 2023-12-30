import { rule } from 'graphql-shield';
import { Context } from '../../context/context.types';
import { GroupPrivacy } from '../../groups/group-configs/group-configs.constants';
import { UpdatePostInput } from '../../posts/models/update-post.input';
import { UNAUTHORIZED } from '../../common/common.constants';
import { Post } from '../../posts/models/post.model';
import { PostsConnection } from '../../posts/models/posts.connection';

export const isOwnPost = rule({ cache: 'strict' })(async (
  _parent,
  args: { id: number } | { postData: UpdatePostInput },
  { user, services: { usersService } }: Context,
) => {
  if (!user) {
    return UNAUTHORIZED;
  }
  return usersService.isUsersPost(
    'id' in args ? args.id : args.postData.id,
    user.id,
  );
});

export const isPublicPost = rule({ cache: 'strict' })(async (
  parent: Post | PostsConnection | null,
  args: { id: number },
  { services: { postsService } }: Context,
) => {
  let postId: number | undefined;

  if (parent instanceof Post) {
    postId = parent.id;
  } else if (parent && 'nodes' in parent) {
    postId = parent.nodes[0].id;
  } else if (args) {
    postId = args.id;
  }
  if (!postId) {
    return false;
  }
  const post = await postsService.getPost(postId, ['group.config']);
  return post?.group?.config.privacy === GroupPrivacy.Public;
});

export const isPublicPostImage = rule({ cache: 'strict' })(
  async (parent, _args, { services: { postsService } }: Context) =>
    postsService.isPublicPostImage(parent.id),
);
