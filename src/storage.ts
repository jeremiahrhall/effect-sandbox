import { Effect } from 'effect';
import * as fs from 'fs/promises';
import { logStartAndEnd } from './log.js';
import { TodoListState } from './state.js';

// TODO make the storage a layer

export const writeTodoListStateToStorage = (state: TodoListState) => Effect.gen(function* (_) {
  return yield* _(
    Effect.promise(async (): Promise<void> => {
      return fs.writeFile('./state.json', JSON.stringify(state, null, 4));
    })
  );
}).pipe(logStartAndEnd, Effect.withLogSpan('storage:writeTodoListStateToStorage'));

export const readTodoListStateFromStorage = () => Effect.gen(function* (_) {
  return yield* _(
    Effect.promise(async () => {
      return JSON.parse(
        await fs.readFile('state.json', { encoding: 'utf8' })
      ) as TodoListState;
    })
  );
}).pipe(logStartAndEnd, Effect.withLogSpan('storage:readTodoListStateFromStorage'));
