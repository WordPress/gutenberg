/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BBlockAppender from '../button-block-appender';
import withClientId from './utils/with-client-id';

const ButtonBlockAppender = compose( [
	withClientId,
] )( function( { clientId } ) {
	return (
		<BBlockAppender rootClientId={ clientId } />
	);
} );

export default ButtonBlockAppender;
