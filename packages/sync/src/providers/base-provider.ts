/**
 * External dependencies
 */
import type * as Y from 'yjs';
import { ObservableV2 } from 'lib0/observable';
import { Awareness, removeAwarenessStates } from 'y-protocols/awareness';

export interface AwarenessChanges {
	added: number[];
	updated: number[];
	removed: number[];
}

export interface ProviderOptions {
	awareness?: Awareness;
	debug?: boolean;
	doc: Y.Doc;
	room: string;
	secret: string;
}

type EventTypes = Record< string, ( ...args: any[] ) => void >;

interface BaseEventTypes extends EventTypes {
	status: ( ...args: any[] ) => void;
	synced: ( event: { synced: boolean } ) => void;
}

/**
 * Yjs base provider
 */
export abstract class BaseProvider<
	Options extends ProviderOptions,
> extends ObservableV2< BaseEventTypes > {
	protected abstract name: string;

	protected awareness: Awareness;
	protected shouldConnect = true;

	public constructor( protected options: Options ) {
		super();

		this.log( 'Initializing', { room: options.room } );

		this.onAwarenessUpdate = this.onAwarenessUpdate.bind( this );
		this.onDocUpdate = this.onDocUpdate.bind( this );

		this.awareness = options.awareness ?? new Awareness( options.doc );
		this.awareness.on( 'update', this.onAwarenessUpdate );
		this.options.doc.on( 'update', this.onDocUpdate );
		this.connect();
	}

	/**
	 * Connect to the endpoint and initialize sync.
	 */
	public abstract connect(): void;

	/**
	 * Destroy the provider and cleanup resources.
	 */
	public destroy(): void {
		this.disconnect();
		super.destroy();
	}

	/**
	 * Destroy the provider and cleanup resources.
	 */
	public disconnect(): void {
		this.log( 'Disconnecting' );

		this.emitStatus( 'disconnected' );
		this.awareness.off( 'update', this.onAwarenessUpdate.bind( this ) );
		this.options.doc.off( 'update', this.onDocUpdate );
		this.shouldConnect = false;

		removeAwarenessStates(
			this.awareness,
			[ this.options.doc.clientID ],
			'provider disconnect'
		);

		super.destroy();
	}

	/**
	 * Emit connection status.
	 *
	 * @param status The connection status
	 */
	protected emitStatus( status: 'connected' | 'disconnected' ): void {
		this.emit( 'status', [ { status } ] );
	}

	/**
	 * Log debug messages if debugging is enabled.
	 *
	 * @param message The debug message
	 * @param debug   Additional debug information
	 */
	protected log( message: string, debug: object = {} ): void {
		if ( this.options.debug ) {
			// eslint-disable-next-line no-console
			console.log( `[${ this.name }]: ${ message }`, {
				room: this.options.room,
				...debug,
			} );
		}
	}

	/**
	 * Handle awareness updates.
	 *
	 * @param changes The awareness changes
	 * @param origin  The origin of the update
	 */
	protected abstract onAwarenessUpdate(
		changes: AwarenessChanges,
		origin: any
	): void;

	/**
	 * Handle document updates.
	 *
	 * @param update The document update
	 * @param origin The origin of the update
	 */
	protected abstract onDocUpdate( update: Uint8Array, origin: any ): void;
}
