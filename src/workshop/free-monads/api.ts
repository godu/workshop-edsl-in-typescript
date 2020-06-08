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

import * as O from 'fp-ts/lib/Option';
import Option = O.Option;
import { liftF } from 'fp-ts-contrib/lib/Free';
import { identity, constUndefined } from 'fp-ts/lib/function';

import { Post, PostUpdate, DBPost } from '../../domain';

// * API

class KVGet<Continuation> {
  readonly tag: 'KVGet' = 'KVGet';
  readonly _A!: Continuation;
  readonly _URI!: ProgramFURI;

  constructor(
    readonly key: string,
    readonly next: (value: Option<string>) => Continuation
  ) { }
}

class KVPut<Continuation> {
  readonly tag: 'KVPut' = 'KVPut';
  readonly _A!: Continuation;
  readonly _URI!: ProgramFURI;

  constructor(
    readonly key: string,
    readonly value: string,
    readonly next: (isOk: boolean) => Continuation
  ) { }
}

class KVDelete<Continuation> {
  readonly tag: 'KVDelete' = 'KVDelete';
  readonly _A!: Continuation;
  readonly _URI!: ProgramFURI;

  constructor(
    readonly key: string,
    readonly next: (isOk: boolean) => Continuation
  ) { }
}

type KVStoreF<Continuation> =
  | KVGet<Continuation>
  | KVPut<Continuation>
  | KVDelete<Continuation>

class DBGetPosts<Continuation> {
  readonly tag: 'DBGetPosts' = 'DBGetPosts';
  readonly _A!: Continuation;
  readonly _URI!: ProgramFURI;

  constructor(
    readonly userId: number,
    readonly next: (posts: DBPost[]) => Continuation
  ) { }
}

class DBCreatePost<Continuation> {
  readonly tag: 'DBCreatePost' = 'DBCreatePost';
  readonly _A!: Continuation;
  readonly _URI!: ProgramFURI;

  constructor(
    readonly post: Post,
    readonly next: (newPost: DBPost) => Continuation
  ) { }
}
class DBUpdatePost<Continuation> {
  readonly tag: 'DBUpdatePost' = 'DBUpdatePost';
  readonly _A!: Continuation;
  readonly _URI!: ProgramFURI;

  constructor(
    readonly postId: number,
    readonly update: PostUpdate,
    readonly next: (updatedPost: Option<DBPost>) => Continuation
  ) { }
}

type DatabaseF<Continuation> =
  | DBGetPosts<Continuation>
  | DBCreatePost<Continuation>
  | DBUpdatePost<Continuation>

class NetSend<Continuation, Payload> {
  readonly tag: 'NetSend' = 'NetSend';
  readonly _A!: Continuation;
  readonly _URI!: ProgramFURI;

  constructor(
    readonly payload: Payload,
    readonly email: string,
    readonly next: () => Continuation
  ) { }
}

export type ProgramF<Continuation> =
  | KVStoreF<Continuation>
  | DatabaseF<Continuation>
  | NetSend<Continuation, unknown>

export const ProgramFURI = 'ProgramF';
export type ProgramFURI = typeof ProgramFURI;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    ProgramF: ProgramF<A>
  }
}

/**
 * Tries to get user's posts from cache, returns either `none` in case of cache miss,
 * and `some` in case of hit.
 *
 * @param userId User ID for which we want to get cached posts
 */
export const cacheGetPosts =
  (userId: number) => liftF(new KVGet(`${userId}`, O.map(str => JSON.parse(str) as DBPost[])));

/**
 * Stores a list of posts of the given user (identified by `userId`) in the cache.
 *
 * @param userId User ID – a will be used as a key for cache
 * @param posts A list of posts to store in cache
 */
export const cacheStorePosts =
  (userId: number, posts: DBPost[]) => liftF(new KVPut(`${userId}`, JSON.stringify(posts), identity));

/**
 * Clears cache for a given user ID.
 *
 * @param userId User ID
 */
export const cacheInvalidate =
  (userId: number) => liftF(new KVDelete(`${userId}`, identity));

/**
 * Gets a list of posts belonging to the given user (identified by `userId`).
 *
 * @param userId User ID – author of posts
 */
export const dbGetPosts =
  (userId: number) => liftF(new DBGetPosts(userId, identity));

/**
 * Stores post in the database.
 *
 * @param post Post data to store in the DB
 */
export const dbCreatePost =
  (post: Post) => liftF(new DBCreatePost(post, identity));

/**
 * Updated a post in the database, identified by its ID.
 *
 * @param postId Post ID
 * @param update A set of updated fields for this post ID
 */
export const dbUpdatePost =
  (postId: number, update: PostUpdate) => liftF(new DBUpdatePost(postId, update, identity))

/**
 * Sends a list of posts via network.
 *
 * @param posts A list of posts to send via network
 * @param to Email to send these `posts` to.
 */
export const netSendPosts =
  (posts: Post[], to: string) => liftF(new NetSend(posts, to, constUndefined));
