import fs from "fs"
import config from "../"
import stylelint from "stylelint"
import test from "ava"

const validCss = fs.readFileSync("./__tests__/selectors-valid.css", "utf-8")
const invalidCss = fs.readFileSync("./__tests__/selectors-invalid.css", "utf-8")

test("There are no warnings with selectors CSS", async t => {
  const data = await stylelint.lint({
    code: validCss,
    config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.falsy(errored, "no errored")
  t.is(warnings.length, 0, "flags no warnings")
})

test("There are warnings with invalid selectors CSS", async t => {
  const data = await stylelint.lint({
    code: invalidCss,
    config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.truthy(errored, "errored")
  t.is(warnings.length, 2, "flags eight warnings")
  t.is(warnings[0].text, "Selector should use lowercase and separate words with hyphens (selector-id-pattern)", "correct warning text")
  t.is(warnings[1].text, "Expected double quotes (string-quotes)", "correct warning text")
})
