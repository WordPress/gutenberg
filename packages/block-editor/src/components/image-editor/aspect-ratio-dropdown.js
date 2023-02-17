/**
 * WordPress dependencies
 */
import { check, aspectRatio as aspectRatioIcon } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { POPOVER_PROPS } from './constants';
import { useImageEditingContext } from './context';

function AspectGroup( { aspectRatios, isDisabled, label, onClick, value } ) {
	return (
		<MenuGroup label={ label }>
			{ aspectRatios.map( ( { title, aspect } ) => (
				<MenuItem
					key={ aspect }
					disabled={ isDisabled }
					onClick={ () => {
						onClick( aspect );
					} }
					role="menuitemradio"
					isSelected={ aspect === value }
					icon={ aspect === value ? check : undefined }
				>
					{ title }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

export default function AspectRatioDropdown( { toggleProps } ) {
	const { isInProgress, aspect, setAspect, defaultAspect } =
		useImageEditingContext();

	return (
		<DropdownMenu
			icon={ aspectRatioIcon }
			label={ __( 'Aspect ratio' ) }
			popoverProps={ POPOVER_PROPS }
			toggleProps={ toggleProps }
			className="wp-block-image__aspect-ratio"
		>
			{ ( { onClose } ) => (
				<>
					<AspectGroup
						isDisabled={ isInProgress }
						onClick={ ( newAspect ) => {
							setAspect( newAspect );
							onClose();
						} }
						value={ aspect }
						aspectRatios={ [
							// All ratios should be mirrored in PostFeaturedImage in @wordpress/block-library
							{
								title: _x( 'Original', 'aspect ratio' ),
								aspect: defaultAspect,
							},
							{
								title: _x( 'Square', 'aspect ratio' ),
								aspect: 1,
							},
						] }
					/>
					<AspectGroup
						label={ __( 'Landscape' ) }
						isDisabled={ isInProgress }
						onClick={ ( newAspect ) => {
							setAspect( newAspect );
							onClose();
						} }
						value={ aspect }
						aspectRatios={ [
							{
								title: _x( '16:10', 'aspect ratio' ),
								aspect: 16 / 10,
							},
							{
								title: _x( '16:9', 'aspect ratio' ),
								aspect: 16 / 9,
							},
							{
								title: _x( '4:3', 'aspect ratio' ),
								aspect: 4 / 3,
							},
							{
								title: _x( '3:2', 'aspect ratio' ),
								aspect: 3 / 2,
							},
						] }
					/>
					<AspectGroup
						label={ __( 'Portrait' ) }
						isDisabled={ isInProgress }
						onClick={ ( newAspect ) => {
							setAspect( newAspect );
							onClose();
						} }
						value={ aspect }
						aspectRatios={ [
							{
								title: _x( '10:16', 'aspect ratio' ),
								aspect: 10 / 16,
							},
							{
								title: _x( '9:16', 'aspect ratio' ),
								aspect: 9 / 16,
							},
							{
								title: _x( '3:4', 'aspect ratio' ),
								aspect: 3 / 4,
							},
							{
								title: _x( '2:3', 'aspect ratio' ),
								aspect: 2 / 3,
							},
						] }
					/>
				</>
			) }
		</DropdownMenu>
	);
}
