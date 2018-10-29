/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { normalizeIconObject } from '../../utils/icon';

function InserterListItem( {
	icon,
	hasChildBlocksWithInserterSupport,
	onClick,
	isDisabled,
	title,
	className,
	...props
} ) {
	const normalizedIcon = normalizeIconObject( icon );

	const itemIconStyle = normalizedIcon ? {
		backgroundColor: normalizedIcon.background,
		color: normalizedIcon.foreground,
	} : {};
	const itemIconStackStyle = normalizedIcon && normalizedIcon.shadowColor ? {
		backgroundColor: normalizedIcon.shadowColor,
	} : {};

	return (
		<li className="editor-block-types-list__list-item">
			<button
				className={
					classnames(
						'editor-block-types-list__item',
						className,
						{
							'editor-block-types-list__item-has-children':
								hasChildBlocksWithInserterSupport,
						}
					)
				}
				onClick={ ( event ) => {
					event.preventDefault();
					onClick();
				} }
				disabled={ isDisabled }
				aria-label={ title } // Fix for IE11 and JAWS 2018.
				{ ...props }
			>
				<span
					className="editor-block-types-list__item-icon"
					style={ itemIconStyle }
				>
					<BlockIcon icon={ normalizedIcon } showColors />
					{ hasChildBlocksWithInserterSupport &&
						<span
							className="editor-block-types-list__item-icon-stack"
							style={ itemIconStackStyle }
						/>
					}
				</span>
				<span className="editor-block-types-list__item-title">
					{ title }
				</span>
			</button>
		</li>
	);
}

export default InserterListItem;
