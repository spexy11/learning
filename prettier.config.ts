import { type Config } from 'prettier'

const config: Config = {
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
  printWidth: 100,
  semi: false,
  singleQuote: true,
}

export default config
