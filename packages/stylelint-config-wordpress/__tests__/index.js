import config from "../"
import stylelint from "stylelint"
import test from "ava"

const validCss = (
`#selector-1,
#selector-2,
#selector-3 {
	background: #fff;
	color: #000;
}

#comment-form {

	margin: 1em 0;
}

input[type="text"] {
	line-height: 1.1;
}

.sample-output {
	box-shadow: inset 0 0 1px 1px #eee;
}

.class { /* Correct usage of quotes */
	background-image: url(images/bg.png);
	font-family: "Helvetica Neue", sans-serif;
}

.class { /* Correct usage of zero values */
	font-family: Georgia, serif;
	text-shadow:
		0 -1px 0 rgba(0, 0, 0, 0.5),
		0 1px 0 #fff;
}

@media all and (max-width: 699px) and (min-width: 520px) {

	/* Your selectors */
}

@media all and ( max-width: 699px ) and ( min-width: 520px ) {

	/* Your selectors */
}

/**
* #.# Section title
*
* Description of section, whether or not it has media queries, etc.
*/

.selector {
	float: left;
}

a {
	top: 0.2em;
}
`)

const invalidCss = (
`a {
	top: .2em;
}

`)

test("no warnings with valid css", t => {
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

test("a warning with invalid css", t => {
  return stylelint.lint({
    code: invalidCss,
    config: config,
  })
  .then(data => {
    const { errored, results } = data
    const { warnings } = results[0]
    t.truthy(errored, "errored")
    t.is(warnings.length, 1, "flags one warning")
    t.is(warnings[0].text, "Expected a leading zero (number-leading-zero)", "correct warning text")
  })
})
