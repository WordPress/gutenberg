import config from "../"
import stylelint from "stylelint"
import test from "ava"

/* eslint-disable */
const validCss = (`
#selector-1,
#selector-2,
#selector-3 {
	background: #fff;
	color: #000;
}

#selector-4 {
	background: #fff;
	color: #000;
}
`)

const invalidCss = (`
#selector-1, #selector-2, #selector-3 {
    background: #fff;
    color: #000;
    }


#selector-1 { background: #fff; color: #000; }
`)
/* eslint-enable */

test("There are no warnings with structure CSS", t => {
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

test("There are warnings with invalid structure CSS", t => {
  return stylelint.lint({
    code: invalidCss,
    config: config,
  })
  .then(data => {
    const { errored, results } = data
    const { warnings } = results[0]
    t.truthy(errored, "errored")
    t.is(warnings.length, 8, "flags eight warnings")
    t.is(warnings[0].text, "Expected newline before \"}\" (block-closing-brace-newline-before)", "correct warning text")
    t.is(warnings[1].text, "Expected newline after \"{\" (block-opening-brace-newline-after)", "correct warning text")
    t.is(warnings[2].text, "Expected newline after \";\" (declaration-block-semicolon-newline-after)", "correct warning text")
    t.is(warnings[3].text, "Expected indentation of 0 tabs (indentation)", "correct warning text")
    t.is(warnings[4].text, "Expected indentation of 1 tab (indentation)", "correct warning text")
    t.is(warnings[5].text, "Expected indentation of 1 tab (indentation)", "correct warning text")
    t.is(warnings[6].text, "Expected newline after \",\" (selector-list-comma-newline-after)", "correct warning text")
    t.is(warnings[7].text, "Expected newline after \",\" (selector-list-comma-newline-after)", "correct warning text")
  })
})
