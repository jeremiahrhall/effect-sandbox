import { Context, Data, Effect, Layer } from 'effect';
import { RepoContext } from './repo.js';
import { Todo, TodoList } from './types.js';
import { TodoListState } from './state.js';
import { logStartAndEnd } from './log.js';

export const addTodoToList = (todo: Todo, listId: string) =>
  Effect.gen(function* (_) {
    const repo = yield* _(RepoContext);
    yield* _(
      repo.getAndUpdate((state) => {
        return {
          lists: state.lists.map((l) => {
            if (l.id !== listId) {
              return l;
            }

            return {
              ...l,
              todos: [...l.todos, todo],
            };
          }),
        };
      }),
    );
    return todo;
  }).pipe(logStartAndEnd, Effect.withLogSpan('service:addTodoToList'));

export const toggleTodoCompleted = (todoId: string, listId: string) =>
  Effect.gen(function* (_) {
    const repo = yield* _(RepoContext);
    return yield* _(
      repo.getAndUpdate((state) => {
        return {
          lists: state.lists.map((l) => {
            if (l.id !== listId) {
              return l;
            }
            return {
              ...l,
              todos: l.todos.map((t) =>
                t.id === todoId
                  ? {
                      ...t,
                      completed: !t.completed,
                    }
                  : t,
              ),
            };
          }),
        };
      }),
    );
  }).pipe(logStartAndEnd, Effect.withLogSpan('service:toggleTodoCompleted'));

export const getAllLists = () =>
  Effect.gen(function* (_) {
    const repo = yield* _(RepoContext);
    const state = yield* _(repo.get());
    return state.lists;
  }).pipe(logStartAndEnd, Effect.withLogSpan('service:getAllLists'));

export const createNewList = (todoList: TodoList) =>
  Effect.gen(function* (_) {
    const repo = yield* _(RepoContext);
    yield* _(
      repo.getAndUpdate((state) => {
        return {
          lists: [...state.lists, todoList],
        };
      }),
    );
    return todoList;
  }).pipe(logStartAndEnd, Effect.withLogSpan('service:createNewList'));

export const removeList = (todoList: TodoList) =>
  Effect.gen(function* (_) {
    const repo = yield* _(RepoContext);
    return yield* _(
      repo.getAndUpdate((state) => {
        return {
          lists: state.lists.filter((l) => l.id !== todoList.id),
        };
      }),
    );
  }).pipe(logStartAndEnd, Effect.withLogSpan('service:removeList'));

export class Service extends Data.TaggedClass('Service')<{
  toggleTodoCompleted: (
    todoId: string,
    listId: string,
  ) => Effect.Effect<never, Error, TodoListState>;
  addTodoToList: (
    todo: Todo,
    listId: string,
  ) => Effect.Effect<never, Error, Todo>;
  getAllLists: () => Effect.Effect<never, Error, TodoListState['lists']>;
  createNewList: (
    todoList: TodoList,
  ) => Effect.Effect<never, Error, TodoList>;
  removeList: (
    todoList: TodoList,
  ) => Effect.Effect<never, Error, TodoListState>;
}> {}

export const ServiceContext = Context.Tag<Service>();

export const ServiceLayer = Layer.effect(
  ServiceContext,
  Effect.gen(function* (_) {
    const repo = yield* _(RepoContext);
    const provideRepo = Effect.provideService(RepoContext, repo);

    return new Service({
      addTodoToList: (todo, listId) =>
        addTodoToList(todo, listId).pipe(provideRepo),
      toggleTodoCompleted: (todo, listId) =>
        toggleTodoCompleted(todo, listId).pipe(provideRepo),
      getAllLists: () => getAllLists().pipe(provideRepo),
      createNewList: (todoList) => createNewList(todoList).pipe(provideRepo),
      removeList: (todoList) => removeList(todoList).pipe(provideRepo),
    });
  }),
);
