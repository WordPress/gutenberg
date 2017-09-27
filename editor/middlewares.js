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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Coediting from '../coediting';
import {
	clearFrozenBlock,
	createInfoNotice,
	freezeBlock,
	toggleCoediting,
} from './actions';
import { isCoeditingEnabled } from './selectors';

export function coeditingMiddleware( { dispatch, getState } ) {
	let app = null;

	const isPeerConnected = () => app && app.isConnected;

	const getActionPeerId = ( action ) => get( action, 'meta.peerId', null );

	const isPeerAction = ( action ) => getActionPeerId( action ) !== null;

	// Starts the coediting and enables its API.
	function startCoedting() {
		let coeditingId;
		if ( window.location.hash.length === 0 ) {
			coeditingId = Coediting.uuid();
			window.history.replaceState( '', '', '#' + coeditingId );
		} else {
			coeditingId = window.location.hash.slice( 1, window.location.hash.length );
		}

		app = new Coediting( coeditingId );
		app.on( 'peerData', onPeerData );
		app.on( 'peerConnected', function() {
			dispatch( createInfoNotice( __( 'Collaborator joined!' ) ) );
		} );
		app.on( 'peerClosed', function() {
			dispatch( createInfoNotice( __( 'Collaborator left!' ) ) );
		} );
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
		if ( ! isPeerConnected() || isPeerAction( action ) ) {
			return;
		}

		const allowedActions = [
			'COEDITING_CLEAR_FROZEN_BLOCK',
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
				peerId: app.peerId,
			},
		} );
	};

	function onPeerData( action ) {
		if ( getActionPeerId( action ) !== app.peerId ) {
			dispatch( action );
		}
	}

	return next => action => {
		const returnValue = next( action );

		const enabled = isCoeditingEnabled( getState() );

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
				peerSend( clearFrozenBlock() );
				break;
			default:
				peerSend( action );
		}

		return returnValue;
	};
}
