// * Write the following:

import { Free, free } from 'fp-ts-contrib/lib/Free';
import * as O from 'fp-ts/lib/Option';
import { Do } from 'fp-ts-contrib/lib/Do';
import { pipe } from 'fp-ts/lib/pipeable';
import Option = O.Option

import { Post, PostUpdate } from '../../domain';
import { notImplemented } from '../../utils/throw';
import { ProgramFURI, cacheGetPosts, dbGetPosts, cacheStorePosts, netSendPosts, dbCreatePost } from './api';

// 1. Get a list of user posts, cache and send them to 'review@example.com' for a review
export const exampleProgram1 =
  (userId: number): Free<ProgramFURI, void> => Do(free)
    .bind('cachedPosts', cacheGetPosts(userId))
    .bindL('posts', ({ cachedPosts }) => pipe(
      cachedPosts,
      O.fold(
        () => free.chain(
          dbGetPosts(userId),
          (posts) => free.map(
            cacheStorePosts(userId, posts),
            () => posts
          )
        ),
        (posts) => free.of(posts)
      )
    ))
    .bindL('net', ({ posts }) => netSendPosts(posts, 'review@example.com'))
    .return(({ net }) => net)

// 2. Create a post and send top-3 to author's email
export const exampleProgram2 =
  (newPost: Post): Free<ProgramFURI, void> => Do(free)
    .bind('newPost', dbCreatePost(newPost))

// 3. Update a post, invalidate the cache if required and return the updated post
export const exampleProgram3 =
  (postId: number, update: PostUpdate): Free<ProgramFURI, Option<Post>> => notImplemented();
