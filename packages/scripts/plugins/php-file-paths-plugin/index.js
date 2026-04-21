/**
 * External dependencies
 */
const { validate } = require( 'schema-utils' );

/**
 * Internal dependencies
 */
const { getPhpFilePaths } = require( '../../utils' );

const phpFilePathsPluginSchema = {
	type: 'object',
	properties: {
		context: {
			type: 'string',
		},
		props: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
};

/**
 * The plugin recomputes PHP file paths once on each compilation. It is necessary to avoid repeating processing
 * when filtering every discovered PHP file in the source folder. This is the most performant way to ensure that
 * changes in `block.json` files are picked up in watch mode.
 */
class PhpFilePathsPlugin {
	/**
	 * PHP file paths from `render` and `variations` props found in `block.json` files.
	 *
	 * @type {string[]}
	 */
	static paths;

	constructor( options = {} ) {
		validate( phpFilePathsPluginSchema, options, {
			name: 'PHP File Paths Plugin',
			baseDataPath: 'options',
		} );

		this.options = options;
	}

	apply( compiler ) {
		const pluginName = this.constructor.name;

		compiler.hooks.thisCompilation.tap( pluginName, () => {
			this.constructor.paths = getPhpFilePaths(
				this.options.context,
				this.options.props
			);
		} );
	}
}

module.exports = PhpFilePathsPlugin;
