import fs from "fs"
import config from "../"
import stylelint from "stylelint"
import test from "ava"

const validCss = fs.readFileSync("./__tests__/vendor-prefixes-valid.css", "utf-8")

test("There are no warnings with vendor prefixes CSS", async t => {
  const data = await stylelint.lint({
    code: validCss,
    config,
  })

  const { errored, results } = data
  const { warnings } = results[0]
  t.falsy(errored, "no errored")
  t.is(warnings.length, 0, "flags no warnings")
})
