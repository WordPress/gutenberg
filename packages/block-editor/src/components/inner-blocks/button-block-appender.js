/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './utils/with-client-id';

export const ButtonBlockAppender = function( { clientId } ) {
	return (
		<BaseButtonBlockAppender rootClientId={ clientId } />
	);
};

export default withClientId( ButtonBlockAppender );
