import config from "../"
import stylelint from "stylelint"
import test from "ava"

/* eslint-disable */
const validCss = (`
.class { /* Correct usage of quotes */
	background-image: url(images/bg.png);
	font-family: "Helvetica Neue", sans-serif;
	font-weight: 700;
}

.class { /* Correct usage of zero values */
	font-family: Georgia, serif;
	text-shadow:
		0 -1px 0 rgba(0, 0, 0, 0.5),
		0 1px 0 #fff;
}
`)

const invalidCss = (`
.class { /* Avoid missing space and semicolon */
	background:#fff
}

.class { /* Avoid adding a unit on a zero value */
	margin: 0px 0px 20px 0px;
}

.class {
	font-family: Times New Roman, serif; /* Quote font names when required */
	font-weight: bold; /* Avoid named font weights */
}
`)
/* eslint-enable */

test("There are no warnings with values CSS", t => {
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

test("There are warnings with invalid values CSS", t => {
  return stylelint.lint({
    code: invalidCss,
    config: config,
  })
  .then(data => {
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
    t.is(warnings[7].text, "Unexpected longhand value '0px 0px 20px 0px' instead of '0px 0px 20px' (shorthand-property-no-redundant-values)", "correct warning text")  })
})
