#HEAD

* Removed `media-query-parentheses-space-inside` rule.
* Removed: `stylelint < 4.3.0` compatibility.
* Added: `font-family-name-quotes` rule with double quotes where recommended option.
* Added: `media-feature-no-missing-punctuation` rule.
* Added: `no-invalid-double-slash-comments` rule.

# 1.1.1

* Changed: `rule-non-nested-empty-line-before` with option `ignore: ["after-comment"],`.

# 1.1.0

* Added: `selector-pseudo-element-colon-notation` with option `single`

# 1.0.1

* Changed: config syntax.

# 1.0.0

* Removed: `stylelint < 3.0.0` compatibility.
  * Changed: renamed the `function-space-after` rule to `function-whitespace-after`.
* Changed: `at-rule-empty-line-before` with option `ignore: ["after-comment"],`.
* Changed: `declaration-colon-space-after` with option `always-single-line`.
* Added: `declaration-colon-newline-after` with option `always-multi-line`.
* Added: `function-linear-gradient-no-nonstandard-direction`.

# 0.2.0

* Fixed: No quotes for URLs -> `"function-url-quotes": [ 2, "none" ]`.

# 0.1.0

* Initial release.
