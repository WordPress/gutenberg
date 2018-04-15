const recast = require( 'recast' );
const { forEach, reduce, includes, isEmpty, isFunction } = require( 'lodash' );
const { writeFileSync } = require( 'fs' );
const NormalModule = require( 'webpack/lib/NormalModule' );

class wpi18nExtractor {
	constructor( options ) {
		const DEFAULT_FUNCTIONS = [
			'__',
			'_n',
			'_x',
			'_nx',
			'sprintf',
		];
		this.options = options || {};
		this.options.aliases = this.options.aliases || {};
		this.options.filename = this.options.filename || 'translation-map.json';
		this.translationMap = {};
		this.functionNames = this.options.functionNames || DEFAULT_FUNCTIONS;
	}

	extractStringFromFunctionCall( args, functionName ) {
		const strings = [];
		switch ( functionName ) {
			case '__':
			case 'sprintf':
			case '_n':
				strings.push( args[ 0 ].value );
				break;
			case '_x':
				strings.push( args[ 1 ].value + '\u0004' + args[ 0 ].value );
				break;
			case '_nx':
				strings.push( args[ 3 ].value + '\u0004' + args[ 0 ].value );
		}
		return strings;
	}

	getStringsFromModule( module, extractor ) {
		const source = module.originalSource().source();
		if ( isEmpty( source ) ) {
			return [];
		}
		let strings = [];
		try {
			const ast = recast.parse( source );
			const { types } = recast;
			types.visit( ast, {
				visitCallExpression: function( path ) {
					const node = path.node;
					if ( includes( extractor.functionNames, node.callee.name ) &&
						node.arguments
					) {
						strings = strings.concat(
							extractor.extractStringFromFunctionCall(
								types.getFieldValue( node, 'arguments' ),
								node.callee.name,
							)
						);
					}
					this.traverse( path );
				},
			} );
		} catch ( e ) {
			//we just want to skip parsing errors.
		}
		return strings;
	}

	parseSourcesToMap( modules, chunkName, extractor ) {
		const { getStringsFromModule } = extractor;
		reduce(
			Array.from( modules ),
			function( mapped, module ) {
				if ( ! ( module instanceof NormalModule ) ||
					! isFunction( module.originalSource )
				) {
					return mapped;
				}
				if ( ! mapped.hasOwnProperty( chunkName ) ) {
					mapped[ chunkName ] = [];
				}
				mapped[ chunkName ] = mapped[ chunkName ]
					.concat( getStringsFromModule( module, extractor ) );
				return mapped;
			},
			extractor.translationMap
		);
	}

	apply( compiler ) {
		const { processChunks } = this;
		const extractor = this;

		/**
		 * webpack 4 registration
		 */
		if ( compiler.hasOwnProperty( 'hooks' ) ) {
			compiler.hooks.thisCompilation.tap( 'webpack-i18n-map-extractor', compilation => {
				compilation.hooks.optimizeChunks.tap( 'webpack-i18n-map-extractor', chunks => {
					processChunks( chunks, extractor );
				} );
			} );
		// webpack 3 registration.
		} else {
			compiler.plugin( 'this-compilation', ( compilation ) => {
				compilation.plugin( [ 'optimize-chunks', 'optimize-extracted-chunks' ], ( chunks ) => {
					processChunks( chunks, extractor );
				} );
			} );
		}
	}

	processChunks( chunks, extractor ) {
		const {
			options,
			translationMap,
			parseSourcesToMap,
		} = extractor;
		let chunkName;
		forEach( chunks, function( chunk ) {
			if ( chunk.name ) {
				//get chunk.name from alias if it exists
				chunkName = options.aliases.hasOwnProperty(chunk.name)
					? options.aliases[chunk.name]
					: chunk.name;
				parseSourcesToMap( chunk._modules, chunkName, extractor );
			}
		} );
		writeFileSync( './' + options.filename,
			JSON.stringify( translationMap, null, 2 ),
			'utf-8'
		);
	}
}

module.exports = wpi18nExtractor;
