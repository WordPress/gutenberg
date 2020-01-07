/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import './store';

export { default as DotTip } from './components/dot-tip';

deprecated( 'wp.nux', {
	hint: 'wp.components.Guide can be used to show a user guide.',
} );
