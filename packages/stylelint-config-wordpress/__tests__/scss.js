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

  it("flags six warnings", () => {
    return result.then(data => (
      expect(data.results[0].warnings.length).toBe(6)
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

  it("correct third warning text", () => {
    return result.then(data => (
      expect(data.results[0].warnings[2].text).toBe("Expected single space before \"{\" (block-opening-brace-space-before)")
    ))
  })

  it("correct third warning rule flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[2].rule).toBe("block-opening-brace-space-before")
    ))
  })

  it("correct third warning severity flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[2].severity).toBe("error")
    ))
  })

  it("correct third warning line number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[2].line).toBe(14)
    ))
  })

  it("correct third warning column number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[2].column).toBe(5)
    ))
  })

  it("correct forth warning text", () => {
    return result.then(data => (
      expect(data.results[0].warnings[3].text).toBe("Unxpected empty line before @else (scss/at-else-empty-line-before)")
    ))
  })

  it("correct forth warning rule flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[3].rule).toBe("scss/at-else-empty-line-before")
    ))
  })

  it("correct forth warning severity flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[3].severity).toBe("error")
    ))
  })

  it("correct forth warning line number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[3].line).toBe(14)
    ))
  })

  it("correct forth warning column number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[3].column).toBe(1)
    ))
  })

  it("correct fifth warning text", () => {
    return result.then(data => (
      expect(data.results[0].warnings[4].text).toBe("Unexpected newline after \"}\" of @if statement (scss/at-if-closing-brace-newline-after)")
    ))
  })

  it("correct fifth warning rule flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[4].rule).toBe("scss/at-if-closing-brace-newline-after")
    ))
  })

  it("correct fifth warning severity flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[4].severity).toBe("error")
    ))
  })

  it("correct fifth warning line number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[4].line).toBe(12)
    ))
  })

  it("correct fifth warning column number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[4].column).toBe(2)
    ))
  })

  it("correct sixth warning text", () => {
    return result.then(data => (
      expect(data.results[0].warnings[5].text).toBe("Expected single space after \"}\" of @if statement (scss/at-if-closing-brace-space-after)")
    ))
  })

  it("correct sixth warning rule flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[5].rule).toBe("scss/at-if-closing-brace-space-after")
    ))
  })

  it("correct sixth warning severity flagged", () => {
    return result.then(data => (
      expect(data.results[0].warnings[5].severity).toBe("error")
    ))
  })

  it("correct sixth warning line number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[5].line).toBe(12)
    ))
  })

  it("correct sixth warning column number", () => {
    return result.then(data => (
      expect(data.results[0].warnings[5].column).toBe(2)
    ))
  })
})
