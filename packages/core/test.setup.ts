import { mock } from 'bun:test'

mock.module('@solidjs/router', () => ({
  createAsyncStore: (fn: any) => fn,
  query: (fn: any) => fn,
}))
