/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockRatings from '../block-ratings';
import DiscoverBlockAuthorInfo from '../discover-block-author-info';
import DiscoverBlockInfo from '../discover-block-info';

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
	} : undefined;

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
					<DiscoverBlockInfo description={ description } />
				</div>
				<div className="block-editor-discover-block-list-item__footer">
					<DiscoverBlockAuthorInfo />
				</div>
			</div>
		</li>
	);
}

export default DiscoverBlockListItem;
