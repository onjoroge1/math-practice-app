import "@testing-library/jest-dom/vitest"

class MockStorage implements Storage {
  private store: Record<string, string> = {}

  get length() {
    return Object.keys(this.store).length
  }

  clear() {
    this.store = {}
  }

  getItem(key: string) {
    return this.store[key] ?? null
  }

  key(index: number) {
    return Object.keys(this.store)[index] ?? null
  }

  removeItem(key: string) {
    delete this.store[key]
  }

  setItem(key: string, value: string) {
    this.store[key] = value
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MockStorage(),
})
