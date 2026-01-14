/**
 * External dependencies
 */
const { pascalCase, snakeCase } = require( 'change-case' );
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const initBlock = require( './init-block' );
const initPackageJSON = require( './init-package-json' );
const initWPScripts = require( './init-wp-scripts' );
const initWPEnv = require( './init-wp-env' );
const { code, info, success, error } = require( './log' );
const { writeOutputAsset, writeOutputTemplate } = require( './output' );
const { getOutputTemplates, getOutputAssets } = require( './templates' );

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
		textdomain,
		attributes,
		supports,
		author,
		pluginURI,
		license,
		licenseURI,
		domainPath,
		updateURI,
		version,
		requiresAtLeast,
		requiresPHP,
		testedUpTo,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName,
		targetDir,
		editorScript,
		editorStyle,
		style,
		viewStyle,
		render,
		viewScriptModule,
		viewScript,
		variantVars,
		customPackageJSON,
		customBlockJSON,
		example,
		transformer,
		pluginTemplatesPath: variantPluginTemplatesPath,
		blockTemplatesPath: variantBlockTemplatesPath,
		assetsPath: variantAssetsPath,
	}
) => {
	slug = slug.toLowerCase();
	const rootDirectory = join( process.cwd(), targetDir || slug );
	const transformedValues = transformer( {
		$schema,
		apiVersion,
		plugin,
		namespace: namespace.toLowerCase(),
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
		requiresAtLeast,
		requiresPHP,
		testedUpTo,
		wpScripts,
		wpEnv,
		npmDependencies,
		npmDevDependencies,
		customScripts,
		folderName: folderName.replace( /\$slug/g, slug ),
		editorScript,
		editorStyle,
		style,
		viewStyle,
		render,
		viewScriptModule,
		viewScript,
		variantVars,
		customPackageJSON,
		customBlockJSON,
		example,
		textdomain: textdomain || slug,
		rootDirectory,
	} );

	const view = {
		...transformedValues,
		namespaceSnakeCase: snakeCase( transformedValues.namespace ),
		namespacePascalCase: pascalCase( transformedValues.namespace ),
		slugSnakeCase: snakeCase( transformedValues.slug ),
		slugPascalCase: pascalCase( transformedValues.slug ),
		...variantVars,
	};

	// Check for the pluginTemplates path in the variant
	if ( variantPluginTemplatesPath === null ) {
		pluginOutputTemplates = {};
	} else if ( variantPluginTemplatesPath ) {
		pluginOutputTemplates = await getOutputTemplates(
			variantPluginTemplatesPath
		);
	}

	// Check for the blockTemplatesPath path in the variant
	if ( variantBlockTemplatesPath === null ) {
		blockOutputTemplates = {};
	} else if ( variantBlockTemplatesPath ) {
		blockOutputTemplates = await getOutputTemplates(
			variantBlockTemplatesPath
		);
	}

	// Check for the assetsPath
	if ( variantAssetsPath === null ) {
		outputAssets = {};
	} else if ( variantAssetsPath ) {
		outputAssets = await getOutputAssets( variantAssetsPath );
	}

	if ( ! plugin && Object.keys( blockOutputTemplates ) < 1 ) {
		/**
		 * --no-plugin relies on the used template supporting the [blockTemplatesPath property](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/#blocktemplatespath).
		 * If the blockOutputTemplates object has no properties, we can assume that there was a custom --template passed that
		 * doesn't support it.
		 */
		error(
			'No block files found in the template. Please ensure that the template supports the blockTemplatesPath property.'
		);
		return;
	}

	const projectType = plugin ? 'plugin' : 'block';
	info( '' );
	info(
		`Creating a new WordPress ${ projectType } in the ${ rootDirectory } directory.`
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
		`Done: WordPress ${ projectType } ${ title } bootstrapped in the ${ rootDirectory } directory.`
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
