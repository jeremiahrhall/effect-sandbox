import { randomUUID } from 'crypto';
import { Effect, Exit, Layer, Runtime, Scope } from 'effect';
import { RepoLayer } from './repo.js';
import { ServiceContext, ServiceLayer } from './service.js';
import { TodoListStateLayer } from './state.js';
import { readTodoListStateFromStorage } from './storage.js';
import { TodoList } from './types.js';

export const AppRuntime = async (scope: Scope.Scope) => {
  const layer = ServiceLayer.pipe(Layer.use(RepoLayer.pipe(Layer.use(TodoListStateLayer))));
  const runtime = await Layer.toRuntime(
    layer
  ).pipe(Effect.provideService(Scope.Scope, scope), Effect.runPromise);
  return Runtime.runPromise(runtime);
};

const retrieveState = Effect.gen(function* (_) {
  const service = yield* _(ServiceContext);
  const result = yield* _(service.getAllLists());

  yield* _(Effect.log(JSON.stringify(result, null, 4)));
}).pipe(Effect.withLogSpan('main:retrieve'));

const createNewList = Effect.gen(function* (_) {
  const service = yield* _(ServiceContext);
  return yield* _(
    service.createNewList({
      id: randomUUID(),
      name: 'My Second List',
      todos: [],
    }),
  );
}).pipe(Effect.withLogSpan('store:create'));

const logStateAfterCreate = Effect.gen(function* (_) {
  const service = yield* _(ServiceContext);
  const result = yield* _(service.getAllLists());

  yield* _(Effect.log(JSON.stringify(result, null, 4)));
}).pipe(Effect.withLogSpan('store:create:after'));

const cleanupAndLog = (newList: TodoList) => {
  return Effect.gen(function* (_) {
    const service = yield* _(ServiceContext);
    yield* _(service.removeList(newList));
    const result = yield* _(service.getAllLists());

    yield* _(Effect.log(JSON.stringify(result, null, 4)));
  }).pipe(Effect.withLogSpan('store:delete'));
};

export const main = async () => {
  const txScope = Effect.runSync(Scope.make());
  const run = await AppRuntime(txScope);
  // TODO challenges:
  // - explain the code
  // - write a new effect that clears completed todos from a list by id (service.ts)
  // - fix test that has failure (main.test.ts)
  // - provide the storage functions via context (storage.ts)

  await run(
    readTodoListStateFromStorage().pipe(Effect.withLogSpan('store:init')),
  );

  await run(retrieveState);

  const newList = await run(createNewList);

  await run(Effect.log(JSON.stringify(newList, null, 4)));

  await run(logStateAfterCreate);

  await run(cleanupAndLog(newList));

  await run(Scope.close(txScope, Exit.succeed(1)));
};

try {
  void main();
} catch (e) {
  console.log(e);
}
