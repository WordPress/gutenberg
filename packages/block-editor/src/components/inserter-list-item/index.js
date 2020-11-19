/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { InserterListboxItem } from '../inserter-listbox';

function InserterListItem( {
	icon,
	onClick,
	isDisabled,
	title,
	className,
	isFirst,
	...props
} ) {
	const itemIconStyle = icon
		? {
				backgroundColor: icon.background,
				color: icon.foreground,
		  }
		: {};

	return (
		<div
			className="block-editor-block-types-list__list-item"
			role="presentation"
		>
			<InserterListboxItem
				className={ classnames(
					'block-editor-block-types-list__item',
					className
				) }
				onClick={ ( event ) => {
					event.preventDefault();
					onClick();
				} }
				disabled={ isDisabled }
				isFirst={ isFirst }
				{ ...props }
			>
				<span
					className="block-editor-block-types-list__item-icon"
					style={ itemIconStyle }
				>
					<BlockIcon icon={ icon } showColors />
				</span>
				<span className="block-editor-block-types-list__item-title">
					{ title }
				</span>
			</InserterListboxItem>
		</div>
	);
}

export default InserterListItem;
