/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './with-client-id';

export const ButtonBlockAppender = ( {
	clientId,
	className,
	showSeparator,
	isFloating,
	onAddBlock,
} ) => {
	return (
		<BaseButtonBlockAppender
			rootClientId={ clientId }
			className={ className }
			showSeparator={ showSeparator }
			isFloating={ isFloating }
			onAddBlock={ onAddBlock }
		/>
	);
};

export default withClientId( ButtonBlockAppender );
