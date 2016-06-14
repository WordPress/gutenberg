import config from "../"
import stylelint from "stylelint"
import test from "ava"

/* eslint-disable */
const validCss = (`
@media all and (max-width: 699px) and (min-width: 520px) {

	/* Your selectors */
}

@media screen and (color),
	projection and (color) {}
`)

const invalidCss = (`
@media all and (max-width:699px) {

	/* Your selectors */
}

@media all and (max-width :699px) {

	/* Your selectors */
}

@media all and (max-width 699px) {

	/* Your selectors */
}

@media all and (max-width>=699px) {

	/* Your selectors */
}

@media all and (max-width >=699px) {

	/* Your selectors */
}

@media all and (max-width>= 699px) {

	/* Your selectors */
}

@media screen and (color), projection and (color) {}

@media screen and (color) ,
	projection and (color) {}
`)
/* eslint-enable */

test("There are no warnings with media queries CSS", t => {
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

test("There are warnings with invalid media queries CSS", t => {
  return stylelint.lint({
    code: invalidCss,
    config: config,
  })
  .then(data => {
    const { errored, results } = data
    const { warnings } = results[0]
    t.truthy(errored, "errored")
    t.is(warnings.length, 9, "flags eight warnings")
    t.is(warnings[0].text, "Expected single space after \":\" (media-feature-colon-space-after)", "correct warning text")
    t.is(warnings[1].text, "Expected single space after \":\" (media-feature-colon-space-after)", "correct warning text")
    t.is(warnings[2].text, "Unexpected whitespace before \":\" (media-feature-colon-space-before)", "correct warning text")
    t.is(warnings[3].text, "Unexpected missing punctuation (media-feature-no-missing-punctuation)", "correct warning text")
    t.is(warnings[4].text, "Expected single space after range operator (media-feature-range-operator-space-after)", "correct warning text")
    t.is(warnings[5].text, "Expected single space after range operator (media-feature-range-operator-space-after)", "correct warning text")
    t.is(warnings[6].text, "Expected single space before range operator (media-feature-range-operator-space-before)", "correct warning text")
    t.is(warnings[7].text, "Expected single space before range operator (media-feature-range-operator-space-before)", "correct warning text")
    t.is(warnings[8].text, "Unexpected whitespace before \",\" (media-query-list-comma-space-before)", "correct warning text")
  })
})
