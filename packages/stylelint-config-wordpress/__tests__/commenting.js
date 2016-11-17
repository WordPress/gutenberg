import fs from "fs"
import config from "../"
import stylelint from "stylelint"
import test from "ava"

const validCss = fs.readFileSync("./__tests__/commenting-valid.css", "utf-8")
const invalidCss = fs.readFileSync("./__tests__/commenting-invalid.css", "utf-8")

test("There are no warnings with commenting CSS", async t => {
  const data = await stylelint.lint({
    code: validCss,
    config: config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.falsy(errored, "no errored")
  t.is(warnings.length, 0, "flags no warnings")
})

test("There are warnings with invalid commenting CSS", async t => {
  const data = await stylelint.lint({
    code: invalidCss,
    config: config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.truthy(errored, "errored")
  t.is(warnings.length, 3, "flags three warnings")
  t.is(warnings[0].text, "Expected empty line before comment (comment-empty-line-before)", "correct warning text")
  t.is(warnings[1].text, "Expected empty line before comment (comment-empty-line-before)", "correct warning text")
  t.is(warnings[2].text, "Expected line length to be no more than 80 characters (max-line-length)", "correct warning text")
})
