import { Effect, Layer, Runtime, Scope } from 'effect';
import { Repo, RepoContext, RepoLayer, get, getAndUpdate } from '../src/repo.js';
import { TodoListContext, acquireTodoListState } from '../src/state.js';
import { ServiceContext, ServiceLayer } from '../src/service.js';

describe('todo list system', () => {
  describe('repo', () => {
    it('gets state from provided todo list context', async () => {
      const plainTodoListState = acquireTodoListState();
      const AppRuntime = async (scope: Scope.Scope) => {
        const runtime = await Layer.toRuntime(
          RepoLayer.pipe(
            Layer.use(Layer.effect(TodoListContext, plainTodoListState)),
          ),
        ).pipe(Effect.provideService(Scope.Scope, scope), Effect.runPromise);
        return Runtime.runPromise(runtime);
      };
      const txScope = Effect.runSync(Scope.make());
      const runtime = await AppRuntime(txScope);
      expect(runtime).toBeTruthy();

      const result = await runtime(
        Effect.gen(function* (_) {
          const repo = yield* _(RepoContext);
          return yield* _(repo.get());
        }),
      );
      expect(result).toBeTruthy();
      expect(result.lists.length).toBe(0);
    });
  });
  describe('service', () => {
    it('handles repo failure', async () => {
      const plainTodoListState = acquireTodoListState();
      let hasRun = false;
      const AppRuntime = async (scope: Scope.Scope) => {
        const runtime = await Layer.toRuntime(
          ServiceLayer.pipe(
            Layer.use(
              Layer.effect(
                RepoContext,
                Effect.gen(function* (_) {
                  const ref = yield* _(TodoListContext);
                  return yield* _(
                    Effect.succeed(
                      new Repo({
                        getAndUpdate: (cb) =>
                          getAndUpdate(cb).pipe(Effect.provideService(TodoListContext, ref), Effect.tap(() => {
                            if (!hasRun) {
                              hasRun = true;
                              return Effect.fail(new Error());
                            }
                            return Effect.succeed(undefined);
                          })),
                        get: () => get().pipe(Effect.provideService(TodoListContext, ref), Effect.tap(() => {
                          if (!hasRun) {
                            hasRun = true;
                            return Effect.fail(new Error());
                          }
                          return Effect.succeed(undefined);
                        })),
                      }),
                    ),
                  );
                })
              ).pipe(
                Layer.use(Layer.effect(TodoListContext, plainTodoListState)),
              ),
            ),
          ),
        ).pipe(Effect.provideService(Scope.Scope, scope), Effect.runPromise);
        return Runtime.runPromise(runtime);
      };
      const txScope = Effect.runSync(Scope.make());
      const runtime = await AppRuntime(txScope);
      expect(runtime).toBeTruthy();

      // TODO make it handle the failure, possibly with retry
      const result = await runtime(
        Effect.gen(function* (_) {
          const service = yield* _(ServiceContext);
          return yield* _(service.getAllLists());
        }),
      );
      expect(result).toBeTruthy();
      expect(result.length).toBe(0);
    });
  });
});
