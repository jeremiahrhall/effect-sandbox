import { Schema as S } from '@effect/schema';

export const TodoSchema = S.struct({
  id: S.UUID,
  text: S.string.pipe(S.length(240)),
  completed: S.boolean,
});

export interface Todo extends S.Schema.To<typeof TodoSchema> {}

export const TodoListSchema = S.struct({
  id: S.UUID,
  name: S.string.pipe(S.length(60)),
  todos: S.array(TodoSchema),
});

export interface TodoList extends S.Schema.To<typeof TodoListSchema> {}
