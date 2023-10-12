import {
  Context, Effect, Exit, Layer,
  SubscriptionRef,
  SynchronizedRef
} from 'effect';
import { TodoList } from './types.js';
import { readTodoListStateFromStorage, writeTodoListStateToStorage } from './storage.js';

export const TodoListContext = Context.Tag<SubscriptionRef.SubscriptionRef<TodoListState>>();

export type TodoListState = {
  lists: TodoList[];
};

export const acquireTodoListState = () => SubscriptionRef.make<TodoListState>({
  lists: [],
});

export const TodoListFromStorage = Effect.acquireRelease(
  Effect.gen(function* (_) {
    const ref = yield* _(acquireTodoListState());
    const stored = yield* _(readTodoListStateFromStorage());
    yield* _(SynchronizedRef.set(ref, stored));
    return ref;
  }),
  (ref, exit) => {
    if (Exit.isFailure(exit)) {
      return Effect.succeed(undefined);
    }
    return Effect.gen(function* (_) {
      const state = yield* _(SynchronizedRef.get(ref));
      return yield* _(writeTodoListStateToStorage(state));
    })
  }
);

export const TodoListStateLayer = Layer.effect(
  TodoListContext,
  TodoListFromStorage
);
