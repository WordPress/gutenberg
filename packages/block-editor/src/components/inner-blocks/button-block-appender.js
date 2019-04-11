/**
 * Internal dependencies
 */
import BBlockAppender from '../button-block-appender';
import withClientId from './utils/with-client-id';

export const ButtonBlockAppender = function( { clientId } ) {
	return (
		<BBlockAppender rootClientId={ clientId } />
	);
};

export default withClientId( ButtonBlockAppender );
