/*
Here you'll write concrete interpreters for your eDSL, which will translate it to the specific monad
*/

import * as T from 'fp-ts/lib/Task';
import Task = T.Task;
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';

import { Program } from "./api";
import { DB, getNextId } from '../../utils/db';
import { john, coolPost, DBPost } from '../../domain';


export const getTaskInterpreter = (): Program<T.URI> => {
    const cache: Map<string, string> = new Map();
    const dbFake: DB = {
        [john.id]: {
            [coolPost.id]: coolPost
        }
    };

    return {
        ...T.task,
        kvGet: (key) => T.of(O.fromNullable(cache.get(key))),
        kvPut: (key, value) => T.of(cache.set(key, value) !== null),
        kvDelete: (key) => T.of(cache.delete(key)),

        getPosts: (userId) => T.of(Object.values(dbFake[userId])),
        createPost: (post) => {
            const id = getNextId(dbFake, post.author.id);
            const newPost: DBPost = { ...post, id };
            dbFake[post.author.id] = dbFake[post.author.id] || {};
            dbFake[post.author.id][id] = newPost;

            return T.of(newPost);
        },
        updatePost: (postId, update) => pipe(
            O.fromNullable((dbFake[update.author.id] || {})[postId]),
            O.fold(
                () => T.of(O.none),
                (existingPost) => {
                    const updatedPost = {
                        ...existingPost,
                        ...update
                    };
                    dbFake[update.author.id] = dbFake[update.author.id] || {};
                    dbFake[update.author.id][postId] = updatedPost;

                    return T.of(O.some(updatedPost));
                }
            )
        ),
        netSend: (payload, email) => T.of(void 0)
    }
}

export const logger = (taskI: Program<T.URI>): Program<T.URI> => ({
    ...taskI,
    kvGet: (key) => {
        console.log(`[kvGet] ${JSON.stringify({ key })}`);
        return taskI.kvGet(key);
    },
    kvPut: (key, value) => {
        console.log(`[kvPut] ${JSON.stringify({ key })}`);
        return taskI.kvPut(key, value);
    },
    kvDelete: (key) => {
        console.log(`[kvDelete] ${JSON.stringify({ key })}`);
        return taskI.kvDelete(key);
    },
    getPosts: (userId) => {
        console.log(`[getPosts] ${JSON.stringify({ userId })}`);
        return taskI.getPosts(userId);
    },
    createPost: (post) => {
        console.log(`[createPost] ${JSON.stringify({ post })}`);
        return taskI.createPost(post);
    },
    updatePost: (postId, update) => {
        console.log(`[updatePost] ${JSON.stringify({ postId, update })}`);
        return taskI.updatePost(postId, update);
    },
    netSend: (payload, email) => {
        console.log(`[netSend] ${JSON.stringify({ payload, email })}`);
        return taskI.netSend(payload, email);
    },
});
