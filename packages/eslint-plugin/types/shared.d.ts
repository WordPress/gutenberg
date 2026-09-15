/**
 * Names shared between the flat config entry point and the deprecated
 * `eslintrc` one. Hand-maintained: keep them in sync with the runtime
 * exports when a rule or a config is added, removed or renamed.
 */

import type { Rule } from 'eslint';

/** Names of the flat configs exported as `configs`. */
export type ConfigName =
	| 'custom'
	| 'es5'
	| 'esnext'
	| 'i18n'
	| 'jsdoc'
	| 'jshint'
	| 'jsx-a11y'
	| 'react'
	| 'recommended'
	| 'recommended-with-formatting'
	| 'test-e2e'
	| 'test-playwright'
	| 'test-unit';

/** Names of the rules exported as `rules`, minus the `@wordpress/` prefix. */
export type RuleName =
	| 'components-no-missing-40px-size-prop'
	| 'components-no-unsafe-button-disabled'
	| 'data-no-store-string-literals'
	| 'dependency-group'
	| 'i18n-ellipsis'
	| 'i18n-hyphenated-range'
	| 'i18n-no-collapsible-whitespace'
	| 'i18n-no-flanking-whitespace'
	| 'i18n-no-placeholders-only'
	| 'i18n-no-variables'
	| 'i18n-text-domain'
	| 'i18n-translator-comments'
	| 'no-base-control-with-label-without-id'
	| 'no-dom-globals-in-constructor'
	| 'no-dom-globals-in-module-scope'
	| 'no-dom-globals-in-react-cc-render'
	| 'no-dom-globals-in-react-fc'
	| 'no-ds-tokens'
	| 'no-global-active-element'
	| 'no-global-get-selection'
	| 'no-i18n-in-save'
	| 'no-non-module-stylesheet-imports'
	| 'no-setting-ds-tokens'
	| 'no-unguarded-get-range-at'
	| 'no-unknown-ds-tokens'
	| 'no-unmerged-classname'
	| 'no-unsafe-render-order'
	| 'no-unsafe-wp-apis'
	| 'no-unused-vars-before-return'
	| 'no-wp-process-env'
	| 'react-no-unsafe-timeout'
	| 'use-import-as'
	| 'use-recommended-components'
	| 'valid-sprintf'
	| 'wp-global-usage';

/** The plugin's own metadata. */
export interface PluginMeta {
	name: string;
	version: string;
}

/** The rule modules exported as `rules`. */
export type Rules = Record< RuleName, Rule.RuleModule >;
