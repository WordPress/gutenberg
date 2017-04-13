import fs from "fs"
import config from "../"
import stylelint from "stylelint"
import test from "ava"

const validCss = fs.readFileSync("./__tests__/values-valid.css", "utf-8")
const invalidCss = fs.readFileSync("./__tests__/values-invalid.css", "utf-8")

test("There are no warnings with values CSS", async t => {
  const data = await stylelint.lint({
    code: validCss,
    config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.falsy(errored, "no errored")
  t.is(warnings.length, 0, "flags no warnings")
})

test("There are warnings with invalid values CSS", async t => {
  const data = await stylelint.lint({
    code: invalidCss,
    config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.truthy(errored, "errored")
  t.is(warnings.length, 8, "flags eight warnings")
  t.is(warnings[0].text, "Expected a trailing semicolon (declaration-block-trailing-semicolon)", "correct warning text")
  t.is(warnings[1].text, "Expected single space after \":\" with a single-line declaration (declaration-colon-space-after)", "correct warning text")
  t.is(warnings[2].text, "Expected quotes around \"Times New Roman\" (font-family-name-quotes)", "correct warning text")
  t.is(warnings[3].text, "Expected numeric font-weight notation (font-weight-notation)", "correct warning text")
  t.is(warnings[4].text, "Unexpected unit (length-zero-no-unit)", "correct warning text")
  t.is(warnings[5].text, "Unexpected unit (length-zero-no-unit)", "correct warning text")
  t.is(warnings[6].text, "Unexpected unit (length-zero-no-unit)", "correct warning text")
  t.is(warnings[7].text, "Unexpected longhand value '0px 0px 20px 0px' instead of '0px 0px 20px' (shorthand-property-no-redundant-values)", "correct warning text")
})
