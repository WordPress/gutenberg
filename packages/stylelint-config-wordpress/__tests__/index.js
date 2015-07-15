import config from "../"
import postcss from "postcss"
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
  top: .2em;
}

`)

postcss()
  .use(stylelint(config))
  .process(css)
  .then(checkResult)
  .catch(e => console.log(e.stack))

function checkResult(result) {
  const { messages } = result
  test("expected warnings", t => {
    t.equal(messages.length, 1, "flags one warning")
    t.ok(messages.every(m => m.type === "warning"), "message of type warning")
    t.ok(messages.every(m => m.plugin === "stylelint"), "message of plugin stylelint")
    t.equal(messages[0].text, "Expected a leading zero (number-leading-zero)", "correct warning text")
    t.end()
  })
}
