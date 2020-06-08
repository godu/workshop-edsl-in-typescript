import { Do } from 'fp-ts-contrib/lib/Do';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { URIS } from 'fp-ts/lib/HKT';

import { Post } from '../../domain';

import { Program, cacheGetPosts, dbGetPosts, cacheStorePosts, netSendPosts, dbCreatePost, dbUpdatePost, cacheInvalidate } from './api';

// * Write the following:


// 1. Get a list of user posts, cache and send them to 'review@example.com' for a review
export const exampleProgram1 = <F extends URIS>(P: Program<F>) =>
  (userId: number) => Do(P)
    .bind('cachedPosts', cacheGetPosts(P)(userId))
    .bindL('posts', ({ cachedPosts }) => pipe(
      cachedPosts,
      O.fold(
        () => P.chain(
          dbGetPosts(P)(userId),
          posts => P.map(
            cacheStorePosts(P)(userId, posts),
            () => posts
          )
        ),
        posts => P.of(posts)
      )
    ))
    .bindL('net', ({ posts }) => netSendPosts(P)(posts, 'review@example.com'))
    .return(({ net }) => net)

// 2. Create a post and send top-3 to author's email
export const exampleProgram2 = <F extends URIS>(P: Program<F>) =>
  (newPost: Post) => Do(P)
    .bind('post', dbCreatePost(P)(newPost))
    .bindL('top3Posts', ({ post }) =>
      P.chain(
        dbGetPosts(P)(post.author.id),
        allPosts => P.of(allPosts.slice(0, 3))
      )
    )
    .bindL('net', ({ top3Posts, post }) => netSendPosts(P)(top3Posts, post.author.email))
    .return(({ net }) => net)

// 3. Update a post, invalidate the cache if required and return the updated post
export const exampleProgram3 =  <F extends URIS>(P: Program<F>) =>
  (postId: number, update: Post) => Do(P)
        .bind('maybeUpdate', dbUpdatePost(P)(postId, update))
        .bindL('post', ({maybeUpdate}) => pipe(
          maybeUpdate,
          O.fold(
            () => P.of(maybeUpdate),
            (updated) => P.map(
              cacheInvalidate(P)(updated.author.id),
              () => maybeUpdate
            )
          )
        ))
        .return(({post}) => post)
