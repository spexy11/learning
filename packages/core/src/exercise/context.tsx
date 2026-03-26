import { createContext, createStore, useContext } from 'solid-js'

type ContextType = {
  state: Record<string, any>
  setState: ReturnType<typeof createStore<Record<string, any>>>[1]
}

export const ExerciseContext = createContext<ContextType>()

export function useExerciseContext() {
  return useContext(ExerciseContext)
}
