import path from 'node:path';

// Tool locations are shared by editors because dependencies are not hoisted.
const toolPaths = {
	typescript: 'tools/build-scripts/node_modules/@typescript/native',
	eslint: 'tools/eslint/node_modules',
	prettier: 'packages/prettier-config/node_modules/prettier',
	stylelint: 'tools/stylelint/node_modules/stylelint',
	phpcs: 'vendor/bin/phpcs',
	phpcbf: 'vendor/bin/phpcbf',
};

const searchExclusions = [
	'**/.cache/**',
	'**/build/**',
	'**/build-module/**',
	'**/build-types/**',
	'**/build-style/**',
	'**/node_modules/**',
	'**/vendor/**',
];

const intelephenseSettings = {
	environment: { phpVersion: '7.4.0' },
	files: {
		exclude: [ ...searchExclusions, '**/.git/**', '**/.history/**' ],
	},
};

const bulkSuppression = {
	enable: true,
	location: 'tools/eslint/suppressions.json',
	severity: 'hint',
};

const stylelintLanguages = [ 'css', 'postcss', 'scss' ];

export type Editor = 'vscode' | 'zed';

/**
 * Translate the shared tooling configuration into editor-specific settings.
 *
 * @param editor   Editor to configure.
 * @param repoRoot Repository root. Zed's external tools need absolute paths.
 * @return Workspace settings for the selected editor.
 */
export function getEditorSettings( editor: Editor, repoRoot: string ) {
	if ( editor === 'vscode' ) {
		return {
			$schema: 'vscode://schemas/settings/workspace',
			'files.exclude': { '**/.DS_Store/**': true },
			'search.exclude': Object.fromEntries(
				searchExclusions.map( ( pattern ) => [ pattern, true ] )
			),
			'js/ts.tsdk.path': `${ toolPaths.typescript }/lib`,
			'js/ts.experimental.useTsgo': true,
			'eslint.nodePath': toolPaths.eslint,
			'prettier.prettierPath': toolPaths.prettier,
			'stylelint.stylelintPath': toolPaths.stylelint,
			'eslint.bulkSuppression.enable': bulkSuppression.enable,
			'eslint.bulkSuppression.location': bulkSuppression.location,
			'eslint.bulkSuppression.severity': bulkSuppression.severity,
			'[php]': {
				'editor.formatOnSave': true,
				'editor.defaultFormatter':
					'obliviousharmony.vscode-php-codesniffer',
			},
			'intelephense.environment.phpVersion':
				intelephenseSettings.environment.phpVersion,
			'intelephense.files.exclude': intelephenseSettings.files.exclude,
			'phpCodeSniffer.autoExecutable': true,
			'phpCodeSniffer.standard': 'Automatic',
			'phpCodeSniffer.exclude': [
				'**/.git/**',
				'**/.svn/**',
				'**/.hg/**',
				'**/.cache/**',
				'**/build/**',
				'**/node_modules/**',
				'**/vendor/**',
			],
			'[javascript][javascriptreact][typescript][typescriptreact]': {
				'editor.formatOnSave': false,
				'editor.defaultFormatter': 'esbenp.prettier-vscode',
			},
			'editor.codeActionsOnSave': {
				'source.fixAll.eslint': 'explicit',
				'source.fixAll.stylelint': 'explicit',
			},
			'[css][scss][sass]': {
				'editor.formatOnSave': false,
				'editor.defaultFormatter': 'stylelint.vscode-stylelint',
			},
			'stylelint.validate': stylelintLanguages,
		};
	}

	const resolveTool = ( tool: keyof typeof toolPaths ) =>
		path.join( repoRoot, toolPaths[ tool ] );
	const scriptSettings = {
		// Use native TypeScript for all four syntaxes, and ESLint for diagnostics.
		language_servers: [
			'typescript-ls',
			'eslint',
			'!vtsls',
			'!typescript-language-server',
			'...',
		],
		format_on_save: 'on',
		formatter: {
			external: {
				command: process.execPath,
				arguments: [
					path.join( resolveTool( 'prettier' ), 'bin/prettier.cjs' ),
					'--stdin-filepath',
					'{buffer_path}',
				],
			},
		},
		code_actions_on_format: { 'source.fixAll.eslint': true },
	};
	const stylesheetSettings = {
		language_servers: [ 'stylelint-lsp', '...' ],
		format_on_save: 'on',
		formatter: [ { code_action: 'source.fixAll.stylelint' } ],
	};

	return {
		// Preserve Zed's inherited exclusions for version-control metadata.
		file_scan_exclusions: [
			'...',
			...searchExclusions.map( ( pattern ) => pattern.slice( 0, -3 ) ),
		],
		// Prevent Zed from selecting a bundled upstream Prettier.
		prettier: { allowed: false },
		languages: {
			JavaScript: scriptSettings,
			JSX: scriptSettings,
			TypeScript: scriptSettings,
			TSX: scriptSettings,
			JSON: { formatter: scriptSettings.formatter },
			JSONC: { formatter: scriptSettings.formatter },
			Markdown: { formatter: scriptSettings.formatter },
			YAML: { formatter: scriptSettings.formatter },
			CSS: stylesheetSettings,
			SCSS: stylesheetSettings,
			PHP: {
				language_servers: [
					'intelephense',
					'phpcs',
					'!phpactor',
					'!phptools',
					'!phpantom',
					'...',
				],
				format_on_save: 'on',
				formatter: [ { code_action: 'source.fixAll.phpcs' } ],
			},
		},
		lsp: {
			'typescript-ls': {
				binary: {
					path: process.execPath,
					arguments: [
						path.join( resolveTool( 'typescript' ), 'bin/tsc' ),
						'--lsp',
						'--stdio',
					],
				},
			},
			eslint: {
				settings: {
					nodePath: resolveTool( 'eslint' ),
					workingDirectory: { mode: 'location' },
					bulkSuppression: {
						...bulkSuppression,
						location: path.join(
							repoRoot,
							bulkSuppression.location
						),
					},
				},
			},
			'stylelint-lsp': {
				settings: {
					stylelint: {
						stylelintPath: resolveTool( 'stylelint' ),
						validate: stylelintLanguages,
					},
				},
			},
			intelephense: {
				settings: intelephenseSettings,
			},
			phpcs: {
				settings: {
					phpcs_path: resolveTool( 'phpcs' ),
					phpcbf_path: resolveTool( 'phpcbf' ),
				},
			},
		},
	};
}
