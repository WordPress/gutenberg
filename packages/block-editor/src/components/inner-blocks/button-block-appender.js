/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import BaseButtonBlockAppender from '../button-block-appender';
import { useBlockEditContext } from '../block-edit/context';

export default function ButtonBlockAppender( {
	showSeparator,
	isFloating,
	onAddBlock,
	isToggle,
} ) {
	const { clientId } = useBlockEditContext();
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
}
