/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockRatings from '../block-ratings';

function DiscoverBlockHeader( { icon, title, onClick } ) {
	const itemIconStyle = icon ? {
		backgroundColor: icon.background,
		color: icon.foreground,
	} : undefined;

	return (
		<Fragment>
			<div className="block-editor-discover-block-header__row">
				<span style={ itemIconStyle } >
					<BlockIcon icon={ icon } showColors />
				</span>
				<div className="block-editor-discover-block-header__column">
					<span className="block-editor-discover-block-header__title">
						{ title }
					</span>
					<BlockRatings rating={ 4.5 } ratingCount={ 110 } />
				</div>
				<Button
					isDefault
					onClick={ ( event ) => {
						event.preventDefault();
						onClick();
					} }
				>
					{ __( 'Add' ) }
				</Button>
			</div>
		</Fragment>
	);
}

export default DiscoverBlockHeader;
