/**
 * Credits:
 *
 * lib-font
 * https://github.com/Pomax/lib-font
 * https://github.com/Pomax/lib-font/blob/master/lib-font.browser.js
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 pomax@nihongoresources.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* eslint eslint-comments/no-unlimited-disable: 0 */
/* eslint-disable */
// import pako from 'pako';
import unbrotli from "./unbrotli";
import GzipDecode from "./inflate";

let fetchFunction = globalThis.fetch;
// if ( ! fetchFunction ) {
// 	let backlog = [];
// 	fetchFunction = globalThis.fetch = ( ...args ) =>
// 		new Promise( ( resolve, reject ) => {
// 			backlog.push( { args: args, resolve: resolve, reject: reject } );
// 		} );
// 	import( 'fs' )
// 		.then( ( fs ) => {
// 			fetchFunction = globalThis.fetch = async function ( path ) {
// 				return new Promise( ( resolve, reject ) => {
// 					fs.readFile( path, ( err, data ) => {
// 						if ( err ) return reject( err );
// 						resolve( { ok: true, arrayBuffer: () => data.buffer } );
// 					} );
// 				} );
// 			};
// 			while ( backlog.length ) {
// 				let instruction = backlog.shift();
// 				fetchFunction( ...instruction.args )
// 					.then( ( data ) => instruction.resolve( data ) )
// 					.catch( ( err ) => instruction.reject( err ) );
// 			}
// 		} )
// 		.catch( ( err ) => {
// 			console.error( err );
// 			throw new Error(
// 				`lib-font cannot run unless either the Fetch API or Node's filesystem module is available.`
// 			);
// 		} );
// }
class Event {
	constructor( type, detail = {}, msg ) {
		this.type = type;
		this.detail = detail;
		this.msg = msg;
		Object.defineProperty( this, `__mayPropagate`, {
			enumerable: false,
			writable: true,
		} );
		this.__mayPropagate = true;
	}
	preventDefault() {}
	stopPropagation() {
		this.__mayPropagate = false;
	}
	valueOf() {
		return this;
	}
	toString() {
		return this.msg
			? `[${ this.type } event]: ${ this.msg }`
			: `[${ this.type } event]`;
	}
}
class EventManager {
	constructor() {
		this.listeners = {};
	}
	addEventListener( type, listener, useCapture ) {
		let bin = this.listeners[ type ] || [];
		if ( useCapture ) bin.unshift( listener );
		else bin.push( listener );
		this.listeners[ type ] = bin;
	}
	removeEventListener( type, listener ) {
		let bin = this.listeners[ type ] || [];
		let pos = bin.findIndex( ( e ) => e === listener );
		if ( pos > -1 ) {
			bin.splice( pos, 1 );
			this.listeners[ type ] = bin;
		}
	}
	dispatch( event ) {
		let bin = this.listeners[ event.type ];
		if ( bin ) {
			for ( let l = 0, e = bin.length; l < e; l++ ) {
				if ( ! event.__mayPropagate ) break;
				bin[ l ]( event );
			}
		}
	}
}
const startDate = new Date( `1904-01-01T00:00:00+0000` ).getTime();
function asText( data ) {
	return Array.from( data )
		.map( ( v ) => String.fromCharCode( v ) )
		.join( `` );
}
class Parser {
	constructor( dict, dataview, name ) {
		this.name = ( name || dict.tag || `` ).trim();
		this.length = dict.length;
		this.start = dict.offset;
		this.offset = 0;
		this.data = dataview;
		[
			`getInt8`,
			`getUint8`,
			`getInt16`,
			`getUint16`,
			`getInt32`,
			`getUint32`,
			`getBigInt64`,
			`getBigUint64`,
		].forEach( ( name ) => {
			let fn = name.replace( /get(Big)?/, '' ).toLowerCase();
			let increment = parseInt( name.replace( /[^\d]/g, '' ) ) / 8;
			Object.defineProperty( this, fn, {
				get: () => this.getValue( name, increment ),
			} );
		} );
	}
	get currentPosition() {
		return this.start + this.offset;
	}
	set currentPosition( position ) {
		this.start = position;
		this.offset = 0;
	}
	skip( n = 0, bits = 8 ) {
		this.offset += ( n * bits ) / 8;
	}
	getValue( type, increment ) {
		let pos = this.start + this.offset;
		this.offset += increment;
		try {
			return this.data[ type ]( pos );
		} catch ( e ) {
			console.error( `parser`, type, increment, this );
			console.error( `parser`, this.start, this.offset );
			throw e;
		}
	}
	flags( n ) {
		if ( n === 8 || n === 16 || n === 32 || n === 64 ) {
			return this[ `uint${ n }` ]
				.toString( 2 )
				.padStart( n, 0 )
				.split( `` )
				.map( ( v ) => v === '1' );
		}
		console.error(
			`Error parsing flags: flag types can only be 1, 2, 4, or 8 bytes long`
		);
		console.trace();
	}
	get tag() {
		const t = this.uint32;
		return asText( [
			( t >> 24 ) & 255,
			( t >> 16 ) & 255,
			( t >> 8 ) & 255,
			t & 255,
		] );
	}
	get fixed() {
		let major = this.int16;
		let minor = Math.round( ( 1e3 * this.uint16 ) / 65356 );
		return major + minor / 1e3;
	}
	get legacyFixed() {
		let major = this.uint16;
		let minor = this.uint16.toString( 16 ).padStart( 4, 0 );
		return parseFloat( `${ major }.${ minor }` );
	}
	get uint24() {
		return ( this.uint8 << 16 ) + ( this.uint8 << 8 ) + this.uint8;
	}
	get uint128() {
		let value = 0;
		for ( let i = 0; i < 5; i++ ) {
			let byte = this.uint8;
			value = value * 128 + ( byte & 127 );
			if ( byte < 128 ) break;
		}
		return value;
	}
	get longdatetime() {
		return new Date( startDate + 1e3 * parseInt( this.int64.toString() ) );
	}
	get fword() {
		return this.int16;
	}
	get ufword() {
		return this.uint16;
	}
	get Offset16() {
		return this.uint16;
	}
	get Offset32() {
		return this.uint32;
	}
	get F2DOT14() {
		const bits = p.uint16;
		const integer = [ 0, 1, -2, -1 ][ bits >> 14 ];
		const fraction = bits & 16383;
		return integer + fraction / 16384;
	}
	verifyLength() {
		if ( this.offset != this.length ) {
			console.error(
				`unexpected parsed table size (${ this.offset }) for "${ this.name }" (expected ${ this.length })`
			);
		}
	}
	readBytes( n = 0, position = 0, bits = 8, signed = false ) {
		n = n || this.length;
		if ( n === 0 ) return [];
		if ( position ) this.currentPosition = position;
		const fn = `${ signed ? `` : `u` }int${ bits }`,
			slice = [];
		while ( n-- ) slice.push( this[ fn ] );
		return slice;
	}
}
class ParsedData {
	constructor( parser ) {
		const pGetter = { enumerable: false, get: () => parser };
		Object.defineProperty( this, `parser`, pGetter );
		const start = parser.currentPosition;
		const startGetter = { enumerable: false, get: () => start };
		Object.defineProperty( this, `start`, startGetter );
	}
	load( struct ) {
		Object.keys( struct ).forEach( ( p ) => {
			let props = Object.getOwnPropertyDescriptor( struct, p );
			if ( props.get ) {
				this[ p ] = props.get.bind( this );
			} else if ( props.value !== undefined ) {
				this[ p ] = props.value;
			}
		} );
		if ( this.parser.length ) {
			this.parser.verifyLength();
		}
	}
}
class SimpleTable extends ParsedData {
	constructor( dict, dataview, name ) {
		const { parser: parser, start: start } = super(
			new Parser( dict, dataview, name )
		);
		const pGetter = { enumerable: false, get: () => parser };
		Object.defineProperty( this, `p`, pGetter );
		const startGetter = { enumerable: false, get: () => start };
		Object.defineProperty( this, `tableStart`, startGetter );
	}
}
function lazy$1( object, property, getter ) {
	let val;
	Object.defineProperty( object, property, {
		get: () => {
			if ( val ) return val;
			val = getter();
			return val;
		},
		enumerable: true,
	} );
}
class SFNT extends SimpleTable {
	constructor( font, dataview, createTable ) {
		const { p: p } = super( { offset: 0, length: 12 }, dataview, `sfnt` );
		this.version = p.uint32;
		this.numTables = p.uint16;
		this.searchRange = p.uint16;
		this.entrySelector = p.uint16;
		this.rangeShift = p.uint16;
		p.verifyLength();
		this.directory = [ ...new Array( this.numTables ) ].map(
			( _ ) => new TableRecord( p )
		);
		this.tables = {};
		this.directory.forEach( ( entry ) => {
			const getter = () =>
				createTable(
					this.tables,
					{
						tag: entry.tag,
						offset: entry.offset,
						length: entry.length,
					},
					dataview
				);
			lazy$1( this.tables, entry.tag.trim(), getter );
		} );
	}
}
class TableRecord {
	constructor( p ) {
		this.tag = p.tag;
		this.checksum = p.uint32;
		this.offset = p.uint32;
		this.length = p.uint32;
	}
}
const gzipDecode = GzipDecode.inflate || undefined;
let nativeGzipDecode = undefined;
// if ( ! gzipDecode ) {
// 	import( 'zlib' ).then( ( zlib ) => {
// 		nativeGzipDecode = ( buffer ) => zlib.unzipSync( buffer );
// 	} );
// }
class WOFF$1 extends SimpleTable {
	constructor( font, dataview, createTable ) {
		const { p: p } = super( { offset: 0, length: 44 }, dataview, `woff` );
		this.signature = p.tag;
		this.flavor = p.uint32;
		this.length = p.uint32;
		this.numTables = p.uint16;
		p.uint16;
		this.totalSfntSize = p.uint32;
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.metaOffset = p.uint32;
		this.metaLength = p.uint32;
		this.metaOrigLength = p.uint32;
		this.privOffset = p.uint32;
		this.privLength = p.uint32;
		p.verifyLength();
		this.directory = [ ...new Array( this.numTables ) ].map(
			( _ ) => new WoffTableDirectoryEntry( p )
		);
		buildWoffLazyLookups( this, dataview, createTable );
	}
}
class WoffTableDirectoryEntry {
	constructor( p ) {
		this.tag = p.tag;
		this.offset = p.uint32;
		this.compLength = p.uint32;
		this.origLength = p.uint32;
		this.origChecksum = p.uint32;
	}
}
function buildWoffLazyLookups( woff, dataview, createTable ) {
	woff.tables = {};
	woff.directory.forEach( ( entry ) => {
		lazy$1( woff.tables, entry.tag.trim(), () => {
			let offset = 0;
			let view = dataview;
			if ( entry.compLength !== entry.origLength ) {
				const data = dataview.buffer.slice(
					entry.offset,
					entry.offset + entry.compLength
				);
				let unpacked;
				if ( gzipDecode ) {
					unpacked = gzipDecode( new Uint8Array( data ) );
				} else if ( nativeGzipDecode ) {
					unpacked = nativeGzipDecode( new Uint8Array( data ) );
				} else {
					const msg = `no brotli decoder available to decode WOFF2 font`;
					if ( font.onerror ) font.onerror( msg );
					throw new Error( msg );
				}
				view = new DataView( unpacked.buffer );
			} else {
				offset = entry.offset;
			}
			return createTable(
				woff.tables,
				{ tag: entry.tag, offset: offset, length: entry.origLength },
				view
			);
		} );
	} );
}
const brotliDecode = unbrotli;
let nativeBrotliDecode = undefined;
// if ( ! brotliDecode ) {
// 	import( 'zlib' ).then( ( zlib ) => {
// 		nativeBrotliDecode = ( buffer ) => zlib.brotliDecompressSync( buffer );
// 	} );
// }
class WOFF2$1 extends SimpleTable {
	constructor( font, dataview, createTable ) {
		const { p: p } = super( { offset: 0, length: 48 }, dataview, `woff2` );
		this.signature = p.tag;
		this.flavor = p.uint32;
		this.length = p.uint32;
		this.numTables = p.uint16;
		p.uint16;
		this.totalSfntSize = p.uint32;
		this.totalCompressedSize = p.uint32;
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.metaOffset = p.uint32;
		this.metaLength = p.uint32;
		this.metaOrigLength = p.uint32;
		this.privOffset = p.uint32;
		this.privLength = p.uint32;
		p.verifyLength();
		this.directory = [ ...new Array( this.numTables ) ].map(
			( _ ) => new Woff2TableDirectoryEntry( p )
		);
		let dictOffset = p.currentPosition;
		this.directory[ 0 ].offset = 0;
		this.directory.forEach( ( e, i ) => {
			let next = this.directory[ i + 1 ];
			if ( next ) {
				next.offset =
					e.offset +
					( e.transformLength !== undefined
						? e.transformLength
						: e.origLength );
			}
		} );
		let decoded;
		let buffer = dataview.buffer.slice( dictOffset );
		if ( brotliDecode ) {
			decoded = brotliDecode( new Uint8Array( buffer ) );
		} else if ( nativeBrotliDecode ) {
			decoded = new Uint8Array( nativeBrotliDecode( buffer ) );
		} else {
			const msg = `no brotli decoder available to decode WOFF2 font`;
			if ( font.onerror ) font.onerror( msg );
			throw new Error( msg );
		}
		buildWoff2LazyLookups( this, decoded, createTable );
	}
}
class Woff2TableDirectoryEntry {
	constructor( p ) {
		this.flags = p.uint8;
		const tagNumber = ( this.tagNumber = this.flags & 63 );
		if ( tagNumber === 63 ) {
			this.tag = p.tag;
		} else {
			this.tag = getWOFF2Tag( tagNumber );
		}
		const transformVersion = ( this.transformVersion =
			( this.flags & 192 ) >> 6 );
		let hasTransforms = transformVersion !== 0;
		if ( this.tag === `glyf` || this.tag === `loca` ) {
			hasTransforms = this.transformVersion !== 3;
		}
		this.origLength = p.uint128;
		if ( hasTransforms ) {
			this.transformLength = p.uint128;
		}
	}
}
function buildWoff2LazyLookups( woff2, decoded, createTable ) {
	woff2.tables = {};
	woff2.directory.forEach( ( entry ) => {
		lazy$1( woff2.tables, entry.tag.trim(), () => {
			const start = entry.offset;
			const end =
				start +
				( entry.transformLength
					? entry.transformLength
					: entry.origLength );
			const data = new DataView( decoded.slice( start, end ).buffer );
			try {
				return createTable(
					woff2.tables,
					{ tag: entry.tag, offset: 0, length: entry.origLength },
					data
				);
			} catch ( e ) {
				console.error( e );
			}
		} );
	} );
}
function getWOFF2Tag( flag ) {
	return [
		`cmap`,
		`head`,
		`hhea`,
		`hmtx`,
		`maxp`,
		`name`,
		`OS/2`,
		`post`,
		`cvt `,
		`fpgm`,
		`glyf`,
		`loca`,
		`prep`,
		`CFF `,
		`VORG`,
		`EBDT`,
		`EBLC`,
		`gasp`,
		`hdmx`,
		`kern`,
		`LTSH`,
		`PCLT`,
		`VDMX`,
		`vhea`,
		`vmtx`,
		`BASE`,
		`GDEF`,
		`GPOS`,
		`GSUB`,
		`EBSC`,
		`JSTF`,
		`MATH`,
		`CBDT`,
		`CBLC`,
		`COLR`,
		`CPAL`,
		`SVG `,
		`sbix`,
		`acnt`,
		`avar`,
		`bdat`,
		`bloc`,
		`bsln`,
		`cvar`,
		`fdsc`,
		`feat`,
		`fmtx`,
		`fvar`,
		`gvar`,
		`hsty`,
		`just`,
		`lcar`,
		`mort`,
		`morx`,
		`opbd`,
		`prop`,
		`trak`,
		`Zapf`,
		`Silf`,
		`Glat`,
		`Gloc`,
		`Feat`,
		`Sill`,
	][ flag & 63 ];
}
const tableClasses = {};
let tableClassesLoaded = false;
Promise.all( [
	Promise.resolve().then( function () {
		return cmap$1;
	} ),
	Promise.resolve().then( function () {
		return head$1;
	} ),
	Promise.resolve().then( function () {
		return hhea$1;
	} ),
	Promise.resolve().then( function () {
		return hmtx$1;
	} ),
	Promise.resolve().then( function () {
		return maxp$1;
	} ),
	Promise.resolve().then( function () {
		return name$1;
	} ),
	Promise.resolve().then( function () {
		return OS2$1;
	} ),
	Promise.resolve().then( function () {
		return post$1;
	} ),
	Promise.resolve().then( function () {
		return BASE$1;
	} ),
	Promise.resolve().then( function () {
		return GDEF$1;
	} ),
	Promise.resolve().then( function () {
		return GSUB$1;
	} ),
	Promise.resolve().then( function () {
		return GPOS$1;
	} ),
	Promise.resolve().then( function () {
		return SVG$1;
	} ),
	Promise.resolve().then( function () {
		return fvar$1;
	} ),
	Promise.resolve().then( function () {
		return cvt$1;
	} ),
	Promise.resolve().then( function () {
		return fpgm$1;
	} ),
	Promise.resolve().then( function () {
		return gasp$1;
	} ),
	Promise.resolve().then( function () {
		return glyf$1;
	} ),
	Promise.resolve().then( function () {
		return loca$1;
	} ),
	Promise.resolve().then( function () {
		return prep$1;
	} ),
	Promise.resolve().then( function () {
		return CFF$1;
	} ),
	Promise.resolve().then( function () {
		return CFF2$1;
	} ),
	Promise.resolve().then( function () {
		return VORG$1;
	} ),
	Promise.resolve().then( function () {
		return EBLC$1;
	} ),
	Promise.resolve().then( function () {
		return EBDT$1;
	} ),
	Promise.resolve().then( function () {
		return EBSC$1;
	} ),
	Promise.resolve().then( function () {
		return CBLC$1;
	} ),
	Promise.resolve().then( function () {
		return CBDT$1;
	} ),
	Promise.resolve().then( function () {
		return sbix$1;
	} ),
	Promise.resolve().then( function () {
		return COLR$1;
	} ),
	Promise.resolve().then( function () {
		return CPAL$1;
	} ),
	Promise.resolve().then( function () {
		return DSIG$1;
	} ),
	Promise.resolve().then( function () {
		return hdmx$1;
	} ),
	Promise.resolve().then( function () {
		return kern$1;
	} ),
	Promise.resolve().then( function () {
		return LTSH$1;
	} ),
	Promise.resolve().then( function () {
		return MERG$1;
	} ),
	Promise.resolve().then( function () {
		return meta$1;
	} ),
	Promise.resolve().then( function () {
		return PCLT$1;
	} ),
	Promise.resolve().then( function () {
		return VDMX$1;
	} ),
	Promise.resolve().then( function () {
		return vhea$1;
	} ),
	Promise.resolve().then( function () {
		return vmtx$1;
	} ),
] ).then( ( data ) => {
	data.forEach( ( e ) => {
		let name = Object.keys( e )[ 0 ];
		tableClasses[ name ] = e[ name ];
	} );
	tableClassesLoaded = true;
} );
function createTable( tables, dict, dataview ) {
	let name = dict.tag.replace( /[^\w\d]/g, `` );
	let Type = tableClasses[ name ];
	if ( Type ) return new Type( dict, dataview, tables );
	console.warn(
		`lib-font has no definition for ${ name }. The table was skipped.`
	);
	return {};
}
function loadTableClasses() {
	let count = 0;
	function checkLoaded( resolve, reject ) {
		if ( ! tableClassesLoaded ) {
			if ( count > 10 ) {
				return reject( new Error( `loading took too long` ) );
			}
			count++;
			return setTimeout( () => checkLoaded( resolve ), 250 );
		}
		resolve( createTable );
	}
	return new Promise( ( resolve, reject ) => checkLoaded( resolve ) );
}
function getFontCSSFormat( path, errorOnStyle ) {
	let pos = path.lastIndexOf( `.` );
	let ext = ( path.substring( pos + 1 ) || `` ).toLowerCase();
	let format = {
		ttf: `truetype`,
		otf: `opentype`,
		woff: `woff`,
		woff2: `woff2`,
	}[ ext ];
	if ( format ) return format;
	let msg = {
		eot: `The .eot format is not supported: it died in January 12, 2016, when Microsoft retired all versions of IE that didn't already support WOFF.`,
		svg: `The .svg format is not supported: SVG fonts (not to be confused with OpenType with embedded SVG) were so bad we took the entire fonts chapter out of the SVG specification again.`,
		fon: `The .fon format is not supported: this is an ancient Windows bitmap font format.`,
		ttc: `Based on the current CSS specification, font collections are not (yet?) supported.`,
	}[ ext ];
	if ( ! msg ) msg = `${ path } is not a known webfont format.`;
	if ( errorOnStyle ) {
		throw new Error( msg );
	} else {
		console.warn( `Could not load font: ${ msg }` );
	}
}
async function setupFontFace( name, url, options = {} ) {
	if ( ! globalThis.document ) return;
	let format = getFontCSSFormat( url, options.errorOnStyle );
	if ( ! format ) return;
	let style = document.createElement( `style` );
	style.className = `injected-by-Font-js`;
	let rules = [];
	if ( options.styleRules ) {
		rules = Object.entries( options.styleRules ).map(
			( [ key, value ] ) => `${ key }: ${ value };`
		);
	}
	style.textContent = `\n@font-face {\n    font-family: "${ name }";\n    ${ rules.join(
		`\n\t`
	) }\n    src: url("${ url }") format("${ format }");\n}`;
	globalThis.document.head.appendChild( style );
	return style;
}
const TTF = [ 0, 1, 0, 0 ];
const OTF = [ 79, 84, 84, 79 ];
const WOFF = [ 119, 79, 70, 70 ];
const WOFF2 = [ 119, 79, 70, 50 ];
function match( ar1, ar2 ) {
	if ( ar1.length !== ar2.length ) return;
	for ( let i = 0; i < ar1.length; i++ ) {
		if ( ar1[ i ] !== ar2[ i ] ) return;
	}
	return true;
}
function validFontFormat( dataview ) {
	const LEAD_BYTES = [
		dataview.getUint8( 0 ),
		dataview.getUint8( 1 ),
		dataview.getUint8( 2 ),
		dataview.getUint8( 3 ),
	];
	if ( match( LEAD_BYTES, TTF ) || match( LEAD_BYTES, OTF ) ) return `SFNT`;
	if ( match( LEAD_BYTES, WOFF ) ) return `WOFF`;
	if ( match( LEAD_BYTES, WOFF2 ) ) return `WOFF2`;
}
function checkFetchResponseStatus( response ) {
	if ( ! response.ok ) {
		throw new Error(
			`HTTP ${ response.status } - ${ response.statusText }`
		);
	}
	return response;
}
class Font extends EventManager {
	constructor( name, options = {} ) {
		super();
		this.name = name;
		this.options = options;
		this.metrics = false;
	}
	get src() {
		return this.__src;
	}
	set src( src ) {
		this.__src = src;
		( async () => {
			if ( globalThis.document && ! this.options.skipStyleSheet ) {
				await setupFontFace( this.name, src, this.options );
			}
			this.loadFont( src );
		} )();
	}
	async loadFont( url, filename ) {
		fetch( url )
			.then(
				( response ) =>
					checkFetchResponseStatus( response ) &&
					response.arrayBuffer()
			)
			.then( ( buffer ) =>
				this.fromDataBuffer( buffer, filename || url )
			)
			.catch( ( err ) => {
				const evt = new Event(
					`error`,
					err,
					`Failed to load font at ${ filename || url }`
				);
				this.dispatch( evt );
				if ( this.onerror ) this.onerror( evt );
			} );
	}
	async fromDataBuffer( buffer, filenameOrUrL ) {
		this.fontData = new DataView( buffer );
		let type = validFontFormat( this.fontData );
		if ( ! type ) {
			throw new Error(
				`${ filenameOrUrL } is either an unsupported font format, or not a font at all.`
			);
		}
		await this.parseBasicData( type );
		const evt = new Event( 'load', { font: this } );
		this.dispatch( evt );
		if ( this.onload ) this.onload( evt );
	}
	async parseBasicData( type ) {
		return loadTableClasses().then( ( createTable ) => {
			if ( type === `SFNT` ) {
				this.opentype = new SFNT( this, this.fontData, createTable );
			}
			if ( type === `WOFF` ) {
				this.opentype = new WOFF$1( this, this.fontData, createTable );
			}
			if ( type === `WOFF2` ) {
				this.opentype = new WOFF2$1( this, this.fontData, createTable );
			}
			return this.opentype;
		} );
	}
	getGlyphId( char ) {
		return this.opentype.tables.cmap.getGlyphId( char );
	}
	reverse( glyphid ) {
		return this.opentype.tables.cmap.reverse( glyphid );
	}
	supports( char ) {
		return this.getGlyphId( char ) !== 0;
	}
	supportsVariation( variation ) {
		return (
			this.opentype.tables.cmap.supportsVariation( variation ) !== false
		);
	}
	measureText( text, size = 16 ) {
		if ( this.__unloaded )
			throw new Error(
				'Cannot measure text: font was unloaded. Please reload before calling measureText()'
			);
		let d = document.createElement( 'div' );
		d.textContent = text;
		d.style.fontFamily = this.name;
		d.style.fontSize = `${ size }px`;
		d.style.color = `transparent`;
		d.style.background = `transparent`;
		d.style.top = `0`;
		d.style.left = `0`;
		d.style.position = `absolute`;
		document.body.appendChild( d );
		let bbox = d.getBoundingClientRect();
		document.body.removeChild( d );
		const OS2 = this.opentype.tables[ 'OS/2' ];
		bbox.fontSize = size;
		bbox.ascender = OS2.sTypoAscender;
		bbox.descender = OS2.sTypoDescender;
		return bbox;
	}
	unload() {
		if ( this.styleElement.parentNode ) {
			this.styleElement.parentNode.removeElement( this.styleElement );
			const evt = new Event( 'unload', { font: this } );
			this.dispatch( evt );
			if ( this.onunload ) this.onunload( evt );
		}
		this._unloaded = true;
	}
	load() {
		if ( this.__unloaded ) {
			delete this.__unloaded;
			document.head.appendChild( this.styleElement );
			const evt = new Event( 'load', { font: this } );
			this.dispatch( evt );
			if ( this.onload ) this.onload( evt );
		}
	}
}
globalThis.Font = Font;
class Subtable extends ParsedData {
	constructor( p, plaformID, encodingID ) {
		super( p );
		this.plaformID = plaformID;
		this.encodingID = encodingID;
	}
}
class Format0 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.format = 0;
		this.length = p.uint16;
		this.language = p.uint16;
		this.glyphIdArray = [ ...new Array( 256 ) ].map( ( _ ) => p.uint8 );
	}
	supports( charCode ) {
		if ( charCode.charCodeAt ) {
			charCode = -1;
			console.warn(
				`supports(character) not implemented for cmap subtable format 0. only supports(id) is implemented.`
			);
		}
		return 0 <= charCode && charCode <= 255;
	}
	reverse( glyphID ) {
		console.warn( `reverse not implemented for cmap subtable format 0` );
		return {};
	}
	getSupportedCharCodes() {
		return [ { start: 1, end: 256 } ];
	}
}
class Format2 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.format = 2;
		this.length = p.uint16;
		this.language = p.uint16;
		this.subHeaderKeys = [ ...new Array( 256 ) ].map( ( _ ) => p.uint16 );
		const subHeaderCount = Math.max( ...this.subHeaderKeys );
		const subHeaderOffset = p.currentPosition;
		lazy$1( this, `subHeaders`, () => {
			p.currentPosition = subHeaderOffset;
			return [ ...new Array( subHeaderCount ) ].map(
				( _ ) => new SubHeader( p )
			);
		} );
		const glyphIndexOffset = subHeaderOffset + subHeaderCount * 8;
		lazy$1( this, `glyphIndexArray`, () => {
			p.currentPosition = glyphIndexOffset;
			return [ ...new Array( subHeaderCount ) ].map( ( _ ) => p.uint16 );
		} );
	}
	supports( charCode ) {
		if ( charCode.charCodeAt ) {
			charCode = -1;
			console.warn(
				`supports(character) not implemented for cmap subtable format 2. only supports(id) is implemented.`
			);
		}
		const low = charCode && 255;
		const high = charCode && 65280;
		const subHeaderKey = this.subHeaders[ high ];
		const subheader = this.subHeaders[ subHeaderKey ];
		const first = subheader.firstCode;
		const last = first + subheader.entryCount;
		return first <= low && low <= last;
	}
	reverse( glyphID ) {
		console.warn( `reverse not implemented for cmap subtable format 2` );
		return {};
	}
	getSupportedCharCodes( preservePropNames = false ) {
		if ( preservePropNames ) {
			return this.subHeaders.map( ( h ) => ( {
				firstCode: h.firstCode,
				lastCode: h.lastCode,
			} ) );
		}
		return this.subHeaders.map( ( h ) => ( {
			start: h.firstCode,
			end: h.lastCode,
		} ) );
	}
}
class SubHeader {
	constructor( p ) {
		this.firstCode = p.uint16;
		this.entryCount = p.uint16;
		this.lastCode = this.first + this.entryCount;
		this.idDelta = p.int16;
		this.idRangeOffset = p.uint16;
	}
}
class Format4 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.format = 4;
		this.length = p.uint16;
		this.language = p.uint16;
		this.segCountX2 = p.uint16;
		this.segCount = this.segCountX2 / 2;
		this.searchRange = p.uint16;
		this.entrySelector = p.uint16;
		this.rangeShift = p.uint16;
		const endCodePosition = p.currentPosition;
		lazy$1( this, `endCode`, () =>
			p.readBytes( this.segCount, endCodePosition, 16 )
		);
		const startCodePosition = endCodePosition + 2 + this.segCountX2;
		lazy$1( this, `startCode`, () =>
			p.readBytes( this.segCount, startCodePosition, 16 )
		);
		const idDeltaPosition = startCodePosition + this.segCountX2;
		lazy$1( this, `idDelta`, () =>
			p.readBytes( this.segCount, idDeltaPosition, 16, true )
		);
		const idRangePosition = idDeltaPosition + this.segCountX2;
		lazy$1( this, `idRangeOffset`, () =>
			p.readBytes( this.segCount, idRangePosition, 16 )
		);
		const glyphIdArrayPosition = idRangePosition + this.segCountX2;
		const glyphIdArrayLength =
			this.length - ( glyphIdArrayPosition - this.tableStart );
		lazy$1( this, `glyphIdArray`, () =>
			p.readBytes( glyphIdArrayLength, glyphIdArrayPosition, 16 )
		);
		lazy$1( this, `segments`, () =>
			this.buildSegments( idRangePosition, glyphIdArrayPosition, p )
		);
	}
	buildSegments( idRangePosition, glyphIdArrayPosition, p ) {
		const build = ( _, i ) => {
			let startCode = this.startCode[ i ],
				endCode = this.endCode[ i ],
				idDelta = this.idDelta[ i ],
				idRangeOffset = this.idRangeOffset[ i ],
				idRangeOffsetPointer = idRangePosition + 2 * i,
				glyphIDs = [];
			if ( idRangeOffset === 0 ) {
				for (
					let i = startCode + idDelta, e = endCode + idDelta;
					i <= e;
					i++
				) {
					glyphIDs.push( i );
				}
			} else {
				for ( let i = 0, e = endCode - startCode; i <= e; i++ ) {
					p.currentPosition =
						idRangeOffsetPointer + idRangeOffset + i * 2;
					glyphIDs.push( p.uint16 );
				}
			}
			return {
				startCode: startCode,
				endCode: endCode,
				idDelta: idDelta,
				idRangeOffset: idRangeOffset,
				glyphIDs: glyphIDs,
			};
		};
		return [ ...new Array( this.segCount ) ].map( build );
	}
	reverse( glyphID ) {
		let s = this.segments.find( ( v ) => v.glyphIDs.includes( glyphID ) );
		if ( ! s ) return {};
		const code = s.startCode + s.glyphIDs.indexOf( glyphID );
		return { code: code, unicode: String.fromCodePoint( code ) };
	}
	getGlyphId( charCode ) {
		if ( charCode.charCodeAt ) charCode = charCode.charCodeAt( 0 );
		if ( 55296 <= charCode && charCode <= 57343 ) return 0;
		if ( ( charCode & 65534 ) === 65534 || ( charCode & 65535 ) === 65535 )
			return 0;
		let segment = this.segments.find(
			( s ) => s.startCode <= charCode && charCode <= s.endCode
		);
		if ( ! segment ) return 0;
		return segment.glyphIDs[ charCode - segment.startCode ];
	}
	supports( charCode ) {
		return this.getGlyphId( charCode ) !== 0;
	}
	getSupportedCharCodes( preservePropNames = false ) {
		if ( preservePropNames ) return this.segments;
		return this.segments.map( ( v ) => ( {
			start: v.startCode,
			end: v.endCode,
		} ) );
	}
}
class Format6 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.format = 6;
		this.length = p.uint16;
		this.language = p.uint16;
		this.firstCode = p.uint16;
		this.entryCount = p.uint16;
		this.lastCode = this.firstCode + this.entryCount - 1;
		const getter = () =>
			[ ...new Array( this.entryCount ) ].map( ( _ ) => p.uint16 );
		lazy$1( this, `glyphIdArray`, getter );
	}
	supports( charCode ) {
		if ( charCode.charCodeAt ) {
			charCode = -1;
			console.warn(
				`supports(character) not implemented for cmap subtable format 6. only supports(id) is implemented.`
			);
		}
		if ( charCode < this.firstCode ) return {};
		if ( charCode > this.firstCode + this.entryCount ) return {};
		const code = charCode - this.firstCode;
		return { code: code, unicode: String.fromCodePoint( code ) };
	}
	reverse( glyphID ) {
		let pos = this.glyphIdArray.indexOf( glyphID );
		if ( pos > -1 ) return this.firstCode + pos;
	}
	getSupportedCharCodes( preservePropNames = false ) {
		if ( preservePropNames ) {
			return [ { firstCode: this.firstCode, lastCode: this.lastCode } ];
		}
		return [ { start: this.firstCode, end: this.lastCode } ];
	}
}
class Format8 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.format = 8;
		p.uint16;
		this.length = p.uint32;
		this.language = p.uint32;
		this.is32 = [ ...new Array( 8192 ) ].map( ( _ ) => p.uint8 );
		this.numGroups = p.uint32;
		const getter = () =>
			[ ...new Array( this.numGroups ) ].map(
				( _ ) => new SequentialMapGroup$1( p )
			);
		lazy$1( this, `groups`, getter );
	}
	supports( charCode ) {
		if ( charCode.charCodeAt ) {
			charCode = -1;
			console.warn(
				`supports(character) not implemented for cmap subtable format 8. only supports(id) is implemented.`
			);
		}
		return (
			this.groups.findIndex(
				( s ) =>
					s.startcharCode <= charCode && charCode <= s.endcharCode
			) !== -1
		);
	}
	reverse( glyphID ) {
		console.warn( `reverse not implemented for cmap subtable format 8` );
		return {};
	}
	getSupportedCharCodes( preservePropNames = false ) {
		if ( preservePropNames ) return this.groups;
		return this.groups.map( ( v ) => ( {
			start: v.startcharCode,
			end: v.endcharCode,
		} ) );
	}
}
class SequentialMapGroup$1 {
	constructor( p ) {
		this.startcharCode = p.uint32;
		this.endcharCode = p.uint32;
		this.startGlyphID = p.uint32;
	}
}
class Format10 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.format = 10;
		p.uint16;
		this.length = p.uint32;
		this.language = p.uint32;
		this.startCharCode = p.uint32;
		this.numChars = p.uint32;
		this.endCharCode = this.startCharCode + this.numChars;
		const getter = () =>
			[ ...new Array( this.numChars ) ].map( ( _ ) => p.uint16 );
		lazy$1( this, `glyphs`, getter );
	}
	supports( charCode ) {
		if ( charCode.charCodeAt ) {
			charCode = -1;
			console.warn(
				`supports(character) not implemented for cmap subtable format 10. only supports(id) is implemented.`
			);
		}
		if ( charCode < this.startCharCode ) return false;
		if ( charCode > this.startCharCode + this.numChars ) return false;
		return charCode - this.startCharCode;
	}
	reverse( glyphID ) {
		console.warn( `reverse not implemented for cmap subtable format 10` );
		return {};
	}
	getSupportedCharCodes( preservePropNames = false ) {
		if ( preservePropNames ) {
			return [
				{
					startCharCode: this.startCharCode,
					endCharCode: this.endCharCode,
				},
			];
		}
		return [ { start: this.startCharCode, end: this.endCharCode } ];
	}
}
class Format12 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.format = 12;
		p.uint16;
		this.length = p.uint32;
		this.language = p.uint32;
		this.numGroups = p.uint32;
		const getter = () =>
			[ ...new Array( this.numGroups ) ].map(
				( _ ) => new SequentialMapGroup( p )
			);
		lazy$1( this, `groups`, getter );
	}
	supports( charCode ) {
		if ( charCode.charCodeAt ) charCode = charCode.charCodeAt( 0 );
		if ( 55296 <= charCode && charCode <= 57343 ) return 0;
		if ( ( charCode & 65534 ) === 65534 || ( charCode & 65535 ) === 65535 )
			return 0;
		return (
			this.groups.findIndex(
				( s ) =>
					s.startCharCode <= charCode && charCode <= s.endCharCode
			) !== -1
		);
	}
	reverse( glyphID ) {
		for ( let group of this.groups ) {
			let start = group.startGlyphID;
			if ( start > glyphID ) continue;
			if ( start === glyphID ) return group.startCharCode;
			let end = start + ( group.endCharCode - group.startCharCode );
			if ( end < glyphID ) continue;
			const code = group.startCharCode + ( glyphID - start );
			return { code: code, unicode: String.fromCodePoint( code ) };
		}
		return {};
	}
	getSupportedCharCodes( preservePropNames = false ) {
		if ( preservePropNames ) return this.groups;
		return this.groups.map( ( v ) => ( {
			start: v.startCharCode,
			end: v.endCharCode,
		} ) );
	}
}
class SequentialMapGroup {
	constructor( p ) {
		this.startCharCode = p.uint32;
		this.endCharCode = p.uint32;
		this.startGlyphID = p.uint32;
	}
}
class Format13 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.format = 13;
		p.uint16;
		this.length = p.uint32;
		this.language = p.uint32;
		this.numGroups = p.uint32;
		const getter = [ ...new Array( this.numGroups ) ].map(
			( _ ) => new ConstantMapGroup( p )
		);
		lazy$1( this, `groups`, getter );
	}
	supports( charCode ) {
		if ( charCode.charCodeAt ) charCode = charCode.charCodeAt( 0 );
		return (
			this.groups.findIndex(
				( s ) =>
					s.startCharCode <= charCode && charCode <= s.endCharCode
			) !== -1
		);
	}
	reverse( glyphID ) {
		console.warn( `reverse not implemented for cmap subtable format 13` );
		return {};
	}
	getSupportedCharCodes( preservePropNames = false ) {
		if ( preservePropNames ) return this.groups;
		return this.groups.map( ( v ) => ( {
			start: v.startCharCode,
			end: v.endCharCode,
		} ) );
	}
}
class ConstantMapGroup {
	constructor( p ) {
		this.startCharCode = p.uint32;
		this.endCharCode = p.uint32;
		this.glyphID = p.uint32;
	}
}
class Format14 extends Subtable {
	constructor( p, platformID, encodingID ) {
		super( p, platformID, encodingID );
		this.subTableStart = p.currentPosition;
		this.format = 14;
		this.length = p.uint32;
		this.numVarSelectorRecords = p.uint32;
		lazy$1( this, `varSelectors`, () =>
			[ ...new Array( this.numVarSelectorRecords ) ].map(
				( _ ) => new VariationSelector( p )
			)
		);
	}
	supports() {
		console.warn( `supports not implemented for cmap subtable format 14` );
		return 0;
	}
	getSupportedCharCodes() {
		console.warn(
			`getSupportedCharCodes not implemented for cmap subtable format 14`
		);
		return [];
	}
	reverse( glyphID ) {
		console.warn( `reverse not implemented for cmap subtable format 14` );
		return {};
	}
	supportsVariation( variation ) {
		let v = this.varSelector.find(
			( uvs ) => uvs.varSelector === variation
		);
		return v ? v : false;
	}
	getSupportedVariations() {
		return this.varSelectors.map( ( v ) => v.varSelector );
	}
}
class VariationSelector {
	constructor( p ) {
		this.varSelector = p.uint24;
		this.defaultUVSOffset = p.Offset32;
		this.nonDefaultUVSOffset = p.Offset32;
	}
}
function createSubTable( parser, platformID, encodingID ) {
	const format = parser.uint16;
	if ( format === 0 ) return new Format0( parser, platformID, encodingID );
	if ( format === 2 ) return new Format2( parser, platformID, encodingID );
	if ( format === 4 ) return new Format4( parser, platformID, encodingID );
	if ( format === 6 ) return new Format6( parser, platformID, encodingID );
	if ( format === 8 ) return new Format8( parser, platformID, encodingID );
	if ( format === 10 ) return new Format10( parser, platformID, encodingID );
	if ( format === 12 ) return new Format12( parser, platformID, encodingID );
	if ( format === 13 ) return new Format13( parser, platformID, encodingID );
	if ( format === 14 ) return new Format14( parser, platformID, encodingID );
	return {};
}
class cmap extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.numTables = p.uint16;
		this.encodingRecords = [ ...new Array( this.numTables ) ].map(
			( _ ) => new EncodingRecord( p, this.tableStart )
		);
	}
	getSubTable( tableID ) {
		return this.encodingRecords[ tableID ].table;
	}
	getSupportedEncodings() {
		return this.encodingRecords.map( ( r ) => ( {
			platformID: r.platformID,
			encodingId: r.encodingID,
		} ) );
	}
	getSupportedCharCodes( platformID, encodingID ) {
		const recordID = this.encodingRecords.findIndex(
			( r ) => r.platformID === platformID && r.encodingID === encodingID
		);
		if ( recordID === -1 ) return false;
		const subtable = this.getSubTable( recordID );
		return subtable.getSupportedCharCodes();
	}
	reverse( glyphid ) {
		for ( let i = 0; i < this.numTables; i++ ) {
			let code = this.getSubTable( i ).reverse( glyphid );
			if ( code ) return code;
		}
	}
	getGlyphId( char ) {
		let last = 0;
		this.encodingRecords.some( ( _, tableID ) => {
			let t = this.getSubTable( tableID );
			if ( ! t.getGlyphId ) return false;
			last = t.getGlyphId( char );
			return last !== 0;
		} );
		return last;
	}
	supports( char ) {
		return this.encodingRecords.some( ( _, tableID ) => {
			const t = this.getSubTable( tableID );
			return t.supports && t.supports( char ) !== false;
		} );
	}
	supportsVariation( variation ) {
		return this.encodingRecords.some( ( _, tableID ) => {
			const t = this.getSubTable( tableID );
			return (
				t.supportsVariation &&
				t.supportsVariation( variation ) !== false
			);
		} );
	}
}
class EncodingRecord {
	constructor( p, tableStart ) {
		const platformID = ( this.platformID = p.uint16 );
		const encodingID = ( this.encodingID = p.uint16 );
		const offset = ( this.offset = p.Offset32 );
		lazy$1( this, `table`, () => {
			p.currentPosition = tableStart + offset;
			return createSubTable( p, platformID, encodingID );
		} );
	}
}
var cmap$1 = Object.freeze( { __proto__: null, cmap: cmap } );
class head extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.load( {
			majorVersion: p.uint16,
			minorVersion: p.uint16,
			fontRevision: p.fixed,
			checkSumAdjustment: p.uint32,
			magicNumber: p.uint32,
			flags: p.flags( 16 ),
			unitsPerEm: p.uint16,
			created: p.longdatetime,
			modified: p.longdatetime,
			xMin: p.int16,
			yMin: p.int16,
			xMax: p.int16,
			yMax: p.int16,
			macStyle: p.flags( 16 ),
			lowestRecPPEM: p.uint16,
			fontDirectionHint: p.uint16,
			indexToLocFormat: p.uint16,
			glyphDataFormat: p.uint16,
		} );
	}
}
var head$1 = Object.freeze( { __proto__: null, head: head } );
class hhea extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.ascender = p.fword;
		this.descender = p.fword;
		this.lineGap = p.fword;
		this.advanceWidthMax = p.ufword;
		this.minLeftSideBearing = p.fword;
		this.minRightSideBearing = p.fword;
		this.xMaxExtent = p.fword;
		this.caretSlopeRise = p.int16;
		this.caretSlopeRun = p.int16;
		this.caretOffset = p.int16;
		p.int16;
		p.int16;
		p.int16;
		p.int16;
		this.metricDataFormat = p.int16;
		this.numberOfHMetrics = p.uint16;
		p.verifyLength();
	}
}
var hhea$1 = Object.freeze( { __proto__: null, hhea: hhea } );
class hmtx extends SimpleTable {
	constructor( dict, dataview, tables ) {
		const { p: p } = super( dict, dataview );
		const numberOfHMetrics = tables.hhea.numberOfHMetrics;
		const numGlyphs = tables.maxp.numGlyphs;
		const metricsStart = p.currentPosition;
		lazy$1( this, `hMetrics`, () => {
			p.currentPosition = metricsStart;
			return [ ...new Array( numberOfHMetrics ) ].map(
				( _ ) => new LongHorMetric( p.uint16, p.int16 )
			);
		} );
		if ( numberOfHMetrics < numGlyphs ) {
			const lsbStart = metricsStart + numberOfHMetrics * 4;
			lazy$1( this, `leftSideBearings`, () => {
				p.currentPosition = lsbStart;
				return [ ...new Array( numGlyphs - numberOfHMetrics ) ].map(
					( _ ) => p.int16
				);
			} );
		}
	}
}
class LongHorMetric {
	constructor( w, b ) {
		this.advanceWidth = w;
		this.lsb = b;
	}
}
var hmtx$1 = Object.freeze( { __proto__: null, hmtx: hmtx } );
class maxp extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.legacyFixed;
		this.numGlyphs = p.uint16;
		if ( this.version === 1 ) {
			this.maxPoints = p.uint16;
			this.maxContours = p.uint16;
			this.maxCompositePoints = p.uint16;
			this.maxCompositeContours = p.uint16;
			this.maxZones = p.uint16;
			this.maxTwilightPoints = p.uint16;
			this.maxStorage = p.uint16;
			this.maxFunctionDefs = p.uint16;
			this.maxInstructionDefs = p.uint16;
			this.maxStackElements = p.uint16;
			this.maxSizeOfInstructions = p.uint16;
			this.maxComponentElements = p.uint16;
			this.maxComponentDepth = p.uint16;
		}
		p.verifyLength();
	}
}
var maxp$1 = Object.freeze( { __proto__: null, maxp: maxp } );
class name extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.format = p.uint16;
		this.count = p.uint16;
		this.stringOffset = p.Offset16;
		this.nameRecords = [ ...new Array( this.count ) ].map(
			( _ ) => new NameRecord( p, this )
		);
		if ( this.format === 1 ) {
			this.langTagCount = p.uint16;
			this.langTagRecords = [ ...new Array( this.langTagCount ) ].map(
				( _ ) => new LangTagRecord( p.uint16, p.Offset16 )
			);
		}
		this.stringStart = this.tableStart + this.stringOffset;
	}
	get( nameID ) {
		let record = this.nameRecords.find(
			( record ) => record.nameID === nameID
		);
		if ( record ) return record.string;
	}
}
class LangTagRecord {
	constructor( length, offset ) {
		this.length = length;
		this.offset = offset;
	}
}
class NameRecord {
	constructor( p, nameTable ) {
		this.platformID = p.uint16;
		this.encodingID = p.uint16;
		this.languageID = p.uint16;
		this.nameID = p.uint16;
		this.length = p.uint16;
		this.offset = p.Offset16;
		lazy$1( this, `string`, () => {
			p.currentPosition = nameTable.stringStart + this.offset;
			return decodeString( p, this );
		} );
	}
}
function decodeString( p, record ) {
	const { platformID: platformID, length: length } = record;
	if ( length === 0 ) return ``;
	if ( platformID === 0 || platformID === 3 ) {
		const str = [];
		for ( let i = 0, e = length / 2; i < e; i++ )
			str[ i ] = String.fromCharCode( p.uint16 );
		return str.join( `` );
	}
	const bytes = p.readBytes( length );
	const str = [];
	bytes.forEach( function ( b, i ) {
		str[ i ] = String.fromCharCode( b );
	} );
	return str.join( `` );
}
var name$1 = Object.freeze( { __proto__: null, name: name } );
class OS2 extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.xAvgCharWidth = p.int16;
		this.usWeightClass = p.uint16;
		this.usWidthClass = p.uint16;
		this.fsType = p.uint16;
		this.ySubscriptXSize = p.int16;
		this.ySubscriptYSize = p.int16;
		this.ySubscriptXOffset = p.int16;
		this.ySubscriptYOffset = p.int16;
		this.ySuperscriptXSize = p.int16;
		this.ySuperscriptYSize = p.int16;
		this.ySuperscriptXOffset = p.int16;
		this.ySuperscriptYOffset = p.int16;
		this.yStrikeoutSize = p.int16;
		this.yStrikeoutPosition = p.int16;
		this.sFamilyClass = p.int16;
		this.panose = [ ...new Array( 10 ) ].map( ( _ ) => p.uint8 );
		this.ulUnicodeRange1 = p.flags( 32 );
		this.ulUnicodeRange2 = p.flags( 32 );
		this.ulUnicodeRange3 = p.flags( 32 );
		this.ulUnicodeRange4 = p.flags( 32 );
		this.achVendID = p.tag;
		this.fsSelection = p.uint16;
		this.usFirstCharIndex = p.uint16;
		this.usLastCharIndex = p.uint16;
		this.sTypoAscender = p.int16;
		this.sTypoDescender = p.int16;
		this.sTypoLineGap = p.int16;
		this.usWinAscent = p.uint16;
		this.usWinDescent = p.uint16;
		if ( this.version === 0 ) return p.verifyLength();
		this.ulCodePageRange1 = p.flags( 32 );
		this.ulCodePageRange2 = p.flags( 32 );
		if ( this.version === 1 ) return p.verifyLength();
		this.sxHeight = p.int16;
		this.sCapHeight = p.int16;
		this.usDefaultChar = p.uint16;
		this.usBreakChar = p.uint16;
		this.usMaxContext = p.uint16;
		if ( this.version <= 4 ) return p.verifyLength();
		this.usLowerOpticalPointSize = p.uint16;
		this.usUpperOpticalPointSize = p.uint16;
		if ( this.version === 5 ) return p.verifyLength();
	}
}
var OS2$1 = Object.freeze( { __proto__: null, OS2: OS2 } );
class post extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.legacyFixed;
		this.italicAngle = p.fixed;
		this.underlinePosition = p.fword;
		this.underlineThickness = p.fword;
		this.isFixedPitch = p.uint32;
		this.minMemType42 = p.uint32;
		this.maxMemType42 = p.uint32;
		this.minMemType1 = p.uint32;
		this.maxMemType1 = p.uint32;
		if ( this.version === 1 || this.version === 3 ) return p.verifyLength();
		this.numGlyphs = p.uint16;
		if ( this.version === 2 ) {
			this.glyphNameIndex = [ ...new Array( this.numGlyphs ) ].map(
				( _ ) => p.uint16
			);
			this.namesOffset = p.currentPosition;
			this.glyphNameOffsets = [ 1 ];
			for ( let i = 0; i < this.numGlyphs; i++ ) {
				let index = this.glyphNameIndex[ i ];
				if ( index < macStrings.length ) {
					this.glyphNameOffsets.push( this.glyphNameOffsets[ i ] );
					continue;
				}
				let bytelength = p.int8;
				p.skip( bytelength );
				this.glyphNameOffsets.push(
					this.glyphNameOffsets[ i ] + bytelength + 1
				);
			}
		}
		if ( this.version === 2.5 ) {
			this.offset = [ ...new Array( this.numGlyphs ) ].map(
				( _ ) => p.int8
			);
		}
	}
	getGlyphName( glyphid ) {
		if ( this.version !== 2 ) {
			console.warn(
				`post table version ${ this.version } does not support glyph name lookups`
			);
			return ``;
		}
		let index = this.glyphNameIndex[ glyphid ];
		if ( index < 258 ) return macStrings[ index ];
		let offset = this.glyphNameOffsets[ glyphid ];
		let next = this.glyphNameOffsets[ glyphid + 1 ];
		let len = next - offset - 1;
		if ( len === 0 ) return `.notdef.`;
		this.parser.currentPosition = this.namesOffset + offset;
		const data = this.parser.readBytes(
			len,
			this.namesOffset + offset,
			8,
			true
		);
		return data.map( ( b ) => String.fromCharCode( b ) ).join( `` );
	}
}
const macStrings = [
	`.notdef`,
	`.null`,
	`nonmarkingreturn`,
	`space`,
	`exclam`,
	`quotedbl`,
	`numbersign`,
	`dollar`,
	`percent`,
	`ampersand`,
	`quotesingle`,
	`parenleft`,
	`parenright`,
	`asterisk`,
	`plus`,
	`comma`,
	`hyphen`,
	`period`,
	`slash`,
	`zero`,
	`one`,
	`two`,
	`three`,
	`four`,
	`five`,
	`six`,
	`seven`,
	`eight`,
	`nine`,
	`colon`,
	`semicolon`,
	`less`,
	`equal`,
	`greater`,
	`question`,
	`at`,
	`A`,
	`B`,
	`C`,
	`D`,
	`E`,
	`F`,
	`G`,
	`H`,
	`I`,
	`J`,
	`K`,
	`L`,
	`M`,
	`N`,
	`O`,
	`P`,
	`Q`,
	`R`,
	`S`,
	`T`,
	`U`,
	`V`,
	`W`,
	`X`,
	`Y`,
	`Z`,
	`bracketleft`,
	`backslash`,
	`bracketright`,
	`asciicircum`,
	`underscore`,
	`grave`,
	`a`,
	`b`,
	`c`,
	`d`,
	`e`,
	`f`,
	`g`,
	`h`,
	`i`,
	`j`,
	`k`,
	`l`,
	`m`,
	`n`,
	`o`,
	`p`,
	`q`,
	`r`,
	`s`,
	`t`,
	`u`,
	`v`,
	`w`,
	`x`,
	`y`,
	`z`,
	`braceleft`,
	`bar`,
	`braceright`,
	`asciitilde`,
	`Adieresis`,
	`Aring`,
	`Ccedilla`,
	`Eacute`,
	`Ntilde`,
	`Odieresis`,
	`Udieresis`,
	`aacute`,
	`agrave`,
	`acircumflex`,
	`adieresis`,
	`atilde`,
	`aring`,
	`ccedilla`,
	`eacute`,
	`egrave`,
	`ecircumflex`,
	`edieresis`,
	`iacute`,
	`igrave`,
	`icircumflex`,
	`idieresis`,
	`ntilde`,
	`oacute`,
	`ograve`,
	`ocircumflex`,
	`odieresis`,
	`otilde`,
	`uacute`,
	`ugrave`,
	`ucircumflex`,
	`udieresis`,
	`dagger`,
	`degree`,
	`cent`,
	`sterling`,
	`section`,
	`bullet`,
	`paragraph`,
	`germandbls`,
	`registered`,
	`copyright`,
	`trademark`,
	`acute`,
	`dieresis`,
	`notequal`,
	`AE`,
	`Oslash`,
	`infinity`,
	`plusminus`,
	`lessequal`,
	`greaterequal`,
	`yen`,
	`mu`,
	`partialdiff`,
	`summation`,
	`product`,
	`pi`,
	`integral`,
	`ordfeminine`,
	`ordmasculine`,
	`Omega`,
	`ae`,
	`oslash`,
	`questiondown`,
	`exclamdown`,
	`logicalnot`,
	`radical`,
	`florin`,
	`approxequal`,
	`Delta`,
	`guillemotleft`,
	`guillemotright`,
	`ellipsis`,
	`nonbreakingspace`,
	`Agrave`,
	`Atilde`,
	`Otilde`,
	`OE`,
	`oe`,
	`endash`,
	`emdash`,
	`quotedblleft`,
	`quotedblright`,
	`quoteleft`,
	`quoteright`,
	`divide`,
	`lozenge`,
	`ydieresis`,
	`Ydieresis`,
	`fraction`,
	`currency`,
	`guilsinglleft`,
	`guilsinglright`,
	`fi`,
	`fl`,
	`daggerdbl`,
	`periodcentered`,
	`quotesinglbase`,
	`quotedblbase`,
	`perthousand`,
	`Acircumflex`,
	`Ecircumflex`,
	`Aacute`,
	`Edieresis`,
	`Egrave`,
	`Iacute`,
	`Icircumflex`,
	`Idieresis`,
	`Igrave`,
	`Oacute`,
	`Ocircumflex`,
	`apple`,
	`Ograve`,
	`Uacute`,
	`Ucircumflex`,
	`Ugrave`,
	`dotlessi`,
	`circumflex`,
	`tilde`,
	`macron`,
	`breve`,
	`dotaccent`,
	`ring`,
	`cedilla`,
	`hungarumlaut`,
	`ogonek`,
	`caron`,
	`Lslash`,
	`lslash`,
	`Scaron`,
	`scaron`,
	`Zcaron`,
	`zcaron`,
	`brokenbar`,
	`Eth`,
	`eth`,
	`Yacute`,
	`yacute`,
	`Thorn`,
	`thorn`,
	`minus`,
	`multiply`,
	`onesuperior`,
	`twosuperior`,
	`threesuperior`,
	`onehalf`,
	`onequarter`,
	`threequarters`,
	`franc`,
	`Gbreve`,
	`gbreve`,
	`Idotaccent`,
	`Scedilla`,
	`scedilla`,
	`Cacute`,
	`cacute`,
	`Ccaron`,
	`ccaron`,
	`dcroat`,
];
var post$1 = Object.freeze( { __proto__: null, post: post } );
class BASE extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.horizAxisOffset = p.Offset16;
		this.vertAxisOffset = p.Offset16;
		lazy$1(
			this,
			`horizAxis`,
			() =>
				new AxisTable(
					{ offset: dict.offset + this.horizAxisOffset },
					dataview
				)
		);
		lazy$1(
			this,
			`vertAxis`,
			() =>
				new AxisTable(
					{ offset: dict.offset + this.vertAxisOffset },
					dataview
				)
		);
		if ( this.majorVersion === 1 && this.minorVersion === 1 ) {
			this.itemVarStoreOffset = p.Offset32;
			lazy$1(
				this,
				`itemVarStore`,
				() =>
					new AxisTable(
						{ offset: dict.offset + this.itemVarStoreOffset },
						dataview
					)
			);
		}
	}
}
class AxisTable extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview, `AxisTable` );
		this.baseTagListOffset = p.Offset16;
		this.baseScriptListOffset = p.Offset16;
		lazy$1(
			this,
			`baseTagList`,
			() =>
				new BaseTagListTable(
					{ offset: dict.offset + this.baseTagListOffset },
					dataview
				)
		);
		lazy$1(
			this,
			`baseScriptList`,
			() =>
				new BaseScriptListTable(
					{ offset: dict.offset + this.baseScriptListOffset },
					dataview
				)
		);
	}
}
class BaseTagListTable extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview, `BaseTagListTable` );
		this.baseTagCount = p.uint16;
		this.baselineTags = [ ...new Array( this.baseTagCount ) ].map(
			( _ ) => p.tag
		);
	}
}
class BaseScriptListTable extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview, `BaseScriptListTable` );
		this.baseScriptCount = p.uint16;
		const recordStart = p.currentPosition;
		lazy$1( this, `baseScriptRecords`, () => {
			p.currentPosition = recordStart;
			return [ ...new Array( this.baseScriptCount ) ].map(
				( _ ) => new BaseScriptRecord( this.start, p )
			);
		} );
	}
}
class BaseScriptRecord {
	constructor( baseScriptListTableStart, p ) {
		this.baseScriptTag = p.tag;
		this.baseScriptOffset = p.Offset16;
		lazy$1( this, `baseScriptTable`, () => {
			p.currentPosition =
				baseScriptListTableStart + this.baseScriptOffset;
			return new BaseScriptTable( p );
		} );
	}
}
class BaseScriptTable {
	constructor( p ) {
		this.start = p.currentPosition;
		this.baseValuesOffset = p.Offset16;
		this.defaultMinMaxOffset = p.Offset16;
		this.baseLangSysCount = p.uint16;
		this.baseLangSysRecords = [ ...new Array( this.baseLangSysCount ) ].map(
			( _ ) => new BaseLangSysRecord( this.start, p )
		);
		lazy$1( this, `baseValues`, () => {
			p.currentPosition = this.start + this.baseValuesOffset;
			return new BaseValuesTable( p );
		} );
		lazy$1( this, `defaultMinMax`, () => {
			p.currentPosition = this.start + this.defaultMinMaxOffset;
			return new MinMaxTable( p );
		} );
	}
}
class BaseLangSysRecord {
	constructor( baseScriptTableStart, p ) {
		this.baseLangSysTag = p.tag;
		this.minMaxOffset = p.Offset16;
		lazy$1( this, `minMax`, () => {
			p.currentPosition = baseScriptTableStart + this.minMaxOffset;
			return new MinMaxTable( p );
		} );
	}
}
class BaseValuesTable {
	constructor( p ) {
		this.parser = p;
		this.start = p.currentPosition;
		this.defaultBaselineIndex = p.uint16;
		this.baseCoordCount = p.uint16;
		this.baseCoords = [ ...new Array( this.baseCoordCount ) ].map(
			( _ ) => p.Offset16
		);
	}
	getTable( id ) {
		this.parser.currentPosition = this.start + this.baseCoords[ id ];
		return new BaseCoordTable( this.parser );
	}
}
class MinMaxTable {
	constructor( p ) {
		this.minCoord = p.Offset16;
		this.maxCoord = p.Offset16;
		this.featMinMaxCount = p.uint16;
		const recordStart = p.currentPosition;
		lazy$1( this, `featMinMaxRecords`, () => {
			p.currentPosition = recordStart;
			return [ ...new Array( this.featMinMaxCount ) ].map(
				( _ ) => new FeatMinMaxRecord( p )
			);
		} );
	}
}
class FeatMinMaxRecord {
	constructor( p ) {
		this.featureTableTag = p.tag;
		this.minCoord = p.Offset16;
		this.maxCoord = p.Offset16;
	}
}
class BaseCoordTable {
	constructor( p ) {
		this.baseCoordFormat = p.uint16;
		this.coordinate = p.int16;
		if ( this.baseCoordFormat === 2 ) {
			this.referenceGlyph = p.uint16;
			this.baseCoordPoint = p.uint16;
		}
		if ( this.baseCoordFormat === 3 ) {
			this.deviceTable = p.Offset16;
		}
	}
}
var BASE$1 = Object.freeze( { __proto__: null, BASE: BASE } );
class ClassDefinition {
	constructor( p ) {
		this.classFormat = p.uint16;
		if ( this.classFormat === 1 ) {
			this.startGlyphID = p.uint16;
			this.glyphCount = p.uint16;
			this.classValueArray = [ ...new Array( this.glyphCount ) ].map(
				( _ ) => p.uint16
			);
		}
		if ( this.classFormat === 2 ) {
			this.classRangeCount = p.uint16;
			this.classRangeRecords = [
				...new Array( this.classRangeCount ),
			].map( ( _ ) => new ClassRangeRecord( p ) );
		}
	}
}
class ClassRangeRecord {
	constructor( p ) {
		this.startGlyphID = p.uint16;
		this.endGlyphID = p.uint16;
		this.class = p.uint16;
	}
}
class CoverageTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.coverageFormat = p.uint16;
		if ( this.coverageFormat === 1 ) {
			this.glyphCount = p.uint16;
			this.glyphArray = [ ...new Array( this.glyphCount ) ].map(
				( _ ) => p.uint16
			);
		}
		if ( this.coverageFormat === 2 ) {
			this.rangeCount = p.uint16;
			this.rangeRecords = [ ...new Array( this.rangeCount ) ].map(
				( _ ) => new CoverageRangeRecord( p )
			);
		}
	}
}
class CoverageRangeRecord {
	constructor( p ) {
		this.startGlyphID = p.uint16;
		this.endGlyphID = p.uint16;
		this.startCoverageIndex = p.uint16;
	}
}
class ItemVariationStoreTable {
	constructor( table, p ) {
		this.table = table;
		this.parser = p;
		this.start = p.currentPosition;
		this.format = p.uint16;
		this.variationRegionListOffset = p.Offset32;
		this.itemVariationDataCount = p.uint16;
		this.itemVariationDataOffsets = [
			...new Array( this.itemVariationDataCount ),
		].map( ( _ ) => p.Offset32 );
	}
}
class GDEF extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.glyphClassDefOffset = p.Offset16;
		lazy$1( this, `glyphClassDefs`, () => {
			if ( this.glyphClassDefOffset === 0 ) return undefined;
			p.currentPosition = this.tableStart + this.glyphClassDefOffset;
			return new ClassDefinition( p );
		} );
		this.attachListOffset = p.Offset16;
		lazy$1( this, `attachList`, () => {
			if ( this.attachListOffset === 0 ) return undefined;
			p.currentPosition = this.tableStart + this.attachListOffset;
			return new AttachList( p );
		} );
		this.ligCaretListOffset = p.Offset16;
		lazy$1( this, `ligCaretList`, () => {
			if ( this.ligCaretListOffset === 0 ) return undefined;
			p.currentPosition = this.tableStart + this.ligCaretListOffset;
			return new LigCaretList( p );
		} );
		this.markAttachClassDefOffset = p.Offset16;
		lazy$1( this, `markAttachClassDef`, () => {
			if ( this.markAttachClassDefOffset === 0 ) return undefined;
			p.currentPosition = this.tableStart + this.markAttachClassDefOffset;
			return new ClassDefinition( p );
		} );
		if ( this.minorVersion >= 2 ) {
			this.markGlyphSetsDefOffset = p.Offset16;
			lazy$1( this, `markGlyphSetsDef`, () => {
				if ( this.markGlyphSetsDefOffset === 0 ) return undefined;
				p.currentPosition =
					this.tableStart + this.markGlyphSetsDefOffset;
				return new MarkGlyphSetsTable( p );
			} );
		}
		if ( this.minorVersion === 3 ) {
			this.itemVarStoreOffset = p.Offset32;
			lazy$1( this, `itemVarStore`, () => {
				if ( this.itemVarStoreOffset === 0 ) return undefined;
				p.currentPosition = this.tableStart + this.itemVarStoreOffset;
				return new ItemVariationStoreTable( p );
			} );
		}
	}
}
class AttachList extends ParsedData {
	constructor( p ) {
		super( p );
		this.coverageOffset = p.Offset16;
		this.glyphCount = p.uint16;
		this.attachPointOffsets = [ ...new Array( this.glyphCount ) ].map(
			( _ ) => p.Offset16
		);
	}
	getPoint( pointID ) {
		this.parser.currentPosition =
			this.start + this.attachPointOffsets[ pointID ];
		return new AttachPoint( this.parser );
	}
}
class AttachPoint {
	constructor( p ) {
		this.pointCount = p.uint16;
		this.pointIndices = [ ...new Array( this.pointCount ) ].map(
			( _ ) => p.uint16
		);
	}
}
class LigCaretList extends ParsedData {
	constructor( p ) {
		super( p );
		this.coverageOffset = p.Offset16;
		lazy$1( this, `coverage`, () => {
			p.currentPosition = this.start + this.coverageOffset;
			return new CoverageTable( p );
		} );
		this.ligGlyphCount = p.uint16;
		this.ligGlyphOffsets = [ ...new Array( this.ligGlyphCount ) ].map(
			( _ ) => p.Offset16
		);
	}
	getLigGlyph( ligGlyphID ) {
		this.parser.currentPosition =
			this.start + this.ligGlyphOffsets[ ligGlyphID ];
		return new LigGlyph( this.parser );
	}
}
class LigGlyph extends ParsedData {
	constructor( p ) {
		super( p );
		this.caretCount = p.uint16;
		this.caretValueOffsets = [ ...new Array( this.caretCount ) ].map(
			( _ ) => p.Offset16
		);
	}
	getCaretValue( caretID ) {
		this.parser.currentPosition =
			this.start + this.caretValueOffsets[ caretID ];
		return new CaretValue( this.parser );
	}
}
class CaretValue {
	constructor( p ) {
		this.caretValueFormat = p.uint16;
		if ( this.caretValueFormat === 1 ) {
			this.coordinate = p.int16;
		}
		if ( this.caretValueFormat === 2 ) {
			this.caretValuePointIndex = p.uint16;
		}
		if ( this.caretValueFormat === 3 ) {
			this.coordinate = p.int16;
			this.deviceOffset = p.Offset16;
		}
	}
}
class MarkGlyphSetsTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.markGlyphSetTableFormat = p.uint16;
		this.markGlyphSetCount = p.uint16;
		this.coverageOffsets = [ ...new Array( this.markGlyphSetCount ) ].map(
			( _ ) => p.Offset32
		);
	}
	getMarkGlyphSet( markGlyphSetID ) {
		this.parser.currentPosition =
			this.start + this.coverageOffsets[ markGlyphSetID ];
		return new CoverageTable( this.parser );
	}
}
var GDEF$1 = Object.freeze( { __proto__: null, GDEF: GDEF } );
class ScriptList extends ParsedData {
	static EMPTY = { scriptCount: 0, scriptRecords: [] };
	constructor( p ) {
		super( p );
		this.scriptCount = p.uint16;
		this.scriptRecords = [ ...new Array( this.scriptCount ) ].map(
			( _ ) => new ScriptRecord( p )
		);
	}
}
class ScriptRecord {
	constructor( p ) {
		this.scriptTag = p.tag;
		this.scriptOffset = p.Offset16;
	}
}
class ScriptTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.defaultLangSys = p.Offset16;
		this.langSysCount = p.uint16;
		this.langSysRecords = [ ...new Array( this.langSysCount ) ].map(
			( _ ) => new LangSysRecord( p )
		);
	}
}
class LangSysRecord {
	constructor( p ) {
		this.langSysTag = p.tag;
		this.langSysOffset = p.Offset16;
	}
}
class LangSysTable {
	constructor( p ) {
		this.lookupOrder = p.Offset16;
		this.requiredFeatureIndex = p.uint16;
		this.featureIndexCount = p.uint16;
		this.featureIndices = [ ...new Array( this.featureIndexCount ) ].map(
			( _ ) => p.uint16
		);
	}
}
class FeatureList extends ParsedData {
	static EMPTY = { featureCount: 0, featureRecords: [] };
	constructor( p ) {
		super( p );
		this.featureCount = p.uint16;
		this.featureRecords = [ ...new Array( this.featureCount ) ].map(
			( _ ) => new FeatureRecord( p )
		);
	}
}
class FeatureRecord {
	constructor( p ) {
		this.featureTag = p.tag;
		this.featureOffset = p.Offset16;
	}
}
class FeatureTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.featureParams = p.Offset16;
		this.lookupIndexCount = p.uint16;
		this.lookupListIndices = [ ...new Array( this.lookupIndexCount ) ].map(
			( _ ) => p.uint16
		);
	}
	getFeatureParams() {
		if ( this.featureParams > 0 ) {
			const p = this.parser;
			p.currentPosition = this.start + this.featureParams;
			const tag = this.featureTag;
			if ( tag === `size` ) return new Size( p );
			if ( tag.startsWith( `cc` ) ) return new CharacterVariant( p );
			if ( tag.startsWith( `ss` ) ) return new StylisticSet( p );
		}
	}
}
class CharacterVariant {
	constructor( p ) {
		this.format = p.uint16;
		this.featUiLabelNameId = p.uint16;
		this.featUiTooltipTextNameId = p.uint16;
		this.sampleTextNameId = p.uint16;
		this.numNamedParameters = p.uint16;
		this.firstParamUiLabelNameId = p.uint16;
		this.charCount = p.uint16;
		this.character = [ ...new Array( this.charCount ) ].map(
			( _ ) => p.uint24
		);
	}
}
class Size {
	constructor( p ) {
		this.designSize = p.uint16;
		this.subfamilyIdentifier = p.uint16;
		this.subfamilyNameID = p.uint16;
		this.smallEnd = p.uint16;
		this.largeEnd = p.uint16;
	}
}
class StylisticSet {
	constructor( p ) {
		this.version = p.uint16;
		this.UINameID = p.uint16;
	}
}
function undoCoverageOffsetParsing( instance ) {
	instance.parser.currentPosition -= 2;
	delete instance.coverageOffset;
	delete instance.getCoverageTable;
}
class LookupType$1 extends ParsedData {
	constructor( p ) {
		super( p );
		this.substFormat = p.uint16;
		this.coverageOffset = p.Offset16;
	}
	getCoverageTable() {
		let p = this.parser;
		p.currentPosition = this.start + this.coverageOffset;
		return new CoverageTable( p );
	}
}
class SubstLookupRecord {
	constructor( p ) {
		this.glyphSequenceIndex = p.uint16;
		this.lookupListIndex = p.uint16;
	}
}
class LookupType1$1 extends LookupType$1 {
	constructor( p ) {
		super( p );
		this.deltaGlyphID = p.int16;
	}
}
class LookupType2$1 extends LookupType$1 {
	constructor( p ) {
		super( p );
		this.sequenceCount = p.uint16;
		this.sequenceOffsets = [ ...new Array( this.sequenceCount ) ].map(
			( _ ) => p.Offset16
		);
	}
	getSequence( index ) {
		let p = this.parser;
		p.currentPosition = this.start + this.sequenceOffsets[ index ];
		return new SequenceTable( p );
	}
}
class SequenceTable {
	constructor( p ) {
		this.glyphCount = p.uint16;
		this.substituteGlyphIDs = [ ...new Array( this.glyphCount ) ].map(
			( _ ) => p.uint16
		);
	}
}
class LookupType3$1 extends LookupType$1 {
	constructor( p ) {
		super( p );
		this.alternateSetCount = p.uint16;
		this.alternateSetOffsets = [
			...new Array( this.alternateSetCount ),
		].map( ( _ ) => p.Offset16 );
	}
	getAlternateSet( index ) {
		let p = this.parser;
		p.currentPosition = this.start + this.alternateSetOffsets[ index ];
		return new AlternateSetTable( p );
	}
}
class AlternateSetTable {
	constructor( p ) {
		this.glyphCount = p.uint16;
		this.alternateGlyphIDs = [ ...new Array( this.glyphCount ) ].map(
			( _ ) => p.uint16
		);
	}
}
class LookupType4$1 extends LookupType$1 {
	constructor( p ) {
		super( p );
		this.ligatureSetCount = p.uint16;
		this.ligatureSetOffsets = [ ...new Array( this.ligatureSetCount ) ].map(
			( _ ) => p.Offset16
		);
	}
	getLigatureSet( index ) {
		let p = this.parser;
		p.currentPosition = this.start + this.ligatureSetOffsets[ index ];
		return new LigatureSetTable( p );
	}
}
class LigatureSetTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.ligatureCount = p.uint16;
		this.ligatureOffsets = [ ...new Array( this.ligatureCount ) ].map(
			( _ ) => p.Offset16
		);
	}
	getLigature( index ) {
		let p = this.parser;
		p.currentPosition = this.start + this.ligatureOffsets[ index ];
		return new LigatureTable( p );
	}
}
class LigatureTable {
	constructor( p ) {
		this.ligatureGlyph = p.uint16;
		this.componentCount = p.uint16;
		this.componentGlyphIDs = [
			...new Array( this.componentCount - 1 ),
		].map( ( _ ) => p.uint16 );
	}
}
class LookupType5$1 extends LookupType$1 {
	constructor( p ) {
		super( p );
		if ( this.substFormat === 1 ) {
			this.subRuleSetCount = p.uint16;
			this.subRuleSetOffsets = [
				...new Array( this.subRuleSetCount ),
			].map( ( _ ) => p.Offset16 );
		}
		if ( this.substFormat === 2 ) {
			this.classDefOffset = p.Offset16;
			this.subClassSetCount = p.uint16;
			this.subClassSetOffsets = [
				...new Array( this.subClassSetCount ),
			].map( ( _ ) => p.Offset16 );
		}
		if ( this.substFormat === 3 ) {
			undoCoverageOffsetParsing( this );
			this.glyphCount = p.uint16;
			this.substitutionCount = p.uint16;
			this.coverageOffsets = [ ...new Array( this.glyphCount ) ].map(
				( _ ) => p.Offset16
			);
			this.substLookupRecords = [
				...new Array( this.substitutionCount ),
			].map( ( _ ) => new SubstLookupRecord( p ) );
		}
	}
	getSubRuleSet( index ) {
		if ( this.substFormat !== 1 )
			throw new Error(
				`lookup type 5.${ this.substFormat } has no subrule sets.`
			);
		let p = this.parser;
		p.currentPosition = this.start + this.subRuleSetOffsets[ index ];
		return new SubRuleSetTable( p );
	}
	getSubClassSet( index ) {
		if ( this.substFormat !== 2 )
			throw new Error(
				`lookup type 5.${ this.substFormat } has no subclass sets.`
			);
		let p = this.parser;
		p.currentPosition = this.start + this.subClassSetOffsets[ index ];
		return new SubClassSetTable( p );
	}
	getCoverageTable( index ) {
		if ( this.substFormat !== 3 && ! index )
			return super.getCoverageTable();
		if ( ! index )
			throw new Error(
				`lookup type 5.${ this.substFormat } requires an coverage table index.`
			);
		let p = this.parser;
		p.currentPosition = this.start + this.coverageOffsets[ index ];
		return new CoverageTable( p );
	}
}
class SubRuleSetTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.subRuleCount = p.uint16;
		this.subRuleOffsets = [ ...new Array( this.subRuleCount ) ].map(
			( _ ) => p.Offset16
		);
	}
	getSubRule( index ) {
		let p = this.parser;
		p.currentPosition = this.start + this.subRuleOffsets[ index ];
		return new SubRuleTable( p );
	}
}
class SubRuleTable {
	constructor( p ) {
		this.glyphCount = p.uint16;
		this.substitutionCount = p.uint16;
		this.inputSequence = [ ...new Array( this.glyphCount - 1 ) ].map(
			( _ ) => p.uint16
		);
		this.substLookupRecords = [
			...new Array( this.substitutionCount ),
		].map( ( _ ) => new SubstLookupRecord( p ) );
	}
}
class SubClassSetTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.subClassRuleCount = p.uint16;
		this.subClassRuleOffsets = [
			...new Array( this.subClassRuleCount ),
		].map( ( _ ) => p.Offset16 );
	}
	getSubClass( index ) {
		let p = this.parser;
		p.currentPosition = this.start + this.subClassRuleOffsets[ index ];
		return new SubClassRuleTable( p );
	}
}
class SubClassRuleTable extends SubRuleTable {
	constructor( p ) {
		super( p );
	}
}
class LookupType6$1 extends LookupType$1 {
	constructor( p ) {
		super( p );
		if ( this.substFormat === 1 ) {
			this.chainSubRuleSetCount = p.uint16;
			this.chainSubRuleSetOffsets = [
				...new Array( this.chainSubRuleSetCount ),
			].map( ( _ ) => p.Offset16 );
		}
		if ( this.substFormat === 2 ) {
			this.backtrackClassDefOffset = p.Offset16;
			this.inputClassDefOffset = p.Offset16;
			this.lookaheadClassDefOffset = p.Offset16;
			this.chainSubClassSetCount = p.uint16;
			this.chainSubClassSetOffsets = [
				...new Array( this.chainSubClassSetCount ),
			].map( ( _ ) => p.Offset16 );
		}
		if ( this.substFormat === 3 ) {
			undoCoverageOffsetParsing( this );
			this.backtrackGlyphCount = p.uint16;
			this.backtrackCoverageOffsets = [
				...new Array( this.backtrackGlyphCount ),
			].map( ( _ ) => p.Offset16 );
			this.inputGlyphCount = p.uint16;
			this.inputCoverageOffsets = [
				...new Array( this.inputGlyphCount ),
			].map( ( _ ) => p.Offset16 );
			this.lookaheadGlyphCount = p.uint16;
			this.lookaheadCoverageOffsets = [
				...new Array( this.lookaheadGlyphCount ),
			].map( ( _ ) => p.Offset16 );
			this.seqLookupCount = p.uint16;
			this.seqLookupRecords = [
				...new Array( this.substitutionCount ),
			].map( ( _ ) => new SequenceLookupRecord( p ) );
		}
	}
	getChainSubRuleSet( index ) {
		if ( this.substFormat !== 1 )
			throw new Error(
				`lookup type 6.${ this.substFormat } has no chainsubrule sets.`
			);
		let p = this.parser;
		p.currentPosition = this.start + this.chainSubRuleSetOffsets[ index ];
		return new ChainSubRuleSetTable( p );
	}
	getChainSubClassSet( index ) {
		if ( this.substFormat !== 2 )
			throw new Error(
				`lookup type 6.${ this.substFormat } has no chainsubclass sets.`
			);
		let p = this.parser;
		p.currentPosition = this.start + this.chainSubClassSetOffsets[ index ];
		return new ChainSubClassSetTable( p );
	}
	getCoverageFromOffset( offset ) {
		if ( this.substFormat !== 3 )
			throw new Error(
				`lookup type 6.${ this.substFormat } does not use contextual coverage offsets.`
			);
		let p = this.parser;
		p.currentPosition = this.start + offset;
		return new CoverageTable( p );
	}
}
class ChainSubRuleSetTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.chainSubRuleCount = p.uint16;
		this.chainSubRuleOffsets = [
			...new Array( this.chainSubRuleCount ),
		].map( ( _ ) => p.Offset16 );
	}
	getSubRule( index ) {
		let p = this.parser;
		p.currentPosition = this.start + this.chainSubRuleOffsets[ index ];
		return new ChainSubRuleTable( p );
	}
}
class ChainSubRuleTable {
	constructor( p ) {
		this.backtrackGlyphCount = p.uint16;
		this.backtrackSequence = [
			...new Array( this.backtrackGlyphCount ),
		].map( ( _ ) => p.uint16 );
		this.inputGlyphCount = p.uint16;
		this.inputSequence = [ ...new Array( this.inputGlyphCount - 1 ) ].map(
			( _ ) => p.uint16
		);
		this.lookaheadGlyphCount = p.uint16;
		this.lookAheadSequence = [
			...new Array( this.lookAheadGlyphCount ),
		].map( ( _ ) => p.uint16 );
		this.substitutionCount = p.uint16;
		this.substLookupRecords = [ ...new Array( this.SubstCount ) ].map(
			( _ ) => new SubstLookupRecord( p )
		);
	}
}
class ChainSubClassSetTable extends ParsedData {
	constructor( p ) {
		super( p );
		this.chainSubClassRuleCount = p.uint16;
		this.chainSubClassRuleOffsets = [
			...new Array( this.chainSubClassRuleCount ),
		].map( ( _ ) => p.Offset16 );
	}
	getSubClass( index ) {
		let p = this.parser;
		p.currentPosition = this.start + this.chainSubRuleOffsets[ index ];
		return new ChainSubClassRuleTable( p );
	}
}
class ChainSubClassRuleTable {
	constructor( p ) {
		this.backtrackGlyphCount = p.uint16;
		this.backtrackSequence = [
			...new Array( this.backtrackGlyphCount ),
		].map( ( _ ) => p.uint16 );
		this.inputGlyphCount = p.uint16;
		this.inputSequence = [ ...new Array( this.inputGlyphCount - 1 ) ].map(
			( _ ) => p.uint16
		);
		this.lookaheadGlyphCount = p.uint16;
		this.lookAheadSequence = [
			...new Array( this.lookAheadGlyphCount ),
		].map( ( _ ) => p.uint16 );
		this.substitutionCount = p.uint16;
		this.substLookupRecords = [
			...new Array( this.substitutionCount ),
		].map( ( _ ) => new SequenceLookupRecord( p ) );
	}
}
class SequenceLookupRecord extends ParsedData {
	constructor( p ) {
		super( p );
		this.sequenceIndex = p.uint16;
		this.lookupListIndex = p.uint16;
	}
}
class LookupType7$1 extends ParsedData {
	constructor( p ) {
		super( p );
		this.substFormat = p.uint16;
		this.extensionLookupType = p.uint16;
		this.extensionOffset = p.Offset32;
	}
}
class LookupType8$1 extends LookupType$1 {
	constructor( p ) {
		super( p );
		this.backtrackGlyphCount = p.uint16;
		this.backtrackCoverageOffsets = [
			...new Array( this.backtrackGlyphCount ),
		].map( ( _ ) => p.Offset16 );
		this.lookaheadGlyphCount = p.uint16;
		this.lookaheadCoverageOffsets = [
			new Array( this.lookaheadGlyphCount ),
		].map( ( _ ) => p.Offset16 );
		this.glyphCount = p.uint16;
		this.substituteGlyphIDs = [ ...new Array( this.glyphCount ) ].map(
			( _ ) => p.uint16
		);
	}
}
var GSUBtables = {
	buildSubtable: function ( type, p ) {
		const subtable = new [
			undefined,
			LookupType1$1,
			LookupType2$1,
			LookupType3$1,
			LookupType4$1,
			LookupType5$1,
			LookupType6$1,
			LookupType7$1,
			LookupType8$1,
		][ type ]( p );
		subtable.type = type;
		return subtable;
	},
};
class LookupType extends ParsedData {
	constructor( p ) {
		super( p );
	}
}
class LookupType1 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 1` );
	}
}
class LookupType2 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 2` );
	}
}
class LookupType3 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 3` );
	}
}
class LookupType4 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 4` );
	}
}
class LookupType5 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 5` );
	}
}
class LookupType6 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 6` );
	}
}
class LookupType7 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 7` );
	}
}
class LookupType8 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 8` );
	}
}
class LookupType9 extends LookupType {
	constructor( p ) {
		super( p );
		console.log( `lookup type 9` );
	}
}
var GPOStables = {
	buildSubtable: function ( type, p ) {
		const subtable = new [
			undefined,
			LookupType1,
			LookupType2,
			LookupType3,
			LookupType4,
			LookupType5,
			LookupType6,
			LookupType7,
			LookupType8,
			LookupType9,
		][ type ]( p );
		subtable.type = type;
		return subtable;
	},
};
class LookupList extends ParsedData {
	static EMPTY = { lookupCount: 0, lookups: [] };
	constructor( p ) {
		super( p );
		this.lookupCount = p.uint16;
		this.lookups = [ ...new Array( this.lookupCount ) ].map(
			( _ ) => p.Offset16
		);
	}
}
class LookupTable extends ParsedData {
	constructor( p, type ) {
		super( p );
		this.ctType = type;
		this.lookupType = p.uint16;
		this.lookupFlag = p.uint16;
		this.subTableCount = p.uint16;
		this.subtableOffsets = [ ...new Array( this.subTableCount ) ].map(
			( _ ) => p.Offset16
		);
		this.markFilteringSet = p.uint16;
	}
	get rightToLeft() {
		return this.lookupFlag & ( 1 === 1 );
	}
	get ignoreBaseGlyphs() {
		return this.lookupFlag & ( 2 === 2 );
	}
	get ignoreLigatures() {
		return this.lookupFlag & ( 4 === 4 );
	}
	get ignoreMarks() {
		return this.lookupFlag & ( 8 === 8 );
	}
	get useMarkFilteringSet() {
		return this.lookupFlag & ( 16 === 16 );
	}
	get markAttachmentType() {
		return this.lookupFlag & ( 65280 === 65280 );
	}
	getSubTable( index ) {
		const builder = this.ctType === `GSUB` ? GSUBtables : GPOStables;
		this.parser.currentPosition =
			this.start + this.subtableOffsets[ index ];
		return builder.buildSubtable( this.lookupType, this.parser );
	}
}
class CommonLayoutTable extends SimpleTable {
	constructor( dict, dataview, name ) {
		const { p: p, tableStart: tableStart } = super( dict, dataview, name );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.scriptListOffset = p.Offset16;
		this.featureListOffset = p.Offset16;
		this.lookupListOffset = p.Offset16;
		if ( this.majorVersion === 1 && this.minorVersion === 1 ) {
			this.featureVariationsOffset = p.Offset32;
		}
		const no_content = ! (
			this.scriptListOffset ||
			this.featureListOffset ||
			this.lookupListOffset
		);
		lazy$1( this, `scriptList`, () => {
			if ( no_content ) return ScriptList.EMPTY;
			p.currentPosition = tableStart + this.scriptListOffset;
			return new ScriptList( p );
		} );
		lazy$1( this, `featureList`, () => {
			if ( no_content ) return FeatureList.EMPTY;
			p.currentPosition = tableStart + this.featureListOffset;
			return new FeatureList( p );
		} );
		lazy$1( this, `lookupList`, () => {
			if ( no_content ) return LookupList.EMPTY;
			p.currentPosition = tableStart + this.lookupListOffset;
			return new LookupList( p );
		} );
		if ( this.featureVariationsOffset ) {
			lazy$1( this, `featureVariations`, () => {
				if ( no_content ) return FeatureVariations.EMPTY;
				p.currentPosition = tableStart + this.featureVariationsOffset;
				return new FeatureVariations( p );
			} );
		}
	}
	getSupportedScripts() {
		return this.scriptList.scriptRecords.map( ( r ) => r.scriptTag );
	}
	getScriptTable( scriptTag ) {
		let record = this.scriptList.scriptRecords.find(
			( r ) => r.scriptTag === scriptTag
		);
		this.parser.currentPosition =
			this.scriptList.start + record.scriptOffset;
		let table = new ScriptTable( this.parser );
		table.scriptTag = scriptTag;
		return table;
	}
	ensureScriptTable( arg ) {
		if ( typeof arg === 'string' ) {
			return this.getScriptTable( arg );
		}
		return arg;
	}
	getSupportedLangSys( scriptTable ) {
		scriptTable = this.ensureScriptTable( scriptTable );
		const hasDefault = scriptTable.defaultLangSys !== 0;
		const supported = scriptTable.langSysRecords.map(
			( l ) => l.langSysTag
		);
		if ( hasDefault ) supported.unshift( `dflt` );
		return supported;
	}
	getDefaultLangSysTable( scriptTable ) {
		scriptTable = this.ensureScriptTable( scriptTable );
		let offset = scriptTable.defaultLangSys;
		if ( offset !== 0 ) {
			this.parser.currentPosition = scriptTable.start + offset;
			let table = new LangSysTable( this.parser );
			table.langSysTag = ``;
			table.defaultForScript = scriptTable.scriptTag;
			return table;
		}
	}
	getLangSysTable( scriptTable, langSysTag = `dflt` ) {
		if ( langSysTag === `dflt` )
			return this.getDefaultLangSysTable( scriptTable );
		scriptTable = this.ensureScriptTable( scriptTable );
		let record = scriptTable.langSysRecords.find(
			( l ) => l.langSysTag === langSysTag
		);
		this.parser.currentPosition = scriptTable.start + record.langSysOffset;
		let table = new LangSysTable( this.parser );
		table.langSysTag = langSysTag;
		return table;
	}
	getFeatures( langSysTable ) {
		return langSysTable.featureIndices.map( ( index ) =>
			this.getFeature( index )
		);
	}
	getFeature( indexOrTag ) {
		let record;
		if ( parseInt( indexOrTag ) == indexOrTag ) {
			record = this.featureList.featureRecords[ indexOrTag ];
		} else {
			record = this.featureList.featureRecords.find(
				( f ) => f.featureTag === indexOrTag
			);
		}
		if ( ! record ) return;
		this.parser.currentPosition =
			this.featureList.start + record.featureOffset;
		let table = new FeatureTable( this.parser );
		table.featureTag = record.featureTag;
		return table;
	}
	getLookups( featureTable ) {
		return featureTable.lookupListIndices.map( ( index ) =>
			this.getLookup( index )
		);
	}
	getLookup( lookupIndex, type ) {
		let lookupOffset = this.lookupList.lookups[ lookupIndex ];
		this.parser.currentPosition = this.lookupList.start + lookupOffset;
		return new LookupTable( this.parser, type );
	}
}
class GSUB extends CommonLayoutTable {
	constructor( dict, dataview ) {
		super( dict, dataview, `GSUB` );
	}
	getLookup( lookupIndex ) {
		return super.getLookup( lookupIndex, `GSUB` );
	}
}
var GSUB$1 = Object.freeze( { __proto__: null, GSUB: GSUB } );
class GPOS extends CommonLayoutTable {
	constructor( dict, dataview ) {
		super( dict, dataview, `GPOS` );
	}
	getLookup( lookupIndex ) {
		return super.getLookup( lookupIndex, `GPOS` );
	}
}
var GPOS$1 = Object.freeze( { __proto__: null, GPOS: GPOS } );
class SVG extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.offsetToSVGDocumentList = p.Offset32;
		p.currentPosition = this.tableStart + this.offsetToSVGDocumentList;
		this.documentList = new SVGDocumentList( p );
	}
}
class SVGDocumentList extends ParsedData {
	constructor( p ) {
		super( p );
		this.numEntries = p.uint16;
		this.documentRecords = [ ...new Array( this.numEntries ) ].map(
			( _ ) => new SVGDocumentRecord( p )
		);
	}
	getDocument( documentID ) {
		let record = this.documentRecords[ documentID ];
		if ( ! record ) return '';
		let offset = this.start + record.svgDocOffset;
		this.parser.currentPosition = offset;
		return this.parser.readBytes( record.svgDocLength );
	}
	getDocumentForGlyph( glyphID ) {
		let id = this.documentRecords.findIndex(
			( d ) => d.startGlyphID <= glyphID && glyphID <= d.endGlyphID
		);
		if ( id === -1 ) return '';
		return this.getDocument( id );
	}
}
class SVGDocumentRecord {
	constructor( p ) {
		this.startGlyphID = p.uint16;
		this.endGlyphID = p.uint16;
		this.svgDocOffset = p.Offset32;
		this.svgDocLength = p.uint32;
	}
}
var SVG$1 = Object.freeze( { __proto__: null, SVG: SVG } );
class fvar extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.axesArrayOffset = p.Offset16;
		p.uint16;
		this.axisCount = p.uint16;
		this.axisSize = p.uint16;
		this.instanceCount = p.uint16;
		this.instanceSize = p.uint16;
		const axisStart = this.tableStart + this.axesArrayOffset;
		lazy$1( this, `axes`, () => {
			p.currentPosition = axisStart;
			return [ ...new Array( this.axisCount ) ].map(
				( _ ) => new VariationAxisRecord( p )
			);
		} );
		const instanceStart = axisStart + this.axisCount * this.axisSize;
		lazy$1( this, `instances`, () => {
			let instances = [];
			for ( let i = 0; i < this.instanceCount; i++ ) {
				p.currentPosition = instanceStart + i * this.instanceSize;
				instances.push(
					new InstanceRecord( p, this.axisCount, this.instanceSize )
				);
			}
			return instances;
		} );
	}
	getSupportedAxes() {
		return this.axes.map( ( a ) => a.tag );
	}
	getAxis( name ) {
		return this.axes.find( ( a ) => a.tag === name );
	}
}
class VariationAxisRecord {
	constructor( p ) {
		this.tag = p.tag;
		this.minValue = p.fixed;
		this.defaultValue = p.fixed;
		this.maxValue = p.fixed;
		this.flags = p.flags( 16 );
		this.axisNameID = p.uint16;
	}
}
class InstanceRecord {
	constructor( p, axisCount, size ) {
		let start = p.currentPosition;
		this.subfamilyNameID = p.uint16;
		p.uint16;
		this.coordinates = [ ...new Array( axisCount ) ].map(
			( _ ) => p.fixed
		);
		if ( p.currentPosition - start < size ) {
			this.postScriptNameID = p.uint16;
		}
	}
}
var fvar$1 = Object.freeze( { __proto__: null, fvar: fvar } );
class cvt extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		const n = dict.length / 2;
		lazy$1( this, `items`, () =>
			[ ...new Array( n ) ].map( ( _ ) => p.fword )
		);
	}
}
var cvt$1 = Object.freeze( { __proto__: null, cvt: cvt } );
class fpgm extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		lazy$1( this, `instructions`, () =>
			[ ...new Array( dict.length ) ].map( ( _ ) => p.uint8 )
		);
	}
}
var fpgm$1 = Object.freeze( { __proto__: null, fpgm: fpgm } );
class gasp extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.numRanges = p.uint16;
		const getter = () =>
			[ ...new Array( this.numRanges ) ].map(
				( _ ) => new GASPRange( p )
			);
		lazy$1( this, `gaspRanges`, getter );
	}
}
class GASPRange {
	constructor( p ) {
		this.rangeMaxPPEM = p.uint16;
		this.rangeGaspBehavior = p.uint16;
	}
}
var gasp$1 = Object.freeze( { __proto__: null, gasp: gasp } );
class glyf extends SimpleTable {
	constructor( dict, dataview ) {
		super( dict, dataview );
	}
	getGlyphData( offset, length ) {
		this.parser.currentPosition = this.tableStart + offset;
		return this.parser.readBytes( length );
	}
}
var glyf$1 = Object.freeze( { __proto__: null, glyf: glyf } );
class loca extends SimpleTable {
	constructor( dict, dataview, tables ) {
		const { p: p } = super( dict, dataview );
		const n = tables.maxp.numGlyphs + 1;
		if ( tables.head.indexToLocFormat === 0 ) {
			this.x2 = true;
			lazy$1( this, `offsets`, () =>
				[ ...new Array( n ) ].map( ( _ ) => p.Offset16 )
			);
		} else {
			lazy$1( this, `offsets`, () =>
				[ ...new Array( n ) ].map( ( _ ) => p.Offset32 )
			);
		}
	}
	getGlyphDataOffsetAndLength( glyphID ) {
		let offset = this.offsets[ glyphID ] * this.x2 ? 2 : 1;
		let nextOffset = this.offsets[ glyphID + 1 ] * this.x2 ? 2 : 1;
		return { offset: offset, length: nextOffset - offset };
	}
}
var loca$1 = Object.freeze( { __proto__: null, loca: loca } );
class prep extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		lazy$1( this, `instructions`, () =>
			[ ...new Array( dict.length ) ].map( ( _ ) => p.uint8 )
		);
	}
}
var prep$1 = Object.freeze( { __proto__: null, prep: prep } );
class CFF extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		lazy$1( this, `data`, () => p.readBytes() );
	}
}
var CFF$1 = Object.freeze( { __proto__: null, CFF: CFF } );
class CFF2 extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		lazy$1( this, `data`, () => p.readBytes() );
	}
}
var CFF2$1 = Object.freeze( { __proto__: null, CFF2: CFF2 } );
class VORG extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.defaultVertOriginY = p.int16;
		this.numVertOriginYMetrics = p.uint16;
		lazy$1( this, `vertORiginYMetrics`, () =>
			[ ...new Array( this.numVertOriginYMetrics ) ].map(
				( _ ) => new VertOriginYMetric( p )
			)
		);
	}
}
class VertOriginYMetric {
	constructor( p ) {
		this.glyphIndex = p.uint16;
		this.vertOriginY = p.int16;
	}
}
var VORG$1 = Object.freeze( { __proto__: null, VORG: VORG } );
class BitmapSize {
	constructor( p ) {
		this.indexSubTableArrayOffset = p.Offset32;
		this.indexTablesSize = p.uint32;
		this.numberofIndexSubTables = p.uint32;
		this.colorRef = p.uint32;
		this.hori = new SbitLineMetrics( p );
		this.vert = new SbitLineMetrics( p );
		this.startGlyphIndex = p.uint16;
		this.endGlyphIndex = p.uint16;
		this.ppemX = p.uint8;
		this.ppemY = p.uint8;
		this.bitDepth = p.uint8;
		this.flags = p.int8;
	}
}
class BitmapScale {
	constructor( p ) {
		this.hori = new SbitLineMetrics( p );
		this.vert = new SbitLineMetrics( p );
		this.ppemX = p.uint8;
		this.ppemY = p.uint8;
		this.substitutePpemX = p.uint8;
		this.substitutePpemY = p.uint8;
	}
}
class SbitLineMetrics {
	constructor( p ) {
		this.ascender = p.int8;
		this.descender = p.int8;
		this.widthMax = p.uint8;
		this.caretSlopeNumerator = p.int8;
		this.caretSlopeDenominator = p.int8;
		this.caretOffset = p.int8;
		this.minOriginSB = p.int8;
		this.minAdvanceSB = p.int8;
		this.maxBeforeBL = p.int8;
		this.minAfterBL = p.int8;
		this.pad1 = p.int8;
		this.pad2 = p.int8;
	}
}
class EBLC extends SimpleTable {
	constructor( dict, dataview, name ) {
		const { p: p } = super( dict, dataview, name );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.numSizes = p.uint32;
		lazy$1( this, `bitMapSizes`, () =>
			[ ...new Array( this.numSizes ) ].map(
				( _ ) => new BitmapSize( p )
			)
		);
	}
}
var EBLC$1 = Object.freeze( { __proto__: null, EBLC: EBLC } );
class EBDT extends SimpleTable {
	constructor( dict, dataview, name ) {
		const { p: p } = super( dict, dataview, name );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
	}
}
var EBDT$1 = Object.freeze( { __proto__: null, EBDT: EBDT } );
class EBSC extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.majorVersion = p.uint16;
		this.minorVersion = p.uint16;
		this.numSizes = p.uint32;
		lazy$1( this, `bitmapScales`, () =>
			[ ...new Array( this.numSizes ) ].map(
				( _ ) => new BitmapScale( p )
			)
		);
	}
}
var EBSC$1 = Object.freeze( { __proto__: null, EBSC: EBSC } );
class CBLC extends EBLC {
	constructor( dict, dataview ) {
		super( dict, dataview, `CBLC` );
	}
}
var CBLC$1 = Object.freeze( { __proto__: null, CBLC: CBLC } );
class CBDT extends EBDT {
	constructor( dict, dataview ) {
		super( dict, dataview, `CBDT` );
	}
}
var CBDT$1 = Object.freeze( { __proto__: null, CBDT: CBDT } );
class sbix extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.flags = p.flags( 16 );
		this.numStrikes = p.uint32;
		lazy$1( this, `strikeOffsets`, () =>
			[ ...new Array( this.numStrikes ) ].map( ( _ ) => p.Offset32 )
		);
	}
}
var sbix$1 = Object.freeze( { __proto__: null, sbix: sbix } );
class COLR extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.numBaseGlyphRecords = p.uint16;
		this.baseGlyphRecordsOffset = p.Offset32;
		this.layerRecordsOffset = p.Offset32;
		this.numLayerRecords = p.uint16;
	}
	getBaseGlyphRecord( glyphID ) {
		let start = this.tableStart + this.baseGlyphRecordsOffset;
		this.parser.currentPosition = start;
		let first = new BaseGlyphRecord( this.parser );
		let firstID = first.gID;
		let end = this.tableStart + this.layerRecordsOffset - 6;
		this.parser.currentPosition = end;
		let last = new BaseGlyphRecord( this.parser );
		let lastID = last.gID;
		if ( firstID === glyphID ) return first;
		if ( lastID === glyphID ) return last;
		while ( true ) {
			if ( start === end ) break;
			let mid = start + ( end - start ) / 12;
			this.parser.currentPosition = mid;
			let middle = new BaseGlyphRecord( this.parser );
			let midID = middle.gID;
			if ( midID === glyphID ) return middle;
			else if ( midID > glyphID ) {
				end = mid;
			} else if ( midID < glyphID ) {
				start = mid;
			}
		}
		return false;
	}
	getLayers( glyphID ) {
		let record = this.getBaseGlyphRecord( glyphID );
		this.parser.currentPosition =
			this.tableStart +
			this.layerRecordsOffset +
			4 * record.firstLayerIndex;
		return [ ...new Array( record.numLayers ) ].map(
			( _ ) => new LayerRecord( p )
		);
	}
}
class BaseGlyphRecord {
	constructor( p ) {
		this.gID = p.uint16;
		this.firstLayerIndex = p.uint16;
		this.numLayers = p.uint16;
	}
}
class LayerRecord {
	constructor( p ) {
		this.gID = p.uint16;
		this.paletteIndex = p.uint16;
	}
}
var COLR$1 = Object.freeze( { __proto__: null, COLR: COLR } );
class CPAL extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.numPaletteEntries = p.uint16;
		const numPalettes = ( this.numPalettes = p.uint16 );
		this.numColorRecords = p.uint16;
		this.offsetFirstColorRecord = p.Offset32;
		this.colorRecordIndices = [ ...new Array( this.numPalettes ) ].map(
			( _ ) => p.uint16
		);
		lazy$1( this, `colorRecords`, () => {
			p.currentPosition = this.tableStart + this.offsetFirstColorRecord;
			return [ ...new Array( this.numColorRecords ) ].map(
				( _ ) => new ColorRecord( p )
			);
		} );
		if ( this.version === 1 ) {
			this.offsetPaletteTypeArray = p.Offset32;
			this.offsetPaletteLabelArray = p.Offset32;
			this.offsetPaletteEntryLabelArray = p.Offset32;
			lazy$1( this, `paletteTypeArray`, () => {
				p.currentPosition =
					this.tableStart + this.offsetPaletteTypeArray;
				return new PaletteTypeArray( p, numPalettes );
			} );
			lazy$1( this, `paletteLabelArray`, () => {
				p.currentPosition =
					this.tableStart + this.offsetPaletteLabelArray;
				return new PaletteLabelsArray( p, numPalettes );
			} );
			lazy$1( this, `paletteEntryLabelArray`, () => {
				p.currentPosition =
					this.tableStart + this.offsetPaletteEntryLabelArray;
				return new PaletteEntryLabelArray( p, numPalettes );
			} );
		}
	}
}
class ColorRecord {
	constructor( p ) {
		this.blue = p.uint8;
		this.green = p.uint8;
		this.red = p.uint8;
		this.alpha = p.uint8;
	}
}
class PaletteTypeArray {
	constructor( p, numPalettes ) {
		this.paletteTypes = [ ...new Array( numPalettes ) ].map(
			( _ ) => p.uint32
		);
	}
}
class PaletteLabelsArray {
	constructor( p, numPalettes ) {
		this.paletteLabels = [ ...new Array( numPalettes ) ].map(
			( _ ) => p.uint16
		);
	}
}
class PaletteEntryLabelArray {
	constructor( p, numPalettes ) {
		this.paletteEntryLabels = [ ...new Array( numPalettes ) ].map(
			( _ ) => p.uint16
		);
	}
}
var CPAL$1 = Object.freeze( { __proto__: null, CPAL: CPAL } );
class DSIG extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint32;
		this.numSignatures = p.uint16;
		this.flags = p.uint16;
		this.signatureRecords = [ ...new Array( this.numSignatures ) ].map(
			( _ ) => new SignatureRecord( p )
		);
	}
	getData( signatureID ) {
		const record = this.signatureRecords[ signatureID ];
		this.parser.currentPosition = this.tableStart + record.offset;
		return new SignatureBlockFormat1( this.parser );
	}
}
class SignatureRecord {
	constructor( p ) {
		this.format = p.uint32;
		this.length = p.uint32;
		this.offset = p.Offset32;
	}
}
class SignatureBlockFormat1 {
	constructor( p ) {
		p.uint16;
		p.uint16;
		this.signatureLength = p.uint32;
		this.signature = p.readBytes( this.signatureLength );
	}
}
var DSIG$1 = Object.freeze( { __proto__: null, DSIG: DSIG } );
class hdmx extends SimpleTable {
	constructor( dict, dataview, tables ) {
		const { p: p } = super( dict, dataview );
		const numGlyphs = tables.hmtx.numGlyphs;
		this.version = p.uint16;
		this.numRecords = p.int16;
		this.sizeDeviceRecord = p.int32;
		this.records = [ ...new Array( numRecords ) ].map(
			( _ ) => new DeviceRecord( p, numGlyphs )
		);
	}
}
class DeviceRecord {
	constructor( p, numGlyphs ) {
		this.pixelSize = p.uint8;
		this.maxWidth = p.uint8;
		this.widths = p.readBytes( numGlyphs );
	}
}
var hdmx$1 = Object.freeze( { __proto__: null, hdmx: hdmx } );
class kern extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.nTables = p.uint16;
		lazy$1( this, `tables`, () => {
			let offset = this.tableStart + 4;
			const tables = [];
			for ( let i = 0; i < this.nTables; i++ ) {
				p.currentPosition = offset;
				let subtable = new KernSubTable( p );
				tables.push( subtable );
				offset += subtable;
			}
			return tables;
		} );
	}
}
class KernSubTable {
	constructor( p ) {
		this.version = p.uint16;
		this.length = p.uint16;
		this.coverage = p.flags( 8 );
		this.format = p.uint8;
		if ( this.format === 0 ) {
			this.nPairs = p.uint16;
			this.searchRange = p.uint16;
			this.entrySelector = p.uint16;
			this.rangeShift = p.uint16;
			lazy$1( this, `pairs`, () =>
				[ ...new Array( this.nPairs ) ].map( ( _ ) => new Pair( p ) )
			);
		}
		if ( this.format === 2 ) {
			console.warn(
				`Kern subtable format 2 is not supported: this parser currently only parses universal table data.`
			);
		}
	}
	get horizontal() {
		return this.coverage[ 0 ];
	}
	get minimum() {
		return this.coverage[ 1 ];
	}
	get crossstream() {
		return this.coverage[ 2 ];
	}
	get override() {
		return this.coverage[ 3 ];
	}
}
class Pair {
	constructor( p ) {
		this.left = p.uint16;
		this.right = p.uint16;
		this.value = p.fword;
	}
}
var kern$1 = Object.freeze( { __proto__: null, kern: kern } );
class LTSH extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.numGlyphs = p.uint16;
		this.yPels = p.readBytes( this.numGlyphs );
	}
}
var LTSH$1 = Object.freeze( { __proto__: null, LTSH: LTSH } );
class MERG extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.mergeClassCount = p.uint16;
		this.mergeDataOffset = p.Offset16;
		this.classDefCount = p.uint16;
		this.offsetToClassDefOffsets = p.Offset16;
		lazy$1( this, `mergeEntryMatrix`, () =>
			[ ...new Array( this.mergeClassCount ) ].map( ( _ ) =>
				p.readBytes( this.mergeClassCount )
			)
		);
		console.warn( `Full MERG parsing is currently not supported.` );
		console.warn(
			`If you need this table parsed, please file an issue, or better yet, a PR.`
		);
	}
}
var MERG$1 = Object.freeze( { __proto__: null, MERG: MERG } );
class meta extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint32;
		this.flags = p.uint32;
		p.uint32;
		this.dataMapsCount = p.uint32;
		this.dataMaps = [ ...new Array( this.dataMapsCount ) ].map(
			( _ ) => new DataMap( this.tableStart, p )
		);
	}
}
class DataMap {
	constructor( tableStart, p ) {
		this.tableStart = tableStart;
		this.parser = p;
		this.tag = p.tag;
		this.dataOffset = p.Offset32;
		this.dataLength = p.uint32;
	}
	getData() {
		this.parser.currentField = this.tableStart + this.dataOffset;
		return this.parser.readBytes( this.dataLength );
	}
}
var meta$1 = Object.freeze( { __proto__: null, meta: meta } );
class PCLT extends SimpleTable {
	constructor( dict, dataview ) {
		super( dict, dataview );
		console.warn(
			`This font uses a PCLT table, which is currently not supported by this parser.`
		);
		console.warn(
			`If you need this table parsed, please file an issue, or better yet, a PR.`
		);
	}
}
var PCLT$1 = Object.freeze( { __proto__: null, PCLT: PCLT } );
class VDMX extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.uint16;
		this.numRecs = p.uint16;
		this.numRatios = p.uint16;
		this.ratRanges = [ ...new Array( this.numRatios ) ].map(
			( _ ) => new RatioRange( p )
		);
		this.offsets = [ ...new Array( this.numRatios ) ].map(
			( _ ) => p.Offset16
		);
		this.VDMXGroups = [ ...new Array( this.numRecs ) ].map(
			( _ ) => new VDMXGroup( p )
		);
	}
}
class RatioRange {
	constructor( p ) {
		this.bCharSet = p.uint8;
		this.xRatio = p.uint8;
		this.yStartRatio = p.uint8;
		this.yEndRatio = p.uint8;
	}
}
class VDMXGroup {
	constructor( p ) {
		this.recs = p.uint16;
		this.startsz = p.uint8;
		this.endsz = p.uint8;
		this.records = [ ...new Array( this.recs ) ].map(
			( _ ) => new vTable( p )
		);
	}
}
class vTable {
	constructor( p ) {
		this.yPelHeight = p.uint16;
		this.yMax = p.int16;
		this.yMin = p.int16;
	}
}
var VDMX$1 = Object.freeze( { __proto__: null, VDMX: VDMX } );
class vhea extends SimpleTable {
	constructor( dict, dataview ) {
		const { p: p } = super( dict, dataview );
		this.version = p.fixed;
		this.ascent = this.vertTypoAscender = p.int16;
		this.descent = this.vertTypoDescender = p.int16;
		this.lineGap = this.vertTypoLineGap = p.int16;
		this.advanceHeightMax = p.int16;
		this.minTopSideBearing = p.int16;
		this.minBottomSideBearing = p.int16;
		this.yMaxExtent = p.int16;
		this.caretSlopeRise = p.int16;
		this.caretSlopeRun = p.int16;
		this.caretOffset = p.int16;
		this.reserved = p.int16;
		this.reserved = p.int16;
		this.reserved = p.int16;
		this.reserved = p.int16;
		this.metricDataFormat = p.int16;
		this.numOfLongVerMetrics = p.uint16;
		p.verifyLength();
	}
}
var vhea$1 = Object.freeze( { __proto__: null, vhea: vhea } );
class vmtx extends SimpleTable {
	constructor( dict, dataview, tables ) {
		super( dict, dataview );
		const numOfLongVerMetrics = tables.vhea.numOfLongVerMetrics;
		const numGlyphs = tables.maxp.numGlyphs;
		const metricsStart = p.currentPosition;
		lazy( this, `vMetrics`, () => {
			p.currentPosition = metricsStart;
			return [ ...new Array( numOfLongVerMetrics ) ].map(
				( _ ) => new LongVertMetric( p.uint16, p.int16 )
			);
		} );
		if ( numOfLongVerMetrics < numGlyphs ) {
			const tsbStart = metricsStart + numOfLongVerMetrics * 4;
			lazy( this, `topSideBearings`, () => {
				p.currentPosition = tsbStart;
				return [ ...new Array( numGlyphs - numOfLongVerMetrics ) ].map(
					( _ ) => p.int16
				);
			} );
		}
	}
}
class LongVertMetric {
	constructor( h, b ) {
		this.advanceHeight = h;
		this.topSideBearing = b;
	}
}
var vmtx$1 = Object.freeze( { __proto__: null, vmtx: vmtx } );
export { Font };
/* eslint-enable */
