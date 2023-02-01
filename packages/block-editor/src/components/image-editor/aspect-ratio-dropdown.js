/**
 * WordPress dependencies
 */
import { check, aspectRatio as aspectRatioIcon } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';
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

function ratioToNumber( str ) {
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

export default function AspectRatioDropdown( { toggleProps } ) {
	const { isInProgress, aspect, setAspect, defaultAspect } =
		useImageEditingContext();

	const [ themeRatios ] =
		useSettings( [ 'dimensions.aspectRatios.theme' ] ) || [];
	const [ showDefaultRatios ] = useSettings( [
		'dimensions.defaultAspectRatios',
	] );

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
							...( showDefaultRatios
								? [
										{
											title: __( 'Square' ),
											aspect: 1,
										},
								  ]
								: [] ),
						] }
					/>
					{ themeRatios.length > 0 && (
						<AspectGroup
							label={ __( 'Theme' ) }
							isDisabled={ isInProgress }
							onClick={ ( newAspect ) => {
								setAspect( newAspect );
								onClose();
							} }
							value={ aspect }
							aspectRatios={ themeRatios.map(
								( { name, ratio } ) => ( {
									title: name,
									aspect: ratioToNumber( ratio ),
								} )
							) }
						/>
					) }
					{ showDefaultRatios && (
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
					) }
					{ showDefaultRatios && (
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
					) }
				</>
			) }
		</DropdownMenu>
	);
}
