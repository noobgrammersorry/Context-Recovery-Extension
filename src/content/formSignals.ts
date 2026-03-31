export interface FormSignalSnapshot {
  touched: boolean
  hasInput: boolean
  fieldCount: number
  changedFieldCount: number
}

const trackedFormData = new WeakMap<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, string>()

export function readFormSignals(): FormSignalSnapshot {
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input[type='text'], input[type='email'], input[type='password'], textarea, select"
  )

  let changedFieldCount = 0
  let touched = false

  inputs.forEach((input) => {
    const currentValue = input.value || ""
    const savedValue = trackedFormData.get(input)

    if (savedValue === undefined) {
      trackedFormData.set(input, currentValue)
    } else if (currentValue !== savedValue) {
      changedFieldCount += 1
      touched = true
    }
  })

  return {
    touched,
    hasInput: inputs.length > 0,
    fieldCount: inputs.length,
    changedFieldCount
  }
}

export function monitorFormChanges(callback: (snapshot: FormSignalSnapshot) => void): () => void {
  const handleChange = () => {
    const snapshot = readFormSignals()
    if (snapshot.touched) {
      callback(snapshot)
    }
  }

  document.addEventListener("input", handleChange)
  document.addEventListener("change", handleChange)

  return () => {
    document.removeEventListener("input", handleChange)
    document.removeEventListener("change", handleChange)
  }
}
