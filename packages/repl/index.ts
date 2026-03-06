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

export async function runPython(code: string, out: 'stdout' = 'stdout'): Promise<string> {
  const { runPython } = await pyodidePromise
  return new Promise((r) => {
    runPython(dedent`
      import sys
      from io import StringIO
      stdout_capture = StringIO()
      sys.stdout = stdout_capture
    `)
    const output = runPython(code)
    const stdout = runPython('sys.stdout.getvalue()')
    if (out === 'stdout') r(stdout)
    else r(output)
  })
}
