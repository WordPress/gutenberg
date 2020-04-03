/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './with-client-id';

export const ButtonBlockAppender = ( {
	clientId,
	showSeparator,
	onAddBlock,
} ) => {
	return (
		<BaseButtonBlockAppender
			rootClientId={ clientId }
			showSeparator={ showSeparator }
			onAddBlock={ onAddBlock }
		/>
	);
};

export default withClientId( ButtonBlockAppender );
