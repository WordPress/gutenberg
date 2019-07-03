/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function DiscoverBlockListItem( {
	icon,
	onClick,
	isDisabled,
	title,
	className,
	description,
	...props
} ) {
	const itemIconStyle = icon ? {
		backgroundColor: icon.background,
		color: icon.foreground,
	} : {};

	return (
		<li className="discover-blocks-list__list-item">
			<button
				className={
					classnames(
						'discover-blocks-list__item',
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
					className="discover-blocks-list__item-icon"
					style={ itemIconStyle }
				>
					<BlockIcon icon={ icon } showColors size={ 24 } />
				</span>
				<div className="discover-blocks-list__item-panel">
					<span className="discover-blocks-list__item-title">
						{ title }
					</span>
					<span className="discover-blocks-list__item-description">
						{ description }
					</span>
				</div>
			</button>
		</li>
	);
}

export default DiscoverBlockListItem;
