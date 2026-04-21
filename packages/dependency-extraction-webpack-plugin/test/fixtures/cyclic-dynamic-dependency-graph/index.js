/**
 * Internal dependencies
 */
import { identity as bIdentity, store as bStore } from './b.js';

const { identity: aIdentity, store: aStore } = await import( './a.js' );

aStore( aIdentity( 'a' ), { a: aIdentity( 'a' ) } );
bStore( bIdentity( 'b' ), { b: bIdentity( 'b' ) } );
