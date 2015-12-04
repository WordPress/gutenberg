import config from "../"
import stylelint from "stylelint"
import test from "tape"

test("basic properties of config", t => {
  t.ok(isObject(config.rules), "rules is object")
  t.end()
})

function isObject(obj) {
  return typeof obj === "object" && obj !== null
}

const css = (
`a {
\ttop: .2em;
}

`)

stylelint.lint({
  code: css,
  config: config,
})
.then(checkResult)
.catch(function (err) {
  console.error(err.stack)
})

function checkResult(data) {
  const { errored, results } = data
  const { warnings } = results[0]
  test("expected warnings", t => {
    t.ok(errored, "errored")
    t.equal(warnings.length, 1, "flags one warning")
    t.equal(warnings[0].text, "Expected a leading zero (number-leading-zero)", "correct warning text")
    t.end()
  })
}
