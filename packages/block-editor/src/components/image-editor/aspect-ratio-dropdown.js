/**
 * WordPress dependencies
 */
import { check, aspectRatio as aspectRatioIcon } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
			label={ __( 'Aspect Ratio' ) }
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
							// All ratios should be mirrored in AspectRatioTool in @wordpress/block-editor.
							{
								title: __( 'Original' ),
								aspect: defaultAspect,
							},
							{
								title: __( 'Square' ),
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
								title: __( '16:10' ),
								aspect: 16 / 10,
							},
							{
								title: __( '16:9' ),
								aspect: 16 / 9,
							},
							{
								title: __( '4:3' ),
								aspect: 4 / 3,
							},
							{
								title: __( '3:2' ),
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
								title: __( '10:16' ),
								aspect: 10 / 16,
							},
							{
								title: __( '9:16' ),
								aspect: 9 / 16,
							},
							{
								title: __( '3:4' ),
								aspect: 3 / 4,
							},
							{
								title: __( '2:3' ),
								aspect: 2 / 3,
							},
						] }
					/>
				</>
			) }
		</DropdownMenu>
	);
}
