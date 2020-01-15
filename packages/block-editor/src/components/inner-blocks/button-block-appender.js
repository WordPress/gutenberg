/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './with-client-id';

export const ButtonBlockAppender = ( { clientId, showSeparator } ) => {
	return (
		<BaseButtonBlockAppender rootClientId={ clientId } showSeparator={ showSeparator } />
	);
};

export default withClientId( ButtonBlockAppender );
