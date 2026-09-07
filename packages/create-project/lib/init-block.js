/**
 * External dependencies
 */
const { join } = require( 'path' );
const makeDir = require( 'make-dir' );
const { writeFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { info } = require( './log' );
const { writeOutputTemplate } = require( './output' );

async function initBlockJSON( view ) {
	const {
		$schema,
		apiVersion,
		type,
		plugin,
		theme,
		version,
		author,
		license,
		licenseURI,
		rootDirectory,
		// Block-specific properties
		blockSlug,
		blockNamespace,
		blockTitle,
		blockDescription,
		blockTextdomain,
		blockDashicon,
		blockCategory,
		blockEditorScript,
		blockEditorStyle,
		blockStyle,
		blockViewStyle,
		blockRender,
		blockViewScriptModule,
		blockViewScript,
		blockAttributes,
		blockSupports,
		blockExample,
		customBlockJSON,
		// Parent project properties for namespace fallback
		themeSlug,
		pluginSlug,
	} = view;

	info( '' );
	info( 'Creating a "block.json" file.' );

	// Use block-specific properties with fallbacks
	const actualBlockSlug = blockSlug;
	const actualBlockNamespace =
		blockNamespace || themeSlug || pluginSlug || 'create-project';
	const actualBlockTitle = blockTitle || blockSlug;
	const actualBlockDescription = blockDescription || 'A custom block.';
	const actualBlockTextdomain = blockTextdomain || blockSlug;

	// Determine where to place the block.json file
	let blockFolderName;
	if ( type === 'block' ) {
		// Standalone block goes in the root directory
		blockFolderName = rootDirectory;
	} else if ( theme ) {
		// Block within theme goes in assets/src/[block-slug]
		blockFolderName = join(
			rootDirectory,
			'assets/src/blocks',
			actualBlockSlug
		);
	} else if ( plugin ) {
		// Block within plugin goes directly in src/[block-slug]
		blockFolderName = join( rootDirectory, 'src', actualBlockSlug );
	} else {
		// Default to root directory
		blockFolderName = rootDirectory;
	}

	await makeDir( blockFolderName );

	// Build block.json content, including essential properties even if they're empty
	const blockData = {
		$schema,
		apiVersion,
		name: actualBlockNamespace + '/' + actualBlockSlug,
		version,
		title: actualBlockTitle,
		category: blockCategory || 'widgets',
		icon: blockDashicon,
		description: actualBlockDescription,
		author,
		license,
		licenseURI,
		example: blockExample || {},
		attributes: blockAttributes || {},
		supports: blockSupports || {},
		textdomain: actualBlockTextdomain,
		editorScript: blockEditorScript,
		editorStyle: blockEditorStyle,
		style: blockStyle,
		viewStyle: blockViewStyle,
		render: blockRender,
		viewScriptModule: blockViewScriptModule,
		viewScript: blockViewScript,
		...customBlockJSON,
	};

	// Filter out null/undefined values but keep empty objects and arrays
	const filteredBlockData = Object.fromEntries(
		Object.entries( blockData ).filter( ( [ , value ] ) => {
			return value !== null && value !== undefined && value !== '';
		} )
	);

	await writeFile(
		join( blockFolderName, 'block.json' ),
		JSON.stringify( filteredBlockData, null, '\t' )
	);
}

module.exports = async function ( outputTemplates, view ) {
	// Only scaffold block templates if we have them
	if ( Object.keys( outputTemplates ).length > 0 ) {
		await Promise.all(
			Object.keys( outputTemplates ).map( async ( outputFile ) => {
				// Use block-specific slug
				const actualSlug = view.blockSlug;

				// Determine the output path based on project type
				let outputPath;
				if ( view.type === 'block' ) {
					// Standalone block files go in root
					outputPath = outputFile.replace( /\$slug/g, actualSlug );
				} else if ( view.theme ) {
					// Block files within theme go in assets/src/[block-slug]
					const blockPath = join( 'assets/src/blocks', actualSlug );
					outputPath = join(
						blockPath,
						outputFile.replace( /\$slug/g, actualSlug )
					);
				} else if ( view.plugin ) {
					// Block files within plugin go in src/[block-slug]
					const blockPath = join( 'src', actualSlug );
					outputPath = join(
						blockPath,
						outputFile.replace( /\$slug/g, actualSlug )
					);
				} else {
					// Default case
					outputPath = outputFile.replace( /\$slug/g, actualSlug );
				}

				await writeOutputTemplate(
					outputTemplates[ outputFile ],
					outputPath,
					view
				);
			} )
		);
	}

	// Only create block.json if we're dealing with blocks
	if ( view.type === 'block' || view.withBlocks ) {
		await initBlockJSON( view );
	}
};
