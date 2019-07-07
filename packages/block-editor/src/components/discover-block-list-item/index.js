/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

function DiscoverBlockListItem( {
	icon,
	onClick,
	isDisabled,
	title,
	description,
	...props
} ) {
	const itemIconStyle = icon ? {
		backgroundColor: icon.background,
		color: icon.foreground,
	} : {};

	return (
		<li className="discover-blocks-list__list-item">
			<div className="discover-blocks-list__item-panel">
				<div className="discover-blocks-list__item-header">
					<div>
						<span
							className="discover-blocks-list__item-icon"
							style={ itemIconStyle }
						>
							<BlockIcon icon={ icon } showColors size={ 48 } />
						</span>
						<div>
							<span className="discover-blocks-list__item-title">
								{ title }
							</span>
							<div className="plugin-rating">
								<div className="wporg-ratings" aria-label="5 out of 5 stars" style={ { color: '#ffb900' } }>
									<span className="dashicons dashicons-star-filled"></span>
									<span className="dashicons dashicons-star-filled"></span>
									<span className="dashicons dashicons-star-filled"></span>
									<span className="dashicons dashicons-star-filled"></span>
									<span className="dashicons dashicons-star-filled"></span>
								</div>
								<span className="rating-count">
									(213)
								</span>
							</div>
						</div>
					</div>
					<Button
						isDefault
						onClick={ ( event ) => {
							event.preventDefault();
							onClick();
						} }
						disabled={ isDisabled }
						{ ...props }
					>
						Add
					</Button>
				</div>
				<span className="discover-blocks-list__item-description">
					{ description }
				</span>
			</div>
		</li>
	);
}

export default DiscoverBlockListItem;
