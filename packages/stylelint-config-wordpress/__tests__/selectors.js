import config from "../"
import stylelint from "stylelint"
import test from "ava"

/* eslint-disable */
const validCss = (`
#comment-form {
	margin: 1em 0;
}

input[type="text"] {
	line-height: 1.1;
}
`)

const invalidCss = (`
#commentForm { /* Avoid camelcase. */
	margin: 0;
}

#comment_form { /* Avoid underscores. */
	margin: 0;
}

div#comment_form { /* Avoid over-qualification. */
	margin: 0;
}

#c1-xr { /* What is a c1-xr?! Use a better name. */
	margin: 0;
}

input[type='text'] { /* Should be [type="text"] */
	line-height: 110% /* Also doubly incorrect */
}

#Selector {
	color: #000;
}

.selectorA {
	color: #000;
}
`)
/* eslint-enable */

test("There are no warnings with selectors CSS", t => {
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

test("There are warnings with invalid selectors CSS", t => {
  return stylelint.lint({
    code: invalidCss,
    config: config,
  })
  .then(data => {
    const { errored, results } = data
    const { warnings } = results[0]
    t.truthy(errored, "errored")
    t.is(warnings.length, 2, "flags eight warnings")
    t.is(warnings[0].text, "Selector should use lowercase and separate words with hyphens (selector-id-pattern)", "correct warning text")
    t.is(warnings[1].text, "Expected double quotes (string-quotes)", "correct warning text")
  })
})
