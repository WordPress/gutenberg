/** @module publish */

const path = require( "path" );
const fs = require( "fs" );

const ensureFiles = require( "./lib/ensure_files" );
const getNodeDoc = require( "./lib/get_node_doc" );
const getNodeProperty = require( "./lib/get_node_property" );
const getNodeFunction = require( "./lib/get_node_function" );
const getNodeClass = require( "./lib/get_node_class" );
const setNodePackage = require( "./lib/set_node_package" );

/**
 * Generate documentation output.ßß
 *
 * @param {TAFFY} data - A TaffyDB collection representing
 *                       all the symbols documented in your code.
 * @param {object} opts - An object with options information.
 */
exports.publish = function( data ) {
	var i, node, relative_path, file_path, packages, packages_root;

	packages      = env.conf.templates.packages;
	packages_root = env.conf.templates.packagesRoot || "/";

	// Get all nodes that have documentation and
	// are not a member of an anonymous namespace.
	var documented_nodes = data(
		{ undocumented: { "!is": true } },
		{ kind: { "!is": "package" } },
		[
			{ memberof: { isUndefined: true } },
			{ memberof: { isUndefined: false, "!like": "<anonymous>" } }
		]
	);

	var class_nodes = documented_nodes.filter( { kind: "class" } ).get();
	var other_nodes = documented_nodes.filter( { kind: { "!is": "class" } } ).get();

	var files = {};
	var classes = {};
	var base_path = process.cwd();

	// First loop to collect all files and classes.
	for ( i = 0; i < class_nodes.length; i++ ) {
		node = class_nodes[ i ];

		relative_path = path.relative( base_path, node.meta.path );

		if ( packages ) {
			node = setNodePackage( node, packages_root, relative_path );
		}

		file_path = relative_path + "/" + node.meta.filename;
		files = ensureFiles( files, file_path, base_path );

		classes[ node.longname ] = getNodeClass( file_path, node );
		files[ file_path ].classes.push( classes[ node.longname ] );
	}

	// Second loop to fill in all methods.
	for ( i = 0; i < other_nodes.length; i++ ) {
		node = other_nodes[ i ];

		relative_path = path.relative( base_path, node.meta.path );

		if ( packages ) {
			node = setNodePackage( node, packages_root, relative_path );
		}

		file_path = relative_path + "/" + node.meta.filename;
		files = ensureFiles( files, file_path, base_path );

		if ( node.kind === "function" ) {
			if ( classes[ node.memberof ] ) {
				classes[ node.memberof ].methods.push( getNodeFunction( file_path, node, "" ) );
			} else {
				files[ file_path ].functions.push( getNodeFunction( file_path, node, node.memberof ) );
			}
		}

		if ( node.kind === "file" ) {
			files[ file_path ].file = getNodeDoc( node );
		}

		if ( node.kind === "member" ) {
			// Ignore floating members.
			if ( classes[ node.memberof ] ) {
				classes[ node.memberof ].properties.push( getNodeProperty( file_path, node ) );
			}
		}
	}

	// Export all data to JSON.
	const json = JSON.stringify( Object.values( files ) );
	fs.writeFileSync( "parsed-jsdoc.json", json );
};
