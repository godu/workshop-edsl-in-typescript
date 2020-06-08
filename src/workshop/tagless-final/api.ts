import { Post, PostUpdate, DBPost } from '../../domain';
import { notImplemented } from '../../utils/throw';
import { Kind, URIS } from 'fp-ts/lib/HKT';
import * as O from 'fp-ts/lib/Option';
import Option = O.Option;
import { Monad1 } from 'fp-ts/lib/Monad';
import { Functor1 } from 'fp-ts/lib/Functor';

/*
Here you'll write API for the eDSL – a set of operations which represent your core domain logic

Our domain requires the following set of operations:

* KV Store *

kvGet    : (key: string) => Option<string>
kvPut    : (key: string, value: string) => boolean
kvDelete : (key: string) => boolean

* Database *

getPosts   : (userId: number) => DBPost[]
createPost : (post: Post) => DBPost
updatePost : (postId: number, update: PostUpdate) => Option<DBPost>

* Network *

netSend : <T>(payload: T, email: string) => void
*/

// * API

interface KVStore<F extends URIS> {
  readonly kvGet: (key: string) => Kind<F, Option<string>>;
  readonly kvPut: (key: string, value: string) => Kind<F, boolean>;
  readonly kvDelete: (key: string) => Kind<F, boolean>;
}

interface Database<F extends URIS> {
  readonly getPosts: (userId: number) => Kind<F, DBPost[]>;
  readonly createPost: (post: Post) => Kind<F, DBPost>;
  readonly updatePost: (postId: number, udpate: PostUpdate) => Kind<F, Option<DBPost>>;
}

interface NetSend<F extends URIS> {
  readonly netSend: <T>(payload: T, email: string) => Kind<F, void>;
}

export type Program<F extends URIS> = KVStore<F> & Database<F> & NetSend<F> & Monad1<F>;

/**
 * Tries to get user's posts from cache, returns either `none` in case of cache miss,
 * and `some` in case of hit.
 *
 * @param userId User ID for which we want to get cached posts
 */
export const cacheGetPosts = <F extends URIS>(KV: KVStore<F> & Functor1<F>) =>
  (userId: number) => KV.map(KV.kvGet(`${userId}`), O.map(str => JSON.parse(str) as DBPost[]));

/**
 * Stores a list of posts of the given user (identified by `userId`) in the cache.
 *
 * @param userId User ID – a will be used as a key for cache
 * @param posts A list of posts to store in cache
 */
export const cacheStorePosts = <F extends URIS>(KV: KVStore<F>) =>
  (userId: number, posts: Post[]) => KV.kvPut(`${userId}`, JSON.stringify(posts));

/**
 * Clears cache for a given user ID.
 *
 * @param userId User ID
 */
export const cacheInvalidate = <F extends URIS>(KV: KVStore<F>) =>
  (userId: number) => KV.kvDelete(`${userId}`);

/**
 * Gets a list of posts belonging to the given user (identified by `userId`).
 *
 * @param userId User ID – author of posts
 */
export const dbGetPosts = <F extends URIS>(DB: Database<F>) =>
  (userId: number) => DB.getPosts(userId);

/**
 * Stores post in the database.
 *
 * @param post Post data to store in the DB
 */
export const dbCreatePost = <F extends URIS>(DB: Database<F>) =>
  (post: Post) => DB.createPost(post);

/**
 * Updated a post in the database, identified by its ID.
 *
 * @param postId Post ID
 * @param update A set of updated fields for this post ID
 */
export const dbUpdatePost = <F extends URIS>(DB: Database<F>) =>
  (postId: number, update: PostUpdate) => DB.updatePost(postId, update);

/**
 * Sends a list of posts via network.
 *
 * @param posts A list of posts to send via network
 * @param to Email to send these `posts` to.
 */
export const netSendPosts = <F extends URIS>(NS: NetSend<F>) =>
  (posts: Post[], to: string) => NS.netSend(posts, to);

/**
 * **Bonus points**: implement a `getInstanceFor` method. Think what `P` parameter might be?
 */
export const getInstanceFor = <F extends URIS>(P: Program<F>) => {
  return {
    cacheGetPosts: cacheGetPosts(P),
    cacheStorePosts: cacheStorePosts(P),
    cacheInvalidate: cacheInvalidate(P),
    dbGetPosts: dbGetPosts(P),
    dbCreatePost: dbCreatePost(P),
    dbUpdatePost: dbUpdatePost(P),
    netSendPosts: netSendPosts(P),
  };
};
