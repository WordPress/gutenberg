import fs from "fs"
import config from "../scss.js"
import stylelint from "stylelint"
import test from "ava"

const validScss = fs.readFileSync("./scss-valid.scss", "utf-8")
const invalidScss = fs.readFileSync("./scss-invalid.scss", "utf-8")

test("There are no warnings with values SCSS", async t => {
  const data = await stylelint.lint({
    code: validScss,
    config: config,
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
    config: config,
    syntax: "scss",
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.truthy(errored, "errored")
  t.is(warnings.length, 1, "flags one warning")
  t.is(warnings[0].text, "Unexpected unknown at-rule \"@unknown\" (at-rule-no-unknown)", "correct warning text")
})
