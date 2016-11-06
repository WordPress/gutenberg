import fs from "fs"
import config from "../"
import stylelint from "stylelint"
import test from "ava"

const validCss = fs.readFileSync("./properties-valid.css", "utf-8")
const invalidCss = fs.readFileSync("./properties-invalid.css", "utf-8")

test("There are no warnings with properties CSS", async t => {
  const data = await stylelint.lint({
    code: validCss,
    config: config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.falsy(errored, "no errored")
  t.is(warnings.length, 0, "flags no warnings")
})

test("There are warnings with invalid properties CSS", async t => {
  const data = await stylelint.lint({
    code: invalidCss,
    config: config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.truthy(errored, "errored")
  t.is(warnings.length, 7, "flags seven warnings")
  t.is(warnings[0].text, "Expected \"#FFFFFF\" to be \"#ffffff\" (color-hex-case)", "correct warning text")
  t.is(warnings[1].text, "Expected \"#FFFFFF\" to be \"#FFF\" (color-hex-length)", "correct warning text")
  t.is(warnings[2].text, "Unexpected shorthand \"margin\" after \"margin-left\" (declaration-block-no-shorthand-property-overrides)", "correct warning text")
  t.is(warnings[3].text, "Expected single space after \":\" with a single-line declaration (declaration-colon-space-after)", "correct warning text")
  t.is(warnings[4].text, "Unexpected unknown property \"argin\" (property-no-unknown)", "correct warning text")
  t.is(warnings[5].text, "Expected \"PX\" to be \"px\" (unit-case)", "correct warning text")
  t.is(warnings[6].text, "Expected \"BLOCK\" to be \"block\" (value-keyword-case)", "correct warning text")
})
