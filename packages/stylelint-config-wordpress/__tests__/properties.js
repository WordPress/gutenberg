import config from "../"
import stylelint from "stylelint"
import test from "ava"

/* eslint-disable */
const validCss = (`
#selector-1 {
	background: #fff;
	display: block;
	margin: 0;
	margin-left: 20px;
}
`)

const invalidCss = (`
#selector-1 {
	background:#FFFFFF;
	display: BLOCK;
	margin-left: 20PX;
	margin: 0;
}
`)
/* eslint-enable */

test("There are no warnings with properties CSS", t => {
  return stylelint.lint({
    code: validCss,
    config: config,
  })
  .then(data => {
    const { errored, results } = data
    const { warnings } = results[0]
    t.falsy(errored, "no errored")
    t.is(warnings.length, 0, "flags no warnings")
  })
})

test("There are warnings with invalid properties CSS", t => {
  return stylelint.lint({
    code: invalidCss,
    config: config,
  })
  .then(data => {
    const { errored, results } = data
    const { warnings } = results[0]
    t.truthy(errored, "errored")
    t.is(warnings.length, 6, "flags six warnings")
    t.is(warnings[0].text, "Expected \"#FFFFFF\" to be \"#ffffff\" (color-hex-case)", "correct warning text")
    t.is(warnings[1].text, "Expected \"#FFFFFF\" to be \"#FFF\" (color-hex-length)", "correct warning text")
    t.is(warnings[2].text, "Unexpected shorthand \"margin\" after \"margin-left\" (declaration-block-no-shorthand-property-overrides)", "correct warning text")
    t.is(warnings[3].text, "Expected single space after \":\" with a single-line declaration (declaration-colon-space-after)", "correct warning text")
    t.is(warnings[4].text, "Expected \"PX\" to be \"px\" (unit-case)", "correct warning text")
    t.is(warnings[5].text, "Expected \"BLOCK\" to be \"block\" (value-keyword-case)", "correct warning text")
  })
})
