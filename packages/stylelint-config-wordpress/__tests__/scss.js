"use strict"

const fs = require("fs")
const config = require("../scss.js")
const stylelint = require("stylelint")

const validScss = fs.readFileSync("./__tests__/scss-valid.scss", "utf-8")
const invalidScss = fs.readFileSync("./__tests__/scss-invalid.scss", "utf-8")

describe("flags no warnings with valid scss", () => {
  let result

  beforeEach(() => {
    result = stylelint.lint({
      code: validScss,
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

describe("flags warnings with invalid scss", () => {
  let result

  beforeEach(() => {
    result = stylelint.lint({
      code: invalidScss,
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
      expect(data.results[0].warnings[0].text).toBe("Unexpected unknown at-rule \"@unknown\" (at-rule-no-unknown)")
    ))
  })

  it("correct first warning rule flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].rule).toBe("at-rule-no-unknown")
    ))
  })

  it("correct first warning severity flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].severity).toBe("error")
    ))
  })

  it("correct first warning line number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].line).toBe(1)
    ))
  })

  it("correct first warning column number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[0].column).toBe(1)
    ))
  })

  it("correct second warning text", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].text).toBe("Unexpected unknown at-rule \"@debug\" (at-rule-no-unknown)")
    ))
  })

  it("correct second warning rule flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].rule).toBe("at-rule-no-unknown")
    ))
  })

  it("correct second warning severity flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].severity).toBe("error")
    ))
  })

  it("correct second warning line number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].line).toBe(7)
    ))
  })

  it("correct second warning column number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[1].column).toBe(2)
    ))
  })
})
