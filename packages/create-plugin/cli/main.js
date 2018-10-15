/**
 * External dependencies
 */
const chalk = require( 'chalk' );
const { prompt } = require( 'inquirer' );
const shell = require( 'shelljs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const program = require( './commands' );
const questions = require( './questions' );

/**
 * Start Create WP Plugin Scaffolding
 */

// Show help/prompt
module.exports = () => {
	if ( program.args.length === 0 ) {
		const npmRoot = shell.exec( 'npm root -g', { silent: true } ).stdout;
		const templateFiles = path.normalize( path.join( npmRoot, '/create-wp-plugin/templates/plugin/*' ) ).replace( /(\r\n\t|\n|\r\t)/gm, '' );
		const babelConfig = path.normalize( path.join( npmRoot, '/create-wp-plugin/templates/plugin/.babelrc' ) ).replace( /(\r\n\t|\n|\r\t)/gm, '' );
		const gitConfig = path.normalize( path.join( npmRoot, '/create-wp-plugin/templates/plugin/.gitignore' ) ).replace( /(\r\n\t|\n|\r\t)/gm, '' );

		console.log( chalk.bold.bgRgb( 0, 115, 170 )( ' Welcome To Create WP Plugin ' ) ); // eslint-disable-line no-console
		console.log( chalk.bgRgb( 0, 160, 210 )( ' CLI utility to help you scaffold plugins and blocks' ) ); // eslint-disable-line no-console
		console.log( '' ); // eslint-disable-line no-console

		prompt( questions ).then( ( answers ) => {
			// Generate slug, function prefix & block namespace
			const pluginSlug = answers.pluginName.toLowerCase().replace( /\s+/g, '-' );
			const pluginMachineName = pluginSlug.replace( /-/g, '_' );
			const blockSlug = answers.blockName.toLowerCase().replace( /\s+/g, '-' );
			const blockAuthor = answers.pluginAuthor.toLowerCase().replace( /\s+/g, '-' );
			const blockNamespace = `${ blockAuthor }/${ blockSlug }`;

			// Generate plugin
			console.log( chalk.dim( 'Generating Plugin' ) ); // eslint-disable-line no-console
			shell.mkdir( '-p', pluginSlug );
			shell.cp( '-R', templateFiles, `./${ pluginSlug }` );
			shell.cp( babelConfig, `./${ pluginSlug }` );
			shell.cp( gitConfig, `./${ pluginSlug }` );
			shell.mv( `./${ pluginSlug }/wp-js-plugin-starter.php`, `./${ pluginSlug }/${ pluginSlug }.php` );

			// Update Placeholders
			shell.cd( pluginSlug );
			shell.ls( '-R', '**/*.*' ).forEach( function( file ) {
				shell.sed( '-i', '{{pluginName}}', answers.pluginName, file );
				shell.sed( '-i', '{{pluginUri}}', answers.pluginUri, file );
				shell.sed( '-i', '{{pluginDescription}}', answers.pluginDescription, file );
				shell.sed( '-i', '{{pluginVersion}}', answers.pluginVersion, file );
				shell.sed( '-i', '{{pluginAuthor}}', answers.pluginAuthor, file );
				shell.sed( '-i', '{{pluginSlug}}', pluginSlug, file );
				shell.sed( '-i', '{{pluginLicense}}', answers.pluginLicense, file );
				shell.sed( '-i', '{{pluginMachineName}}', pluginMachineName, file );
				shell.sed( '-i', '{{blockName}}', answers.blockName, file );
				shell.sed( '-i', '{{blockDescription}}', answers.blockDescription, file );
				shell.sed( '-i', '{{blockNamespace}}', blockNamespace, file );
				shell.sed( '-i', '{{blockIcon}}', answers.blockIcon, file );
				shell.sed( '-i', '{{blockCategory}}', answers.blockCategory, file );
			} );
			console.log( chalk.dim( 'Plugin generated!' ) ); // eslint-disable-line no-console

			// Install npm dependencies and run build
			console.log( chalk.dim( 'Installing NPM Dependencies' ) ); // eslint-disable-line no-console
			shell.exec( 'npm install' );

			console.log( chalk.dim( 'Building ...' ) ); // eslint-disable-line no-console
			shell.exec( 'npm run build' );

			// Final
			console.log( chalk.bold.bgRgb( 70, 180, 80 )( 'All Right Sparky !!!' ) ); // eslint-disable-line no-console
		} );
	}
};
