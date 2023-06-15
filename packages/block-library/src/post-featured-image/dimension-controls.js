/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	SelectControl,
	Dropdown,
	Button,
	Flex,
	RangeControl,
	BaseControl,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
	__experimentalVStack as VStack,
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalItemGroup as ItemGroup,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { InspectorControls, useSetting } from '@wordpress/block-editor';
import { Icon, landscape, portrait, aspectRatio } from '@wordpress/icons';

const LabeledColorIndicator = ( { indicator, label } ) => (
	<HStack justify="flex-start">
		<ZStack isLayered={ false } offset={ -8 }>
			<Flex expanded={ false }>
				{ indicator === 'unset' || ! indicator ? (
					<Icon
						className="block-editor-global-styles-effects-panel__toggle-icon"
						icon={ aspectRatio }
						size={ 24 }
					/>
				) : (
					<Icon
						className="block-editor-global-styles-effects-panel__toggle-icon"
						icon={ aspectRatio }
						size={ 24 }
					/>
				) }
			</Flex>
		</ZStack>
		<FlexItem title={ label }>{ label }</FlexItem>
	</HStack>
);

const DEFAULT_SIZE = 'full';

const DimensionControls = ( {
	clientId,
	attributes: { width, height, sizeSlug },
	setAttributes,
	mediaUrl,
	imageSizeOptions = [],
} ) => {
	const defaultUnits = [ 'px', '%', 'vw', 'em', 'rem' ];
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || defaultUnits,
	} );
	const onDimensionChange = ( dimension, nextValue ) => {
		const parsedValue = parseFloat( nextValue );
		/**
		 * If we have no value set and we change the unit,
		 * we don't want to set the attribute, as it would
		 * end up having the unit as value without any number.
		 */
		if ( isNaN( parsedValue ) && nextValue ) return;
		setAttributes( {
			[ dimension ]: parsedValue < 0 ? '0' : nextValue,
		} );
	};

	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
		className: 'block-editor-duotone-control__popover',
		headerTitle: __( 'Duotone' ),
	};

	const options = [
		{
			label: __( 'Original' ),
			value: 'auto',
		},
		{
			label: __( '16:9' ),
			value: '16/9',
			scale: '1.777',
		},
		{
			label: __( '3:2' ),
			value: '3/2',
			scale: '1.5',
		},
		{
			label: __( '7:5' ),
			value: '7/5',
			scale: '1.4',
		},
		{
			label: __( '4:3' ),
			value: '4/3',
			scale: '1.333',
		},
		{
			label: __( 'Square' ),
			value: '1',
			scale: '1',
		},
		{
			label: __( '3:4' ),
			value: '3/4',
			scale: '1',
		},
		{
			label: __( '5:7' ),
			value: '5/7',
			scale: '1',
		},
		{
			label: __( '2:3' ),
			value: '2/3',
			scale: '1',
		},
		{
			label: __( '9:16' ),
			value: '9/16',
			scale: '1',
		},
	];

	const customTooltipContent = ( newValue ) =>
		aspectRatio === undefined ? undefined : options[ newValue ]?.label;

	return (
		<>
			<InspectorControls group="dimensions">
				<ToolsPanelItem
					hasValue={ () => !! aspectRatio }
					label={ __( 'Aspect ratio' ) }
					onDeselect={ () =>
						setAttributes( { aspectRatio: undefined } )
					}
					resetAllFilter={ () => ( {
						aspectRatio: undefined,
					} ) }
					isShownByDefault={ true }
					panelId={ clientId }
				>
					<Dropdown
						popoverProps={ popoverProps }
						className="block-editor-global-styles-filters-panel__dropdown"
						renderToggle={ ( { onToggle, isOpen } ) => {
							const toggleProps = {
								onClick: onToggle,
								className: classnames( { 'is-open': isOpen } ),
								'aria-expanded': isOpen,
							};

							return (
								<ItemGroup isBordered isSeparated>
									<Button { ...toggleProps }>
										<LabeledColorIndicator
											indicator={ aspectRatio }
											label={ __( 'Aspect ratio' ) }
										/>
									</Button>
								</ItemGroup>
							);
						} }
						renderContent={ () => (
							<DropdownContentWrapper paddingSize="small">
								<VStack>
									<BaseControl
										// __nextHasNoMarginBottom
										className={ classnames(
											'block-editor-color-gradient-control'
										) }
									>
										<BaseControl.VisualLabel>
											{ __( 'Aspect ratio' ) }
										</BaseControl.VisualLabel>

										<div className="aspect-ratio-wrapper">
											<div
												className="aspect-ratio-wrapper-item"
												style={ {
													// height: !! aspectRatio && '100%',
													transform: `scale(${ options[ aspectRatio ]?.scale })`,
													aspectRatio,
													backgroundImage: `url(${ mediaUrl })`,
												} }
											/>
										</div>

										<RangeControl
											// __nextHasNoMarginBottomx
											hideLabelFromVision
											withInputField={ false }
											label={ __( 'Aspect ratio' ) }
											value={ aspectRatio }
											// onChange={ ( nextAspectRatio ) =>
											// 	setAttributes( { aspectRatio: nextAspectRatio } )
											// }
											onChange={ ( nextAspectRatio ) =>
												setAttributes( {
													aspectRatio:
														options[
															nextAspectRatio
														].value,
												} )
											}
											min={ 0 }
											max={ 9 }
											initialPosition={ 1 }
											size="__unstable-large"
											afterIcon={ portrait }
											beforeIcon={ landscape }
											renderTooltipContent={
												customTooltipContent
											}
										/>
									</BaseControl>
								</VStack>
							</DropdownContentWrapper>
						) }
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					className="single-column"
					hasValue={ () => !! height }
					label={ __( 'Height' ) }
					onDeselect={ () => setAttributes( { height: undefined } ) }
					resetAllFilter={ () => ( {
						height: undefined,
					} ) }
					isShownByDefault={ true }
					panelId={ clientId }
				>
					<UnitControl
						label={ __( 'Height' ) }
						labelPosition="top"
						value={ height || '' }
						min={ 0 }
						onChange={ ( nextHeight ) =>
							onDimensionChange( 'height', nextHeight )
						}
						units={ units }
						size="__unstable-large"
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					className="single-column"
					hasValue={ () => !! width }
					label={ __( 'Width' ) }
					onDeselect={ () => setAttributes( { width: undefined } ) }
					resetAllFilter={ () => ( {
						width: undefined,
					} ) }
					isShownByDefault={ true }
					panelId={ clientId }
				>
					<UnitControl
						label={ __( 'Width' ) }
						labelPosition="top"
						value={ width || '' }
						min={ 0 }
						onChange={ ( nextWidth ) =>
							onDimensionChange( 'width', nextWidth )
						}
						units={ units }
						size="__unstable-large"
					/>
				</ToolsPanelItem>
				{ !! imageSizeOptions.length && (
					<ToolsPanelItem
						hasValue={ () => !! sizeSlug }
						label={ __( 'Resolution' ) }
						onDeselect={ () =>
							setAttributes( { sizeSlug: undefined } )
						}
						resetAllFilter={ () => ( {
							sizeSlug: undefined,
						} ) }
						isShownByDefault={ false }
						panelId={ clientId }
					>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Resolution' ) }
							value={ sizeSlug || DEFAULT_SIZE }
							options={ imageSizeOptions }
							onChange={ ( nextSizeSlug ) =>
								setAttributes( { sizeSlug: nextSizeSlug } )
							}
							help={ __(
								'Select the size of the source image.'
							) }
						/>
					</ToolsPanelItem>
				) }
			</InspectorControls>
		</>
	);
};

export default DimensionControls;
