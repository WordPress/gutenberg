/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './with-client-id';

export const ButtonBlockAppender = ( {
	clientId,
	showSeparator,
	customOnAdd,
} ) => {
	return (
		<BaseButtonBlockAppender
			rootClientId={ clientId }
			showSeparator={ showSeparator }
			customOnAdd={ customOnAdd }
		/>
	);
};

export default withClientId( ButtonBlockAppender );
