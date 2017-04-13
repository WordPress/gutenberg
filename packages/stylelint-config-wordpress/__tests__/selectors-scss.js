import fs from "fs"
import config from "../scss.js"
import stylelint from "stylelint"
import test from "ava"

const validScss = fs.readFileSync("./__tests__/selectors-valid.scss", "utf-8")
const invalidScss = fs.readFileSync("./__tests__/selectors-invalid.scss", "utf-8")

test("There are no warnings with values SCSS", async t => {
  const data = await stylelint.lint({
    code: validScss,
    config,
    syntax: "scss",
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.falsy(errored, "no errored")
  t.is(warnings.length, 0, "flags no warnings")
})

test("There are warnings with invalid values SCSS", async t => {
  const data = await stylelint.lint({
    code: invalidScss,
    config,
    syntax: "scss",
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.truthy(errored, "errored")
  t.is(warnings.length, 4, "flags one warning")
  t.is(warnings[0].text, "Unnecessary nesting selector (&) (scss/selector-no-redundant-nesting-selector)", "correct warning text")
  t.is(warnings[1].text, "Unnecessary nesting selector (&) (scss/selector-no-redundant-nesting-selector)", "correct warning text")
  t.is(warnings[2].text, "Unnecessary nesting selector (&) (scss/selector-no-redundant-nesting-selector)", "correct warning text")
  t.is(warnings[3].text, "Unnecessary nesting selector (&) (scss/selector-no-redundant-nesting-selector)", "correct warning text")
})
