import config from "../scss.js"
import stylelint from "stylelint"
import test from "ava"

/* eslint-disable */
const validScss = (`
@import "path/to/foo.scss";

@function fooBar {

	@return 1;
}

@mixin foo {

	@content;
}

a {

	@debug 1;
}

$map: (
	"foo": 1,
	"bar": 2,
	"baz": 3
);

@if $foo == block {
	display: block;
}

@else {
	display: inline-block;
}
`)

const invalidScss = (`
@unknown {
	display: block;
}
`)
/* eslint-enable */

test("There are no warnings with values SCSS", t => {
  return stylelint.lint({
    code: validScss,
    config: config,
    syntax: "scss",
  })
  .then(data => {
    const { errored, results } = data
    const { warnings } = results[0]
    t.falsy(errored, "no errored")
    t.is(warnings.length, 0, "flags no warnings")
  })
})

test("There are warnings with invalid values SCSS", t => {
  return stylelint.lint({
    code: invalidScss,
    config: config,
    syntax: "scss",
  })
  .then(data => {
    const { errored, results } = data
    const { warnings } = results[0]
    t.truthy(errored, "errored")
    t.is(warnings.length, 1, "flags one warning")
    t.is(warnings[0].text, "Unexpected unknown at-rule \"@unknown\" (at-rule-no-unknown)", "correct warning text") })
})
