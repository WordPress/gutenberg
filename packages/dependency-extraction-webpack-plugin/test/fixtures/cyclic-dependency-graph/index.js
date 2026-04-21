/**
 * Internal dependencies
 */
import { identity as aIdentity, store as aStore } from './a.js';
import { identity as bIdentity, store as bStore } from './b.js';

aStore( aIdentity( 'a' ), { a: aIdentity( 'a' ) } );
bStore( bIdentity( 'b' ), { b: bIdentity( 'b' ) } );
