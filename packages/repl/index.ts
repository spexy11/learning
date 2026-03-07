import dedent from 'dedent'
import { loadPyodide, version as pyodideVersion } from 'pyodide'

async function initPyodide() {
  const pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    packages: ['sympy'],
  })
  return pyodide
}

let pyodidePromise = initPyodide()

type Output = {
  result?: string
  error?: string
  stdout?: string
}
export async function runPython(code: string): Promise<Output> {
  const { runPython } = await pyodidePromise
  let output: Output = {}
  try {
    runPython(dedent`
      import sys
      from io import StringIO
      stdout_capture = StringIO()
      sys.stdout = stdout_capture
    `)
    output.result = runPython(code)
    output.stdout = runPython('sys.stdout.getvalue()')
  } catch (error) {
    output.error = (error as any).message
  } finally {
    return output
  }
}
