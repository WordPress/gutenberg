// Adapted from https://github.com/reworkcss/css
// because we needed to remove source map support.

/**
 * Expose `Compiler`.
 */

export default Compiler;

/**
 * Initialize a compiler.
 */

function Compiler( opts ) {
	this.options = opts || {};
}

/**
 * Emit `str`
 */

Compiler.prototype.emit = function( str ) {
	return str;
};

/**
 * Visit `node`.
 */

Compiler.prototype.visit = function( node ) {
	return this[ node.type ]( node );
};

/**
 * Map visit over array of `nodes`, optionally using a `delim`
 */

Compiler.prototype.mapVisit = function( nodes, delim ) {
	let buf = '';
	delim = delim || '';

	for ( let i = 0, length = nodes.length; i < length; i++ ) {
		buf += this.visit( nodes[ i ] );
		if ( delim && i < length - 1 ) {
			buf += this.emit( delim );
		}
	}

	return buf;
};
