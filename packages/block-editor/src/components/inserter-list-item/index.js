/**
 * External dependencies
 */
import classnames from 'classnames';
import { CompositeItem } from 'reakit';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import InserterContext from '../inserter/context';

function InserterListItem( {
	icon,
	onClick,
	isDisabled,
	title,
	className,
	isFirst,
	...props
} ) {
	const compositeState = useContext( InserterContext );
	const itemIconStyle = icon
		? {
				backgroundColor: icon.background,
				color: icon.foreground,
		  }
		: {};

	return (
		<div className="block-editor-block-types-list__list-item">
			<CompositeItem
				state={ compositeState }
				role="option"
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
				{ ( htmlProps ) => (
					<Button
						{ ...htmlProps }
						tabIndex={ isFirst ? 0 : htmlProps.tabIndex }
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
				) }
			</CompositeItem>
		</div>
	);
}

export default InserterListItem;
