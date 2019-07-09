/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';

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
							<BlockIcon icon={ icon } showColors />
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
									(XXX)
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
				<div className="discover-blocks-list__item-body">
					<span className="discover-blocks-list__item-description">
						{ description }
					</span>
					<div>
						<div>
							<Icon icon={ 'chart-line' }></Icon>XX active installations
						</div>
						<div>
							<Icon icon={ 'update' }></Icon>Updated X week ago.
						</div>
					</div>
				</div>
				<div className="discover-blocks-list__item-footer">
					<span className="discover-blocks-list__item-author-by">
						Authored by <strong>XXX</strong>
					</span>
					<span className="discover-blocks-list__item-author-info">
						This author has <strong>X</strong> blocks, with an average rating of <strong>X.X</strong>.
					</span>
					<span className="discover-blocks-list__item-support-time">
						They have an average support time of <strong>X days</strong>.
					</span>
				</div>
			</div>
		</li>
	);
}

export default DiscoverBlockListItem;
