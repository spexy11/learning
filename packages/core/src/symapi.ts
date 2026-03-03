import type { paths } from './symapi.d'

const BASE_URL = 'http://localhost:8088'

type Folders<Prefix extends string> = keyof paths extends `${Prefix}/${infer First}/${string}`
  ? First
  : keyof paths extends `${Prefix}/${infer First}`
    ? First
    : never

type Fetch<Path extends keyof paths> = paths[Path] extends { post: infer Post }
  ? Post extends {
      requestBody?: { content: { 'application/json': infer Req } }
      responses: infer Res
    }
    ? (
        params: Req extends undefined ? void : Req,
      ) => Promise<Res extends { 200?: { content: { 'application/json': infer R } } } ? R : unknown>
    : never
  : never

type ApiTree<P extends string> = {
  [K in Folders<P>]: Folders<`${P}/${K}`> extends never
    ? `${P}/${K}` extends keyof paths
      ? Fetch<`${P}/${K}`>
      : never
    : ApiTree<`${P}/${K}`>
}

function makeProxy<const P extends string>(prefix: P) {
  return new Proxy((() => {}) as any, {
    get(_, attr: Folders<P>) {
      return makeProxy(`${prefix}/${attr}`)
    },
    async apply(_, __, params: any) {
      const res = await fetch(`${BASE_URL}${prefix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params[0]),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return await res.json()
    },
  }) as ApiTree<P>
}

export default makeProxy('')
