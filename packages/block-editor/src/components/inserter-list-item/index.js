/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

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
		<li className="block-editor-block-types-list__list-item">
			<Button
				className={
					classnames(
						'block-editor-block-types-list__item',
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
					className="block-editor-block-types-list__item-icon"
					style={ itemIconStyle }
				>
					<BlockIcon icon={ icon } showColors />
				</span>
				<span className="block-editor-block-types-list__item-title">
					{ title }
				</span>
			</Button>
		</li>
	);
}

export default InserterListItem;
