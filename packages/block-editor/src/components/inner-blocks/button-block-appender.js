/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './with-client-id';

export const ButtonBlockAppender = ( {
	clientId,
	showSeparator,
	isFlex,
	onAddBlock,
} ) => {
	return (
		<BaseButtonBlockAppender
			rootClientId={ clientId }
			showSeparator={ showSeparator }
			isFlex={ isFlex }
			onAddBlock={ onAddBlock }
		/>
	);
};

export default withClientId( ButtonBlockAppender );
