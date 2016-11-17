import fs from "fs"
import config from "../"
import stylelint from "stylelint"
import test from "ava"

const validCss = fs.readFileSync("./__tests__/css-valid.css", "utf-8")
const invalidCss = fs.readFileSync("./__tests__/css-invalid.css", "utf-8")

test("no warnings with valid css", async t => {
  const data = await stylelint.lint({
    code: validCss,
    config: config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.falsy(errored, "no errored")
  t.is(warnings.length, 0, "flags no warnings")
})

test("a warning with invalid css", async t => {
  const data = await stylelint.lint({
    code: invalidCss,
    config: config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.truthy(errored, "errored")
  t.is(warnings.length, 1, "flags one warning")
  t.is(warnings[0].text, "Expected a leading zero (number-leading-zero)", "correct warning text")
})
