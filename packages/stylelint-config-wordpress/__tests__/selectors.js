"use strict"

const fs = require("fs")
const config = require("../")
const stylelint = require("stylelint")

const validCss = fs.readFileSync("./__tests__/selectors-valid.css", "utf-8")
const invalidCss = fs.readFileSync("./__tests__/selectors-invalid.css", "utf-8")

describe("flags no warnings with valid selectors css", () => {
  let result

  beforeEach(() => {
    result = stylelint.lint({
      code: validCss,
      config,
    })
  })

  it("did not error", () => {
    return result.then(data => (
      expect(data.errored).toBeFalsy()
    ))
  })

  it("flags no warnings", () => {
    return result.then(data => (
      expect(data.results[0].warnings.length).toBe(0)
    ))
  })
})

describe("flags warnings with invalid selectors css", () => {
  let result

  beforeEach(() => {
    result = stylelint.lint({
      code: invalidCss,
      config,
    })
  })

  it("did error", () => {
    return result.then(data => (
      expect(data.errored).toBeTruthy()
    ))
  })

  it("flags two warnings", () => {
    return result.then(data => (
      expect(data.results[0].warnings.length).toBe(2)
    ))
  })

  it("correct first warning text", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].text).toBe("Selector should use lowercase and separate words with hyphens (selector-id-pattern)")
    ))
  })

  it("correct first warning rule flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].rule).toBe("selector-id-pattern")
    ))
  })

  it("correct first warning severity flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].severity).toBe("error")
    ))
  })

  it("correct first warning line number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].line).toBe(21)
    ))
  })

  it("correct first warning column number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].column).toBe(1)
    ))
  })

  it("correct second warning text", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].text).toBe("Expected double quotes (string-quotes)")
    ))
  })

  it("correct second warning rule flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].rule).toBe("string-quotes")
    ))
  })

  it("correct second warning severity flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].severity).toBe("error")
    ))
  })

  it("correct second warning line number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].line).toBe(17)
    ))
  })

  it("correct second warning column number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].column).toBe(12)
    ))
  })
})
