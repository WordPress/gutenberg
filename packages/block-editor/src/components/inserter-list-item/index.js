/**
 * External dependencies
 */
import classnames from 'classnames';
import { CompositeItem } from 'reakit';

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
	composite,
	...props
} ) {
	const itemIconStyle = icon
		? {
				backgroundColor: icon.background,
				color: icon.foreground,
		  }
		: {};

	return (
		<div className="block-editor-block-types-list__list-item">
			<CompositeItem
				role="option"
				as={ Button }
				{ ...composite }
				className={ classnames(
					'block-editor-block-types-list__item',
					className
				) }
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
			</CompositeItem>
		</div>
	);
}

export default InserterListItem;
