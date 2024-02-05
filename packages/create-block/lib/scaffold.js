/**
 * External dependencies
 */
const { pascalCase, snakeCase } = require( 'change-case' );

/**
 * Internal dependencies
 */
const initBlock = require( './init-block' );
const initPackageJSON = require( './init-package-json' );
const initWPScripts = require( './init-wp-scripts' );
const initWPEnv = require( './init-wp-env' );
const { code, info, success, error } = require( './log' );
const { writeOutputAsset, writeOutputTemplate } = require( './output' );

module.exports = async (
	{ blockOutputTemplates, pluginOutputTemplates, outputAssets },
	{
		$schema,
		apiVersion,
		plugin,
		namespace,
		slug,
		title,
		description,
		dashicon,
		category,
		attributes,
		supports,
		author,
		pluginURI,
		license,
		licenseURI,
		domainPath,
		updateURI,
		version,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName,
		editorScript,
		editorStyle,
		style,
		viewStyle,
		render,
		viewModule,
		viewScript,
		variantVars,
		customPackageJSON,
		customBlockJSON,
		example,
		transformer,
	}
) => {
	slug = slug.toLowerCase();
	namespace = namespace.toLowerCase();

	const transformedValues = transformer( {
		$schema,
		apiVersion,
		plugin,
		namespace,
		slug,
		title,
		description,
		dashicon,
		category,
		attributes,
		supports,
		author,
		pluginURI,
		license,
		licenseURI,
		domainPath,
		updateURI,
		version,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName,
		editorScript,
		editorStyle,
		style,
		viewStyle,
		render,
		viewModule,
		viewScript,
		variantVars,
		customPackageJSON,
		customBlockJSON,
		example,
		textdomain: slug,
	} );

	const view = {
		...transformedValues,
		namespaceSnakeCase: snakeCase( transformedValues.slug ),
		slugSnakeCase: snakeCase( transformedValues.slug ),
		slugPascalCase: pascalCase( transformedValues.slug ),
		...variantVars,
	};

	/**
	 * --no-plugin relies on the used template supporting the [blockTemplatesPath property](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/#blocktemplatespath).
	 * If the blockOutputTemplates object has no properties, we can assume that there was a custom --template passed that
	 * doesn't support it.
	 */
	if ( ! plugin && Object.keys( blockOutputTemplates ) < 1 ) {
		error(
			'No block files found in the template. Please ensure that the template supports the blockTemplatesPath property.'
		);
		return;
	}

	info( '' );
	info(
		plugin
			? `Creating a new WordPress plugin in the ${ view.slug } directory.`
			: `Creating a new block in the ${ view.slug } directory.`
	);

	if ( plugin ) {
		await Promise.all(
			Object.keys( pluginOutputTemplates ).map(
				async ( outputFile ) =>
					await writeOutputTemplate(
						pluginOutputTemplates[ outputFile ],
						outputFile,
						view
					)
			)
		);
	}

	await Promise.all(
		Object.keys( outputAssets ).map(
			async ( outputFile ) =>
				await writeOutputAsset(
					outputAssets[ outputFile ],
					outputFile,
					view
				)
		)
	);

	await initBlock( blockOutputTemplates, view );

	if ( plugin ) {
		await initPackageJSON( view );
		if ( wpScripts ) {
			await initWPScripts( view );
		}

		if ( wpEnv ) {
			await initWPEnv( view );
		}
	}

	info( '' );

	success(
		plugin
			? `Done: WordPress plugin ${ title } bootstrapped in the ${ slug } directory.`
			: `Done: Block "${ title }" bootstrapped in the ${ slug } directory.`
	);

	if ( plugin && wpScripts ) {
		info( '' );
		info( 'You can run several commands inside:' );
		info( '' );
		code( '  $ npm start' );
		info( '    Starts the build for development.' );
		info( '' );
		code( '  $ npm run build' );
		info( '    Builds the code for production.' );
		info( '' );
		code( '  $ npm run format' );
		info( '    Formats files.' );
		info( '' );
		code( '  $ npm run lint:css' );
		info( '    Lints CSS files.' );
		info( '' );
		code( '  $ npm run lint:js' );
		info( '    Lints JavaScript files.' );
		info( '' );
		code( '  $ npm run plugin-zip' );
		info( '    Creates a zip file for a WordPress plugin.' );
		info( '' );
		code( '  $ npm run packages-update' );
		info( '    Updates WordPress packages to the latest version.' );
		info( '' );
		info( 'To enter the directory type:' );
		info( '' );
		code( `  $ cd ${ slug }` );
	}
	if ( plugin && wpScripts ) {
		info( '' );
		info( 'You can start development with:' );
		info( '' );
		code( '  $ npm start' );
	}
	if ( plugin && wpEnv ) {
		info( '' );
		info( 'You can start WordPress with:' );
		info( '' );
		code( '  $ npx wp-env start' );
	}
	info( '' );
	info( 'Code is Poetry' );
};
