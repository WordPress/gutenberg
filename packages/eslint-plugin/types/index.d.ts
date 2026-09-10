/**
 * Type declarations for the public API of `@wordpress/eslint-plugin`.
 */

import type { Linter } from 'eslint';
import type {
	ConfigName as SharedConfigName,
	PluginMeta,
	RuleName as SharedRuleName,
	Rules,
} from './shared';

declare namespace WordPressESLintPlugin {
	type ConfigName = SharedConfigName;
	type RuleName = SharedRuleName;

	/** The plugin object, as passed wherever ESLint expects a plugin. */
	interface Plugin {
		meta: PluginMeta;
		rules: Rules;
		configs: Record< ConfigName, Linter.Config[] >;
	}
}

declare const WordPressESLintPlugin: WordPressESLintPlugin.Plugin;

export = WordPressESLintPlugin;
