/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

// A non-object state should never be allowed.
store( 'test/bad-initial-state', { state: [ 'wrong' ] } );

store( 'test/bad-initial-state', { state: { 0: 'right' } } );
