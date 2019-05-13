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
	hasChildBlocksWithInserterSupport,
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
	const itemIconStackStyle = icon && icon.shadowColor ? {
		backgroundColor: icon.shadowColor,
	} : {};

	return (
		<li className="editor-block-types-list__list-item block-editor-block-types-list__list-item">
			<button
				className={
					classnames(
						'editor-block-types-list__item block-editor-block-types-list__item',
						className,
						{
							'editor-block-types-list__item-has-children block-editor-block-types-list__item-has-children':
								hasChildBlocksWithInserterSupport,
						}
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
					{ hasChildBlocksWithInserterSupport &&
						<span
							className="editor-block-types-list__item-icon-stack block-editor-block-types-list__item-icon-stack"
							style={ itemIconStackStyle }
						/>
					}
				</span>
				<span className="editor-block-types-list__item-title block-editor-block-types-list__item-title">
					{ title }
				</span>
			</button>
		</li>
	);
}

export default InserterListItem;
