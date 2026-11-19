import { store } from '@wordpress/interactivity';
import '@wordpress/interactivity-router';
import { speak } from '@wordpress/a11y';

store( 'static', { actions: { announce: () => speak( 'Hello' ) } } );
