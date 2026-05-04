( function () {
	const TEST_PROVIDER_NAMESPACE = 'gutenberg-test/rtc-websocket-provider';
	const DEFAULT_URL = 'ws://127.0.0.1:18991';
	const REMOTE_ORIGIN = { source: TEST_PROVIDER_NAMESPACE };

	const settings = window.gutenbergTestWebSocketSync || {};
	const globalState = ( window.__gutenbergTestWebSocketSync = {
		controls: {},
		rooms: {},
		tick: 0,
		url: settings.url || DEFAULT_URL,
		delayNextMessage( delayMs ) {
			this.controls.delayNextMessageMs = Number( delayMs ) || 0;
		},
		closeNextSocket() {
			this.controls.closeNextSocket = true;
		},
	} );

	function toBase64( bytes ) {
		let binary = '';
		for ( let offset = 0; offset < bytes.length; offset += 0x8000 ) {
			binary += String.fromCharCode.apply(
				null,
				bytes.subarray( offset, offset + 0x8000 )
			);
		}
		return window.btoa( binary );
	}

	function fromBase64( value ) {
		const binary = window.atob( value );
		const bytes = new Uint8Array( binary.length );
		for ( let i = 0; i < binary.length; i++ ) {
			bytes[ i ] = binary.charCodeAt( i );
		}
		return bytes;
	}

	function ensureRoomDebugState( room ) {
		if ( ! globalState.rooms[ room ] ) {
			globalState.rooms[ room ] = {
				awarenessCount: 0,
				clientId: null,
				receivedMessages: 0,
				sentMessages: 0,
				status: 'disconnected',
			};
		}
		return globalState.rooms[ room ];
	}

	function updateDebugState( room, patch ) {
		Object.assign( ensureRoomDebugState( room ), patch );
		globalState.tick += 1;
	}

	function emitAwarenessChange( awareness, change ) {
		awareness.emit( 'change', [ change ] );
	}

	function applyAwarenessState( awareness, state ) {
		const currentStates = awareness.getStates();
		const added = [];
		const updated = [];
		const removed = [];

		for ( const [ clientIdString, awarenessState ] of Object.entries(
			state || {}
		) ) {
			const clientId = Number( clientIdString );
			if ( clientId === awareness.clientID ) {
				continue;
			}

			if ( awarenessState === null ) {
				if ( currentStates.delete( clientId ) ) {
					removed.push( clientId );
				}
				continue;
			}

			if ( ! currentStates.has( clientId ) ) {
				currentStates.set( clientId, awarenessState );
				added.push( clientId );
				continue;
			}

			if (
				JSON.stringify( currentStates.get( clientId ) ) !==
				JSON.stringify( awarenessState )
			) {
				currentStates.set( clientId, awarenessState );
				updated.push( clientId );
			}
		}

		if ( added.length || updated.length || removed.length ) {
			emitAwarenessChange( awareness, { added, updated, removed } );
		}
	}

	function removeAwarenessClients( awareness, clientIds ) {
		const removed = [];
		for ( const clientId of clientIds || [] ) {
			const normalizedClientId = Number( clientId );
			if (
				normalizedClientId !== awareness.clientID &&
				awareness.getStates().delete( normalizedClientId )
			) {
				removed.push( normalizedClientId );
			}
		}

		if ( removed.length ) {
			emitAwarenessChange( awareness, {
				added: [],
				updated: [],
				removed,
			} );
		}
	}

	class TestWebSocketProvider {
		constructor( { awareness, room, ydoc } ) {
			this.awareness = awareness || new window.wp.sync.Awareness( ydoc );
			this.destroyed = false;
			this.listeners = {
				status: new Set(),
			};
			this.pendingMessages = [];
			this.reconnectDelayMs = 250;
			this.room = room;
			this.socket = null;
			this.ydoc = ydoc;

			this.onDocUpdate = this.onDocUpdate.bind( this );
			this.onAwarenessUpdate = this.onAwarenessUpdate.bind( this );
			this.ydoc.on( 'updateV2', this.onDocUpdate );
			this.awareness.on( 'change', this.onAwarenessUpdate );

			updateDebugState( this.room, {
				clientId: this.ydoc.clientID,
				status: 'connecting',
			} );
			this.connect();
		}

		on( event, callback ) {
			if ( this.listeners[ event ] ) {
				this.listeners[ event ].add( callback );
			}
		}

		emitStatus( status ) {
			updateDebugState( this.room, { status: status.status } );
			for ( const callback of this.listeners.status ) {
				callback( status );
			}
		}

		connect() {
			if ( this.destroyed ) {
				return;
			}

			this.emitStatus( { status: 'connecting' } );
			const socket = new window.WebSocket( globalState.url );
			this.socket = socket;

			socket.addEventListener( 'open', () => {
				this.reconnectDelayMs = 250;
				this.emitStatus( { status: 'connected' } );
				this.send( {
					type: 'join',
					room: this.room,
					clientId: this.ydoc.clientID,
					awareness: this.awareness.getLocalState() || {},
					state: toBase64(
						window.wp.sync.Y.encodeStateAsUpdateV2( this.ydoc )
					),
				} );
				this.flushPendingMessages();
			} );

			socket.addEventListener( 'message', ( event ) => {
				this.handleMessage( event.data );
			} );

			socket.addEventListener( 'close', () => {
				if ( this.destroyed ) {
					return;
				}

				this.emitStatus( { status: 'disconnected' } );
				const delay = this.reconnectDelayMs;
				this.reconnectDelayMs = Math.min(
					this.reconnectDelayMs * 2,
					5000
				);
				window.setTimeout( () => this.connect(), delay );
			} );

			socket.addEventListener( 'error', () => {
				if ( ! this.destroyed ) {
					this.emitStatus( { status: 'disconnected' } );
				}
			} );
		}

		flushPendingMessages() {
			const messages = this.pendingMessages.splice( 0 );
			for ( const message of messages ) {
				this.send( message );
			}
		}

		send( payload ) {
			if ( ! this.socket || this.socket.readyState !== WebSocket.OPEN ) {
				if ( ! this.destroyed ) {
					this.pendingMessages.push( payload );
				}
				return;
			}

			const sendNow = () => {
				if (
					globalState.controls.closeNextSocket &&
					this.socket.readyState === WebSocket.OPEN
				) {
					globalState.controls.closeNextSocket = false;
					this.pendingMessages.unshift( payload );
					this.socket.close( 4000, 'Injected test close' );
					return;
				}

				this.socket.send( JSON.stringify( payload ) );
				const state = ensureRoomDebugState( this.room );
				updateDebugState( this.room, {
					sentMessages: state.sentMessages + 1,
				} );
			};

			const delayMs = globalState.controls.delayNextMessageMs || 0;
			if ( delayMs > 0 ) {
				globalState.controls.delayNextMessageMs = 0;
				window.setTimeout( sendNow, delayMs );
				return;
			}

			sendNow();
		}

		handleMessage( rawMessage ) {
			let message;
			try {
				message = JSON.parse( rawMessage );
			} catch {
				return;
			}

			if ( message.room && message.room !== this.room ) {
				return;
			}

			const state = ensureRoomDebugState( this.room );
			updateDebugState( this.room, {
				receivedMessages: state.receivedMessages + 1,
			} );

			if ( message.type === 'snapshot' ) {
				for ( const update of message.updates || [] ) {
					window.wp.sync.Y.applyUpdateV2(
						this.ydoc,
						fromBase64( update ),
						REMOTE_ORIGIN
					);
				}
				applyAwarenessState( this.awareness, message.awareness );
			} else if (
				message.type === 'update' &&
				message.clientId !== this.ydoc.clientID
			) {
				window.wp.sync.Y.applyUpdateV2(
					this.ydoc,
					fromBase64( message.update ),
					REMOTE_ORIGIN
				);
			} else if ( message.type === 'awareness' ) {
				applyAwarenessState( this.awareness, message.awareness );
			} else if ( message.type === 'remove-awareness' ) {
				removeAwarenessClients( this.awareness, message.clientIds );
			}

			updateDebugState( this.room, {
				awarenessCount: this.awareness.getStates().size,
			} );
		}

		onDocUpdate( update, origin ) {
			if ( origin === REMOTE_ORIGIN ) {
				return;
			}

			this.send( {
				type: 'update',
				room: this.room,
				clientId: this.ydoc.clientID,
				update: toBase64( update ),
			} );
		}

		onAwarenessUpdate() {
			updateDebugState( this.room, {
				awarenessCount: this.awareness.getStates().size,
			} );
			this.send( {
				type: 'awareness',
				room: this.room,
				clientId: this.ydoc.clientID,
				awareness: this.awareness.getLocalState() || {},
			} );
		}

		destroy() {
			this.destroyed = true;
			this.pendingMessages = [];
			this.ydoc.off( 'updateV2', this.onDocUpdate );
			this.awareness.off( 'change', this.onAwarenessUpdate );
			this.send( {
				type: 'leave',
				room: this.room,
				clientId: this.ydoc.clientID,
			} );

			if ( this.socket ) {
				this.socket.close( 1000, 'destroy' );
			}

			this.emitStatus( { status: 'disconnected' } );
		}
	}

	function createWebSocketProvider() {
		return async ( { awareness, objectType, objectId, ydoc } ) => {
			const room = objectId
				? `${ objectType }:${ objectId }`
				: objectType;
			const provider = new TestWebSocketProvider( {
				awareness,
				room,
				ydoc,
			} );

			return {
				destroy: () => provider.destroy(),
				on: ( event, callback ) => provider.on( event, callback ),
			};
		};
	}

	window.wp.hooks.addFilter(
		'sync.providers',
		TEST_PROVIDER_NAMESPACE,
		() => [ createWebSocketProvider() ]
	);
} )();
