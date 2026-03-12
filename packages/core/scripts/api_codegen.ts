import { $ } from 'bun'
import { watch } from 'fs/promises'

const watcher = watch('../../apps/symapi')
for await (const event of watcher) {
  console.log(`Detected ${event.eventType} in ${event.filename}, regenerating types...`)
  await $`bunx openapi-typescript http://localhost:8088/openapi.json -o ./src/symapi.d.ts`
}
