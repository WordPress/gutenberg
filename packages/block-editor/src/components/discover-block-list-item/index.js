/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockRatings from '../block-ratings';

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
		<li className="block-editor-discover-block-list-item">
			<div className="block-editor-discover-block-list-item__panel">
				<div className="block-editor-discover-block-list-item__header">
					<div>
						<span
							className="block-editor-discover-block-list-item__icon"
							style={ itemIconStyle }
						>
							<BlockIcon icon={ icon } showColors />
						</span>
						<div>
							<span className="block-editor-discover-block-list-item__title">
								{ title }
							</span>
							<BlockRatings rating={ 4.5 } ratingCount={ 110 } />
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
				<div className="block-editor-discover-block-list-item__body">
					<span className="block-editor-discover-block-list-item__content-description">
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
				<div className="block-editor-discover-block-list-item__footer">
					<span className="block-editor-discover-block-list-item__content-footer">
						Authored by <strong>XXX</strong>
					</span>
					<span className="block-editor-discover-block-list-item__content-footer">
						This author has <strong>X</strong> blocks, with an average rating of <strong>X.X</strong>.
					</span>
					<span className="block-editor-discover-block-list-item__content-footer">
						They have an average support time of <strong>X days</strong>.
					</span>
				</div>
			</div>
		</li>
	);
}

export default DiscoverBlockListItem;
