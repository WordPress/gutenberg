import fs from "fs"
import config from "../"
import stylelint from "stylelint"
import test from "ava"

const validCss = fs.readFileSync("./media-queries-valid.css", "utf-8")
const invalidCss = fs.readFileSync("./media-queries-invalid.css", "utf-8")

test("There are no warnings with media queries CSS", async t => {
  const data = await stylelint.lint({
    code: validCss,
    config: config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.falsy(errored, "no errored")
  t.is(warnings.length, 0, "flags no warnings")
})

test("There are warnings with invalid media queries CSS", async t => {
  const data = await stylelint.lint({
    code: invalidCss,
    config: config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.truthy(errored, "errored")
  t.is(warnings.length, 10, "flags ten warnings")
  t.is(warnings[0].text, "Unexpected unknown at-rule \"@mdia\" (at-rule-no-unknown)", "correct warning text")
  t.is(warnings[1].text, "Expected single space after \":\" (media-feature-colon-space-after)", "correct warning text")
  t.is(warnings[2].text, "Expected single space after \":\" (media-feature-colon-space-after)", "correct warning text")
  t.is(warnings[3].text, "Unexpected whitespace before \":\" (media-feature-colon-space-before)", "correct warning text")
  t.is(warnings[4].text, "Unexpected missing punctuation (media-feature-no-missing-punctuation)", "correct warning text")
  t.is(warnings[5].text, "Expected single space after range operator (media-feature-range-operator-space-after)", "correct warning text")
  t.is(warnings[6].text, "Expected single space after range operator (media-feature-range-operator-space-after)", "correct warning text")
  t.is(warnings[7].text, "Expected single space before range operator (media-feature-range-operator-space-before)", "correct warning text")
  t.is(warnings[8].text, "Expected single space before range operator (media-feature-range-operator-space-before)", "correct warning text")
  t.is(warnings[9].text, "Unexpected whitespace before \",\" (media-query-list-comma-space-before)", "correct warning text")
})
