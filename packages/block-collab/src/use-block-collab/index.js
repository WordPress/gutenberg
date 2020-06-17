/**
 * External dependencies
 */
import * as yjs from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import setYDocBlocks from './set-y-doc-blocks';
import yDocBlocksToArray from './y-doc-blocks-to-array';

const instances = {};

/**
 * Connects to the block collaboration room of the given ID,
 * with the specified password, and returns a list of peers,
 * as well as the shared blocks and a function to update them.
 *
 * @param {string} id       The ID.
 * @param {string} password The password.
 *
 * @return {Object} The shared data.
 */
export default function useBlockCollab( id, password ) {
	const [ peers, setPeers ] = useState( {} );
	const [ setSelf, setSetSelf ] = useState( () => () => {} );

	const [ blocks, _setBlocks ] = useState( [] );
	const initialBlocksRef = useRef();
	const [ setBlocks, setSetBlocks ] = useState( () => ( newBlocks ) => {
		// Remember these local changes before initialization so that
		// we can sync them later.
		initialBlocksRef.current = newBlocks;
		_setBlocks( newBlocks );
	} );

	const setAddBlockSelectionsState = useDispatch(
		'core/block-collab/add-block-selections'
	)?.setState;
	useEffect( () => {
		// We share instances between hook instances for the same document,
		// because we need to reuse the same `yDoc` and provider.
		// Note that the `localYjsChangeSymbol` does differ per hook instance,
		// so that edits made through one sync to the others.
		const instanceKey = `${ id }|${ password }`;
		if ( ! instances[ instanceKey ] ) {
			const yDoc = new yjs.Doc();
			const yDocPeers = yDoc.getMap( 'peers' );
			const yDocBlocks = yDoc.getMap( 'blocks' );
			yDocBlocks.set( 'order', new yjs.Map() );
			yDocBlocks.set( 'byClientId', new yjs.Map() );

			instances[ instanceKey ] = {
				yDoc,
				peers: yDocPeers,
				blocks: yDocBlocks,
				provider: new WebrtcProvider( id, yDoc, {
					password,
				} ),
			};
		}

		// Keep peer list in sync.
		instances[ instanceKey ].provider.on( 'peers', ( newPeers ) => {
			if ( newPeers.added.length || newPeers.removed.length )
				instances[ instanceKey ].yDoc.transact( () => {
					newPeers.added.forEach(
						( peerId ) =>
							! instances[ instanceKey ].peers.has( peerId ) &&
							instances[ instanceKey ].peers.set( peerId, {
								peerId,
							} )
					);
					newPeers.removed.forEach(
						( peerId ) =>
							instances[ instanceKey ].peers.has( peerId ) &&
							instances[ instanceKey ].peers.delete( peerId )
					);
				} );
		} );

		// Create setters that broadcast changes to peers.
		const localYjsChangeSymbol = Symbol( 'localYjsChangeSymbol' );
		setSetSelf( () => ( self ) => {
			instances[ instanceKey ].yDoc.transact( () => {
				instances[ instanceKey ].peers.set(
					instances[ instanceKey ].provider.room.peerId,
					{
						...self,
						peerId: instances[ instanceKey ].provider.room.peerId,
					}
				);
			}, localYjsChangeSymbol );
		} );
		setSetBlocks( () => {
			const setter = ( newBlocks ) => {
				_setBlocks( newBlocks );

				instances[ instanceKey ].yDoc.transact( () => {
					setYDocBlocks( instances[ instanceKey ].blocks, newBlocks );
				}, localYjsChangeSymbol );
			};
			// Sync remembered local changes.
			if ( initialBlocksRef.current ) setter( initialBlocksRef.current );
			return setter;
		} );

		// Set changes from peers.
		const maybeSetPeers = ( event, transaction ) => {
			if ( transaction.origin !== localYjsChangeSymbol ) {
				const newPeers = Object.values(
					instances[ instanceKey ].peers.toJSON()
				).filter(
					( peer ) =>
						peer.peerId !==
						instances[ instanceKey ].provider.room.peerId
				);
				setPeers( newPeers );
				if ( setAddBlockSelectionsState )
					setAddBlockSelectionsState( newPeers );
			}
		};
		const maybeSetBlocks = ( event, transaction ) => {
			if ( transaction.origin !== localYjsChangeSymbol )
				_setBlocks(
					yDocBlocksToArray( instances[ instanceKey ].blocks )
				);
		};
		instances[ instanceKey ].peers.observeDeep( maybeSetPeers );
		instances[ instanceKey ].blocks.observeDeep( maybeSetBlocks );
		return () => {
			instances[ instanceKey ].peers.unobserveDeep( maybeSetPeers );
			instances[ instanceKey ].blocks.unobserveDeep( maybeSetBlocks );
		};
	}, [ id, password ] );
	return {
		peers,
		setSelf,
		blocks,
		setBlocks,
	};
}
