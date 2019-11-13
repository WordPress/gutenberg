/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import * as map from 'lib0/map.js';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import _ from 'lodash';

/**
 * Map of Yjs instances
 */
const instances = new Map();

/**
 * If two clients join a session at the same time, both with fill the shared
 * document with the initial data, resulting in duplicate blocks.
 * Before transforming the Yjs document to a Gutenberg blocks, we remove all
 * duplicate blocks.
 *
 * @param {Y.Array} ycontent
 */
const checkDuplicateBlocks = ( ycontent ) => {
	const found = new Set();
	for ( let i = ycontent.length - 1; i >= 0; i-- ) {
		const c = ycontent.get( i );
		const clientId = c.clientId;
		if ( clientId ) {
			if ( found.has( clientId ) ) {
				ycontent.delete( i, 1 );
			} else {
				found.add( c.clientId );
			}
		}
	}
};

const gutenbergSourcedChange = Symbol( 'gutenberg-sourced-change' );

/**
 * @param {number} id document id
 * @param {string} kind     Kind of the edited entity record.
 * @param {string} name     Name of the edited entity record.
 * @return {{ydoc:Y.Doc,provider:any,type:Y.Array}} Instance description
 */
export const getInstance = ( id, kind, name ) => map.setIfUndefined( instances, id, () => {
	// ydoc is the CRDT state
	const ydoc = new Y.Doc();
	// Connect ydoc to other clients via the Websocket provider.
	const location = window.location;
	const provider = new WebsocketProvider( `${ location.protocol === 'http:' ? 'ws:' : 'wss:' }//yjs-demos.now.sh`, `gutenberg-${ location.host }-${ id }`, ydoc );
	// Define a shared type on ydoc.
	// A shared type works like any other data type - but it fires synchronous
	// events when it changes and is automatically synced with other clients.
	const type = ydoc.getArray( 'gutenberg-blocks' );
	provider.on( 'sync', () => {
		const updateEditor = () => {
			checkDuplicateBlocks( type );
			// Type is synced and has content ⇒ Overwrite current state.
			dispatch( 'core' ).editEntityRecord(
				kind,
				name,
				id,
				{ blocks: type.toArray() },
				{ undoIgnore: true, syncIgnore: true }
			);
		};
		type.observeDeep( ( event, transaction ) => {
			if ( transaction.origin !== gutenbergSourcedChange ) {
				updateEditor();
			}
		} );
		if ( type.length > 0 ) {
			updateEditor();
		} else {
			// Type is synced and has no content yet.
			dispatch( 'core' ).receiveEntityRecords( kind, name, id ).then( ( record ) => {
				if ( type.length === 0 && record.blocks ) {
					type.insert( 0, record.blocks );
				}
			} );
		}
	} );

	return {
		ydoc, provider, type,
	};
} );

/**
 * Create a diff between two editor states.
 *
 * @template T
 * @param {Array<T>} a The old state
 * @param {Array<T>} b The updated state
 * @return {{index:number,remove:number,insert:Array<T>}} The diff description.
 */
const simpleDiff = ( a, b ) => {
	let left = 0; // number of same characters counting from left
	let right = 0; // number of same characters counting from right
	while ( left < a.length && left < b.length && _.isEqual( a[ left ], b[ left ] ) ) {
		left++;
	}
	if ( left !== a.length || left !== b.length ) {
		// Only check right if a !== b
		while ( right + left < a.length && right + left < b.length && _.isEqual( a[ a.length - right - 1 ], b[ b.length - right - 1 ] ) ) {
			right++;
		}
	}
	return {
		index: left,
		remove: a.length - left - right,
		insert: b.slice( left, b.length - right ),
	};
};

/**
 * @param {number} id document id
 * @param {string} kind     Kind of the edited entity record.
 * @param {string} name     Name of the edited entity record.
 * @param {Array} newEditorContent
 */
export const updateInstance = ( id, kind, name, newEditorContent ) => {
	const { type, provider, ydoc } = getInstance( id, kind, name );
	if ( provider.synced ) {
		// Use a very basic diff approach to calculate the differences
		const currentContent = type.toArray();
		const d = simpleDiff( currentContent, newEditorContent );
		// Bundle all changes as a single transaction
		// This transaction will trigger the observer call, which will
		// trigger updateBlocks.
		ydoc.transact( () => {
			type.delete( d.index, d.remove );
			type.insert( d.index, d.insert );
		}, gutenbergSourcedChange );
	}
};
