# HEAD

* Removed: `stylelint < 6.6.0` compatibility.

# 7.1.1

* Fixed: Re-releasing failed npmjs.com 7.0.0 release as 7.1.1.

# 7.1.0

* Fixed: Updated `font-family-name-quotes` rule deprecated option `double-where-recommended` to new `always-where-recommended` option.
* Fixed: Updated `function-url-quotes` rule deprecated option `none` to new `never` option.
* Removed: `stylelint < 6.5.1` compatibility.
* Changed: Improved tests and documentation.
* Added: `comment-empty-line-before` rule.

# 7.0.0

* Added: `keyframe-declaration-no-important` rule.
* Added: `selector-pseudo-class-no-unknown` rule.
* Added: `selector-pseudo-element-no-unknown` rule.
* Added: `selector-type-no-unknown` rule.

# 6.0.0

* Added: `at-rule-name-space-after` rule.
* Added: `no-extra-semicolons` rule.
* Added: `selector-attribute-operator-space-after` rule.
* Added: `selector-attribute-operator-space-before` rule.
* Added: `selector-max-empty-liness` rule.

# 5.0.0

* Added: `at-rule-name-case` rule.
* Added: `declaration-block-no-duplicate-properties` rule.
* Added: `function-max-empty-lines` rule.
* Added: `function-name-case` rule.
* Added: `property-case` rule.
* Added: `selector-attribute-brackets-space-inside` rule.
* Added: `selector-pseudo-class-case` rule.
* Added: `selector-pseudo-class-parentheses-space-inside` rule.
* Added: `selector-pseudo-element-case` rule.
* Added: `shorthand-property-no-redundant-values` rule.
* Added: `unit-case` rule.
* Added: `unit-no-unknown` rule.

# 4.0.0

* Removed: `stylelint < 5.2.0` compatibility.
* Added: `at-rule-semicolon-newline-after` rule.
* Added: `selector-type-case` rule.

# 3.0.1

* Add `stylelint` version `^4.5.0` as a peer dependency to `peerDependencies` in `package.json`

# 3.0.0

* Removed: `stylelint < 4.5.0` compatibility.
* Deprecated: `rule-no-shorthand-property-overrides` rule. Use the new `declaration-block-no-shorthand-property-overrides` rule instead.
* Deprecated: `rule-trailing-semicolon` rule. Use the new `declaration-block-trailing-semicolon` rule instead.
* Added: `color-named` rule.
* Added: `declaration-block-no-shorthand-property-overrides` rule.
* Added: `declaration-block-trailing-semicolon` rule.
* Added: `string-no-newline` rule.

# 2.1.0

* Added: `max-empty-lines` rule, limits the number of adjacent empty lines to 2.
* Changed: `rule-nested-empty-line-before` rule option `ignore: ["after-comment"]`.
* Removed all vendor prefixes, lets autoprefixer handle vendor prefixes:
  * Removed: `at-rule-no-vendor-prefix`
  * Removed: `media-feature-name-no-vendor-prefix`
  * Removed: `property-no-vendor-prefix`
  * Removed: `selector-no-vendor-prefix`
  * Removed: `value-no-vendor-prefix`

# 2.0.2

* Fixed another npmjs.com release issue

# 2.0.1

* Fixed npmjs.com release

# 2.0.0

* Removed: `media-query-parentheses-space-inside` rule.
* Removed: `stylelint < 4.3.4` compatibility.
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
