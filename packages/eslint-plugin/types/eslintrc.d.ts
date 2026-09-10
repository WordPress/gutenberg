/**
 * Type declarations for the deprecated `@wordpress/eslint-plugin/eslintrc`
 * entry point.
 *
 * @deprecated Use the flat config export instead.
 */

import type { Linter } from 'eslint';
import type {
	ConfigName as SharedConfigName,
	PluginMeta,
	RuleName as SharedRuleName,
	Rules,
} from './shared';

declare namespace WordPressESLintPluginLegacy {
	type ConfigName = SharedConfigName;
	type RuleName = SharedRuleName;

	/** Like the flat config export, but with eslintrc-shaped `configs`. */
	interface Plugin {
		meta: PluginMeta;
		rules: Rules;
		configs: Record< ConfigName, Linter.LegacyConfig >;
	}
}

declare const WordPressESLintPluginLegacy: WordPressESLintPluginLegacy.Plugin;

export = WordPressESLintPluginLegacy;
