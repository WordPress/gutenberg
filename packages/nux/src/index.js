/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export { store } from './store';
export { default as DotTip } from './components/dot-tip';

deprecated( 'wp.nux', {
	since: '5.4',
	hint: 'wp.components.Guide can be used to show a user guide.',
	version: '6.2',
} );
