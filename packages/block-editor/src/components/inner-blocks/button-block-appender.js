/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './with-client-id';

export const ButtonBlockAppender = function( { clientId } ) {
	return (
		<BaseButtonBlockAppender rootClientId={ clientId } />
	);
};

export default withClientId( ButtonBlockAppender );
