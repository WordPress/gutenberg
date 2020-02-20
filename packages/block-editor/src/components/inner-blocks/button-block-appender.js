/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './with-client-id';

export const ButtonBlockAppender = ( {
	clientId,
	showSeparator,
	flex,
	customOnAdd,
} ) => {
	return (
		<BaseButtonBlockAppender
			rootClientId={ clientId }
			showSeparator={ showSeparator }
			flex={ flex }
			customOnAdd={ customOnAdd }
		/>
	);
};

export default withClientId( ButtonBlockAppender );
