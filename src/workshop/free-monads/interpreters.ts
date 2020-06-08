/*
Here you'll write concrete interpreters for your eDSL, which will translate it to the specific monad
*/

import * as T from 'fp-ts/lib/Task';
import Task = T.Task;
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';

import { ProgramF, ProgramFURI } from "./api";
import { DB, getNextId } from '../../utils/db';
import { john, coolPost, DBPost } from '../../domain';

type Interpreter = <A>(program: ProgramF<A>) => Task<A>;

export const getTaskInterpreter = (): Interpreter => {
    const cache: Map<string, string> = new Map();
    const dbFake: DB = {
        [john.id]: {
            [coolPost.id]: coolPost
        }
    };

    return (program) => {
        switch (program.tag) {
            case 'KVGet': return T.of(program.next(O.fromNullable(cache.get(program.key))));
            case 'KVPut': return T.of(program.next(cache.set(program.key, program.value) !== null));
            case 'KVDelete': return T.of(program.next(cache.delete(program.key)));

            case 'DBGetPosts': return T.delay(500)(T.of(program.next(Object.values(dbFake[program.userId]))))
            case 'DBCreatePost': {
                const id = getNextId(dbFake, program.post.author.id);
                const newPost: DBPost = { ...program.post, id };
                dbFake[program.post.author.id] = dbFake[program.post.author.id] || {};
                dbFake[program.post.author.id][id] = newPost;

                return T.delay(300)(T.of(program.next(newPost)));
            }
            case 'DBUpdatePost': return pipe(
                O.fromNullable((dbFake[program.update.author.id] || {})[program.postId]),
                O.fold(
                    () => T.of(program.next(O.none)),
                    (existingPost) => {
                        const updatedPost = {
                            ...existingPost,
                            ...program.update
                        };
                        dbFake[program.update.author.id] = dbFake[program.update.author.id] || {};
                        dbFake[program.update.author.id][program.postId] = updatedPost;
                        return T.delay(750)(T.of(program.next(O.some(updatedPost))));
                    }
                )
            );
            case 'NetSend': return T.delay(1000)(T.of(program.next()));
        }
    }
}

export const logger = <A>(program: ProgramF<A>): ProgramF<A> => {
    const {tag, ...rest} = program;
    console.log(`[${tag}] ${JSON.stringify(rest)}`)
    return program;

}
