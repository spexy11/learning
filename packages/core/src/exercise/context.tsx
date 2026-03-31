import { createContext, useContext } from 'solid-js'

export const ExerciseContext = createContext()

export function useExerciseContext() {
  return useContext(ExerciseContext)
}
