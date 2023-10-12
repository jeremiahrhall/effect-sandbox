import { Effect } from 'effect';

export const logStartAndEnd = <E extends Effect.Effect<unknown, unknown, unknown>>(e: E): E => Effect.gen(function* (_) {
  yield* _(Effect.log('start'));
  const result = yield* _(e);
  yield* _(Effect.log('end'));
  return result;
}) as E;
