/**
 * WordPress dependencies
 */
import { check, aspectRatio as aspectRatioIcon } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../../use-settings';
import { useImageCropper } from './context';

function AspectRatioGroup( { aspectRatios, label, onClick, value } ) {
	return (
		<MenuGroup label={ label }>
			{ aspectRatios.map( ( { name, slug, ratio } ) => (
				<MenuItem
					key={ slug }
					onClick={ () => {
						onClick( ratio );
					} }
					role="menuitemradio"
					isSelected={ ratio.toFixed( 4 ) === value.toFixed( 4 ) }
					icon={ ratio === value ? check : undefined }
				>
					{ name }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

export function ratioToNumber( str ) {
	// TODO: support two-value aspect ratio?
	// https://css-tricks.com/almanac/properties/a/aspect-ratio/#aa-it-can-take-two-values
	const [ a, b, ...rest ] = str.split( '/' ).map( Number );
	if (
		a <= 0 ||
		b <= 0 ||
		Number.isNaN( a ) ||
		Number.isNaN( b ) ||
		rest.length
	) {
		return NaN;
	}
	return b ? a / b : a;
}

function presetRatioAsNumber( { ratio, ...rest } ) {
	return {
		ratio: ratioToNumber( ratio ),
		...rest,
	};
}

export default function AspectRatioDropdown( { toggleProps } ) {
	const {
		state: { image, cropper },
		dispatch,
	} = useImageCropper();
	const defaultAspect = image.width / image.height;
	const aspectRatio = cropper.width / cropper.height;

	const [ defaultRatios, themeRatios, showDefaultRatios ] = useSettings(
		'dimensions.aspectRatios.default',
		'dimensions.aspectRatios.theme',
		'dimensions.defaultAspectRatios'
	);

	return (
		<DropdownMenu
			icon={ aspectRatioIcon }
			label={ __( 'Aspect Ratio' ) }
			popoverProps={ { placement: 'bottom-start' } }
			toggleProps={ toggleProps }
		>
			{ ( { onClose } ) => (
				<>
					<AspectRatioGroup
						onClick={ ( newAspect ) => {
							if ( newAspect === 0 ) {
								dispatch( { type: 'UNLOCK_ASPECT_RATIO' } );
							} else {
								dispatch( {
									type: 'LOCK_ASPECT_RATIO',
									aspectRatio: newAspect,
								} );
							}
							onClose();
						} }
						value={ aspectRatio }
						aspectRatios={ [
							// All ratios should be mirrored in AspectRatioTool in @wordpress/block-editor.
							{
								slug: 'free',
								name: __( 'Free' ),
								ratio: 0,
							},
							{
								slug: 'original',
								name: __( 'Original' ),
								ratio: defaultAspect,
							},
							...( showDefaultRatios
								? defaultRatios
										.map( presetRatioAsNumber )
										.filter( ( { ratio } ) => ratio === 1 )
								: [] ),
						] }
					/>
					{ themeRatios?.length > 0 && (
						<AspectRatioGroup
							label={ __( 'Theme' ) }
							onClick={ ( newAspect ) => {
								dispatch( {
									type: 'LOCK_ASPECT_RATIO',
									aspectRatio: newAspect,
								} );
								onClose();
							} }
							value={ aspectRatio }
							aspectRatios={ themeRatios }
						/>
					) }
					{ showDefaultRatios && (
						<AspectRatioGroup
							label={ __( 'Landscape' ) }
							onClick={ ( newAspect ) => {
								dispatch( {
									type: 'LOCK_ASPECT_RATIO',
									aspectRatio: newAspect,
								} );
								onClose();
							} }
							value={ aspectRatio }
							aspectRatios={ defaultRatios
								.map( presetRatioAsNumber )
								.filter( ( { ratio } ) => ratio > 1 ) }
						/>
					) }
					{ showDefaultRatios && (
						<AspectRatioGroup
							label={ __( 'Portrait' ) }
							onClick={ ( newAspect ) => {
								dispatch( {
									type: 'LOCK_ASPECT_RATIO',
									aspectRatio: newAspect,
								} );
								onClose();
							} }
							value={ aspectRatio }
							aspectRatios={ defaultRatios
								.map( presetRatioAsNumber )
								.filter( ( { ratio } ) => ratio < 1 ) }
						/>
					) }
				</>
			) }
		</DropdownMenu>
	);
}
