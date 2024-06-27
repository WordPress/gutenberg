/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import withClientId from './with-client-id';

export const ButtonBlockAppender = ( {
	clientId,
	showSeparator,
	isFloating,
	onAddBlock,
	isToggle,
} ) => {
	return (
		<BaseButtonBlockAppender
			className={ clsx( {
				'block-list-appender__toggle': isToggle,
			} ) }
			rootClientId={ clientId }
			showSeparator={ showSeparator }
			isFloating={ isFloating }
			onAddBlock={ onAddBlock }
		/>
	);
};

export default withClientId( ButtonBlockAppender );
