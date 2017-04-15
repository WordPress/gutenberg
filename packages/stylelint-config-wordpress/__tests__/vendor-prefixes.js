"use strict"

const fs = require("fs")
const config = require("../")
const stylelint = require("stylelint")

const validCss = fs.readFileSync("./__tests__/vendor-prefixes-valid.css", "utf-8")

describe("flags no warnings with valid vendor prefixes css", () => {
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
