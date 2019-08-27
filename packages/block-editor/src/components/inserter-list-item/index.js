/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function InserterListItem( {
	icon,
	onClick,
	isDisabled,
	title,
	className,
	...props
} ) {
	const itemIconStyle = icon ? {
		backgroundColor: icon.background,
		color: icon.foreground,
	} : {};

	return (
		<li className="editor-block-types-list__list-item block-editor-block-types-list__list-item">
			<button
				className={
					classnames(
						'editor-block-types-list__item block-editor-block-types-list__item',
						className
					)
				}
				onClick={ ( event ) => {
					event.preventDefault();
					onClick();
				} }
				disabled={ isDisabled }
				{ ...props }
			>
				<span
					className="editor-block-types-list__item-icon block-editor-block-types-list__item-icon"
					style={ itemIconStyle }
				>
					<BlockIcon icon={ icon } showColors />
				</span>
				<span className="editor-block-types-list__item-title block-editor-block-types-list__item-title">
					{ title }
				</span>
			</button>
		</li>
	);
}

export default InserterListItem;
