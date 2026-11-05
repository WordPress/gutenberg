const { isAbsolute, posix } = require( 'path' );
const { CleanPlugin } = require( 'webpack' );

const PLUGIN_NAME = 'SharedOutputCleanPlugin';

/**
 * Turns an asset name into the path of the file webpack writes, relative to the output path,
 * the way webpack's `CleanPlugin` compares paths. Returns `undefined` for assets written outside
 * the output path.
 *
 * @param {string} assetName Asset name, which may carry a query string.
 *
 * @return {string|undefined} Relative file path.
 */
function toOutputFilePath( assetName ) {
	const [ fileName ] = assetName.split( '?' );
	const filePath = posix.normalize( fileName.replace( /\\/g, '/' ) );
	const isOutside = isAbsolute( fileName ) || filePath.startsWith( '../' );

	return isOutside ? undefined : filePath;
}

/**
 * Lists the files a compilation emits, with every directory that holds them.
 *
 * @param {import('webpack').Compilation} compilation Compilation.
 *
 * @return {Set<string>} Paths relative to the output path.
 */
function getOutputPaths( compilation ) {
	const paths = new Set();

	for ( const assetName of Object.keys( compilation.assets ) ) {
		let path = toOutputFilePath( assetName );
		while ( path && path !== '.' && ! paths.has( path ) ) {
			paths.add( path );
			path = posix.dirname( path );
		}
	}

	return paths;
}

/**
 * The state of one compiler that writes to the shared output path.
 */
class Participant {
	/**
	 * @param {string} outputPath Output path of the compiler.
	 */
	constructor( outputPath ) {
		this.outputPath = outputPath;
		/** @type {Set<string>} */
		this.paths = new Set();
		this.hasEmitted = false;
		this.hasSettled = false;
		this.settled = new Promise( ( resolve ) => {
			this.resolveSettled = resolve;
		} );
	}

	/**
	 * Records the files of the latest compilation, which settles the first run.
	 *
	 * @param {import('webpack').Compilation} compilation Compilation.
	 */
	recordEmit( compilation ) {
		this.paths = getOutputPaths( compilation );
		this.hasEmitted = true;
		this.settle();
	}

	/**
	 * Marks the first run as over, whether it emitted or not.
	 */
	settle() {
		this.hasSettled = true;
		this.resolveSettled();
	}

	/**
	 * Tells whether the first run ended without emitting, so the files on disk may still be needed.
	 *
	 * @return {boolean} Whether the compiler has no output yet.
	 */
	hasNoOutput() {
		return this.hasSettled && ! this.hasEmitted;
	}
}

/**
 * Cleans an output path that several compilers write to, like `output.clean` does for one.
 *
 * With `--experimental-modules`, the script and module compilations write to the same output
 * path, so each one's `output.clean` would delete the other's files. Share one instance of this
 * plugin between them instead. Each compiler then runs webpack's `CleanPlugin`, which keeps the
 * files the other compilers emit. Before the first clean, each compiler waits until the others
 * have emitted or finished without emitting, so it knows every file to keep. If one of them
 * finished without emitting, nothing is cleaned, as with a failed build of a single compiler.
 */
class SharedOutputCleanPlugin {
	/**
	 * @param {Object} options      Plugin options.
	 * @param {RegExp} options.keep Relative paths to keep, as in webpack's `output.clean.keep`.
	 */
	constructor( { keep } ) {
		this.keep = keep;
		/** @type {Map<import('webpack').Compiler, Participant>} */
		this.participants = new Map();
	}

	/**
	 * @param {import('webpack').Compiler} compiler Compiler.
	 */
	apply( compiler ) {
		new CleanPlugin( { keep: this.keep } ).apply( compiler );

		const join = () => this.join( compiler );
		const settle = () => this.join( compiler ).settle();

		compiler.hooks.beforeRun.tap( PLUGIN_NAME, join );
		compiler.hooks.watchRun.tap( PLUGIN_NAME, join );
		compiler.hooks.thisCompilation.tap( PLUGIN_NAME, ( compilation ) => {
			CleanPlugin.getCompilationHooks( compilation ).keep.tap(
				PLUGIN_NAME,
				( path ) => this.isKept( compiler, path )
			);
		} );
		compiler.hooks.emit.tapPromise( PLUGIN_NAME, ( compilation ) =>
			this.recordEmit( compiler, compilation )
		);
		compiler.hooks.done.tap( PLUGIN_NAME, settle );
		compiler.hooks.failed.tap( PLUGIN_NAME, settle );
		compiler.hooks.watchClose.tap( PLUGIN_NAME, settle );
	}

	/**
	 * Adds a compiler to the compilers that share its output path, once it starts running.
	 *
	 * @param {import('webpack').Compiler} compiler Compiler.
	 *
	 * @return {Participant} State of the compiler.
	 */
	join( compiler ) {
		if ( ! this.participants.has( compiler ) ) {
			this.participants.set(
				compiler,
				new Participant( compiler.outputPath )
			);
		}

		return this.participants.get( compiler );
	}

	/**
	 * Records what a compiler emits, then waits for the first run of the other compilers.
	 *
	 * @param {import('webpack').Compiler}    compiler    Compiler.
	 * @param {import('webpack').Compilation} compilation Compilation.
	 *
	 * @return {Promise<void>} Resolves once the other compilers settled their first run.
	 */
	async recordEmit( compiler, compilation ) {
		this.join( compiler ).recordEmit( compilation );

		await Promise.all(
			this.getSiblings( compiler ).map( ( sibling ) => sibling.settled )
		);
	}

	/**
	 * Lists the other compilers that write to the same output path.
	 *
	 * @param {import('webpack').Compiler} compiler Compiler.
	 *
	 * @return {Participant[]} State of the other compilers.
	 */
	getSiblings( compiler ) {
		const { outputPath } = this.join( compiler );

		return [ ...this.participants ]
			.filter(
				( [ other, participant ] ) =>
					other !== compiler && participant.outputPath === outputPath
			)
			.map( ( [ , participant ] ) => participant );
	}

	/**
	 * Answers the `keep` hook of `CleanPlugin`: keeps the files of the other compilers.
	 *
	 * @param {import('webpack').Compiler} compiler Compiler that cleans.
	 * @param {string}                     path     Path relative to the output path.
	 *
	 * @return {true|undefined} `true` to keep the path, `undefined` to let `keep` decide.
	 */
	isKept( compiler, path ) {
		const siblings = this.getSiblings( compiler );
		const isKept =
			siblings.some( ( sibling ) => sibling.hasNoOutput() ) ||
			siblings.some( ( sibling ) => sibling.paths.has( path ) );

		return isKept || undefined;
	}
}

module.exports = SharedOutputCleanPlugin;
