/**
 * External dependencies
 */
import {
	get,
	includes,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import CoeditingClient from '../client';
import {
	clearFrozenBlocks,
	freezeBlock,
	toggleCoediting,
} from 'coediting/store';
import { REDUCER_KEY } from './';

export default function coeditingMiddleware( { dispatch } ) {
	let app = null;

	const isPeerConnected = () => app && app.isConnected;

	const getActionCollaboratorId = ( action ) => get( action, 'meta.collaboratorId', null );

	const isCoeditingAction = ( action ) => getActionCollaboratorId( action ) !== null;

	// Starts the coediting and enables its API.
	function startCoedting() {
		let coeditingId;
		if ( window.location.hash.length === 0 ) {
			coeditingId = CoeditingClient.uuid();
			window.history.replaceState( '', '', '#' + coeditingId );
		} else {
			coeditingId = window.location.hash.slice( 1, window.location.hash.length );
		}

		app = new CoeditingClient( coeditingId );
		app.on( 'peerData', onPeerData );
		app.on( 'peerFound', function( { peerId, userId } ) {
			// TODO: Convert to action
			dispatch( {
				type: 'COEDITING_COLLABORATOR_ADD',
				collaboratorId: peerId,
				userId,
			} );
		} );
		// TODO: Remove collaborators when disconnected
	}

	const stopCoediting = () => {
		if ( ! app ) {
			return;
		}

		if ( isPeerConnected() ) {
			app.peer.destroy();
		}
		app = null;
		window.history.replaceState( '', '', '#' );
	};

	const peerSend = ( action ) => {
		if ( ! isPeerConnected() || isCoeditingAction( action ) ) {
			return;
		}

		const allowedActions = [
			'COEDITING_BLOCKS_UNFREEZE',
			'COEDITING_FREEZE_BLOCK',
			'EDIT_POST',
			'INSERT_BLOCKS',
			'MOVE_BLOCKS_DOWN',
			'MOVE_BLOCKS_UP',
			'REMOVE_BLOCKS',
			'REPLACE_BLOCKS',
			'UPDATE_BLOCK_ATTRIBUTES',
		];

		if ( ! includes( allowedActions, action.type ) ) {
			return;
		}

		app.send( {
			...action,
			meta: {
				collaboratorId: app.peerId,
			},
		} );
	};

	function onPeerData( action ) {
		if ( getActionCollaboratorId( action ) !== app.peerId ) {
			dispatch( action );
		}
	}

	return next => action => {
		const returnValue = next( action );

		const enabled = select( REDUCER_KEY, 'isCoeditingEnabled' );

		switch ( action.type ) {
			case 'SETUP_EDITOR':
				// If url is shared, enable the coediting mode automatically.
				if ( ! enabled && window.location.hash.length !== 0 ) {
					dispatch( toggleCoediting() );
				}
				break;
			case 'COEDITING_TOGGLE':
				if ( enabled ) {
					startCoedting();
				} else {
					stopCoediting();
				}
				break;
			case 'SELECT_BLOCK':
				peerSend( freezeBlock( action.uid ) );
				break;
			case 'CLEAR_SELECTED_BLOCK':
				peerSend( clearFrozenBlocks() );
				break;
			default:
				peerSend( action );
		}

		return returnValue;
	};
}
