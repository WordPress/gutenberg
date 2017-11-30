/**
 * External dependencies
 */
import Peer from 'simple-peer';
import uuidv1 from 'uuid/v1';
import { EventEmitter } from 'events';

/**
 * WordPress dependencies
 */
import { camelCaseKeysDeep } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import Signal from './signal';

export default class Coediting extends EventEmitter {
	/**
	 * @param {string} coeditingId global id representing document.
	 * uuid is uniquely generated id for coediting to happen
	 */
	constructor( coeditingId ) {
		super();
		this.peer = null;
		this.peerSignal = null;
		this.signalInstance = null;
		this.url = '/wp-json/coediting';
		this.coeditingId = coeditingId;
		this.peerId = Coediting.uuid();
		this.userId = null;
		this.otherPeers = new Set();
		this.listenSignalTimer = 0;
		this.listenSignalCount = 0;
		this.isConnected = false;
		this.keys = [];
		this.init();
	}

	/**
	 * Returns random color from a list of arrays.
	 *
	 * @return {string} color from array.
	 */
	static getColor() {
		const colors = [ 'red', 'purple', 'orange', 'yellow', 'green' ];
		return colors[ Math.floor( Math.random() * colors.length ) ];
	}

	/**
	 * Generates uuid which is used for url unique hash.
	 * @return {string} uuid.
	 */
	static uuid() {
		return uuidv1();
	}

	/**
	 * Check if you are initiator or not.
	 */
	isInitiator() {
		const data = {
			peer_id: this.peerId,
			type: 'initial',
		};

		window.fetch( this.url + '/set', {
			credentials: 'same-origin',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-WP-Nonce': window.wpApiSettings.nonce,
			},
			body: `${ encodeURIComponent( this.coeditingId ) }=${ window.btoa( JSON.stringify( data ) ) }`,
		} ).then(
			resp => resp.json()
		).then( ( resp ) => {
			this.emit( 'initiator', camelCaseKeysDeep( resp ) );
		} ).catch( () => {
			this.emit( 'initiator', false );
		} );
	}

	/**
	 * Listens for signals after finding initiator.
	 */
	listenSignal() {
		this.listenSignalRoutine();
		this.listenSignalTimer = setInterval( () => {
			this.listenSignalCount++;
			this.listenSignalRoutine();
		}, 3000 );
	}

	/**
	 * signal routine to continue in loop
	 */
	listenSignalRoutine() {
		this.signalInstance.getSignal().then( ( resp ) => {
			resp.forEach( ( peer ) => {
				if ( peer.peerId !== this.peerId && ! this.otherPeers.has( peer.peerId ) && peer.signal ) {
					this.otherPeers.add( peer.peerId );
					this.emit( 'peerFound', peer );
				}
			} );
		} );
	}

	/**
	 * peerHandler returns peer and signalReceived.
	 * signal received is immediate if initiator is true.
	 * signal received is not present if initiator is false it waits for initiator signal.
	 * @return {Promise} promise object
	 */
	peerHandler() {
		return new Promise( ( resolve ) => {
			this.peer = new Peer( {
				initiator: this.initiator === true,
				trickle: false,
			} );

			this.peer.on( 'signal', ( peerSignal ) => {
				this.peerSignal = peerSignal;
				resolve();
			} );

			this.on( 'peerFound', ( peer ) => {
				this.peer.signal( peer.signal );
			} );

			this.peer.on( 'signal', ( data ) => {
				this.emit( 'peerSignal', data );
			} );

			this.peer.on( 'connect', () => {
				this.emit( 'peerConnected' );
				this.isConnected = true;
			} );

			this.peer.on( 'data', ( data ) => {
				const parsedData = JSON.parse( data );

				this.emit( 'peerData', parsedData );
			} );

			this.peer.on( 'close', ( peer ) => {
				this.isConnected = false;
				this.emit( 'peerClosed', peer );
				clearInterval( this.listenSignalTimer );
				delete this._events.initiator;
				delete this._events.peerFound;
				this.init();
			} );

			/**
			 * Override peer send to automatically convert json.
			 * @param {string} data json wrapper
			 */
			this.send = function( data ) {
				this.peer.send( JSON.stringify( data ) );
			};
		} );
	}

	/**
	 * Called by contructor and main entry point of app.
	 */
	init() {
		this.isInitiator();

		/**
		 * Server decides if you get to initiate or not.
		 * Because of persistance independent of peers.
		 */
		this.on( 'initiator', ( resp ) => {
			// If not initiator start listening for signals.
			this.initiator = resp.initiator;
			this.userId = resp.userId;
			if ( ! this.initiator ) {
				this.signalInstance = new Signal( this.url, this.coeditingId, this.peerId, this.userId, this.peerSignal );
				this.listenSignal();
			}

			/**
			 * Will be resolved after initiator is set only.
			 */
			this.peerHandler().then( () => {
				this.signalInstance = new Signal( this.url, this.coeditingId, this.peerId, this.userId, this.peerSignal );
				this.signalInstance.updateSignal().then( () => {
					this.listenSignal();
				} );
			} );
		} );
	}
}
