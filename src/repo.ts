import { Context, Data, Effect, Layer, SynchronizedRef } from 'effect';
import { logStartAndEnd } from './log.js';
import { TodoListContext, TodoListState } from './state.js';

export const getAndUpdate = (cb: (state: TodoListState) => TodoListState) =>
  Effect.gen(function* (_) {
    const ref = yield* _(TodoListContext);
    return yield* _(SynchronizedRef.getAndUpdate(ref, cb));
  }).pipe(logStartAndEnd, Effect.withLogSpan('repo:getAndUpdate'));

export const get = () =>
  Effect.gen(function* (_) {
    const ref = yield* _(TodoListContext);
    return yield* _(SynchronizedRef.get(ref));
  }).pipe(logStartAndEnd, Effect.withLogSpan('repo:get'));

export class Repo extends Data.TaggedClass('Repo')<{
  getAndUpdate: (
    cb: (state: TodoListState) => TodoListState,
  ) => Effect.Effect<never, Error, TodoListState>;
  get: () => Effect.Effect<never, Error, TodoListState>;
}> {}

export const RepoContext = Context.Tag<Repo>();

export const RepoLayer = Layer.effect(
  RepoContext,
  Effect.gen(function* (_) {
    const ref = yield* _(TodoListContext);
    return yield* _(
      Effect.succeed(
        new Repo({
          getAndUpdate: (cb) =>
            getAndUpdate(cb).pipe(Effect.provideService(TodoListContext, ref)),
          get: () => get().pipe(Effect.provideService(TodoListContext, ref)),
        }),
      ),
    );
  }),
);
