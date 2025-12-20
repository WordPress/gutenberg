/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	InspectorControls,
	RichText,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	getTypographyClassesAndStyles as useTypographyProps,
	store as blockEditorStore,
	__experimentalGetElementClassName,
	useSettings,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import {
	SelectControl,
	ToggleControl,
	ResizableBox,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { Icon, search } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import {
	PC_WIDTH_DEFAULT,
	PX_WIDTH_DEFAULT,
	MIN_WIDTH,
	isPercentageUnit,
} from './utils.js';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

// Used to calculate border radius adjustment to avoid "fat" corners when
// button is placed inside wrapper.
const DEFAULT_INNER_PADDING = '4px';
const PERCENTAGE_WIDTHS = [ 25, 50, 75, 100 ];

export default function SearchEdit( {
	className,
	attributes,
	setAttributes,
	toggleSelection,
	isSelected,
	clientId,
} ) {
	const {
		label,
		showLabel,
		placeholder,
		width,
		widthUnit,
		align,
		buttonText,
		buttonPosition,
		buttonUseIcon,
		isSearchFieldHidden,
		style,
	} = attributes;

	const wasJustInsertedIntoNavigationBlock = useSelect(
		( select ) => {
			const { getBlockParentsByBlockName, wasBlockJustInserted } =
				select( blockEditorStore );
			return (
				!! getBlockParentsByBlockName( clientId, 'core/navigation' )
					?.length && wasBlockJustInserted( clientId )
			);
		},
		[ clientId ]
	);
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		if ( wasJustInsertedIntoNavigationBlock ) {
			// This side-effect should not create an undo level.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				showLabel: false,
				buttonUseIcon: true,
				buttonPosition: 'button-inside',
			} );
		}
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		wasJustInsertedIntoNavigationBlock,
		setAttributes,
	] );

	const borderRadius = style?.border?.radius;
	let borderProps = useBorderProps( attributes );

	// Check for old deprecated numerical border radius. Done as a separate
	// check so that a borderRadius style won't overwrite the longhand
	// per-corner styles.
	if ( typeof borderRadius === 'number' ) {
		borderProps = {
			...borderProps,
			style: {
				...borderProps.style,
				borderRadius: `${ borderRadius }px`,
			},
		};
	}

	const colorProps = useColorProps( attributes );
	const [ fluidTypographySettings, layout ] = useSettings(
		'typography.fluid',
		'layout'
	);
	const typographyProps = useTypographyProps( attributes, {
		typography: {
			fluid: fluidTypographySettings,
		},
		layout: {
			wideSize: layout?.wideSize,
		},
	} );
	const unitControlInstanceId = useInstanceId( UnitControl );
	const unitControlInputId = `wp-block-search__width-${ unitControlInstanceId }`;
	const isButtonPositionInside = 'button-inside' === buttonPosition;
	const isButtonPositionOutside = 'button-outside' === buttonPosition;
	const hasNoButton = 'no-button' === buttonPosition;
	const hasOnlyButton = 'button-only' === buttonPosition;
	const searchFieldRef = useRef();
	const buttonRef = useRef();

	const units = useCustomUnits( {
		availableUnits: [ '%', 'px' ],
		defaultValues: { '%': PC_WIDTH_DEFAULT, px: PX_WIDTH_DEFAULT },
	} );

	useEffect( () => {
		if ( hasOnlyButton && ! isSelected ) {
			setAttributes( {
				isSearchFieldHidden: true,
			} );
		}
	}, [ hasOnlyButton, isSelected, setAttributes ] );

	// Show the search field when width changes.
	useEffect( () => {
		if ( ! hasOnlyButton || ! isSelected ) {
			return;
		}

		setAttributes( {
			isSearchFieldHidden: false,
		} );
	}, [ hasOnlyButton, isSelected, setAttributes, width ] );

	const getBlockClassNames = () => {
		return clsx(
			className,
			isButtonPositionInside
				? 'wp-block-search__button-inside'
				: undefined,
			isButtonPositionOutside
				? 'wp-block-search__button-outside'
				: undefined,
			hasNoButton ? 'wp-block-search__no-button' : undefined,
			hasOnlyButton ? 'wp-block-search__button-only' : undefined,
			! buttonUseIcon && ! hasNoButton
				? 'wp-block-search__text-button'
				: undefined,
			buttonUseIcon && ! hasNoButton
				? 'wp-block-search__icon-button'
				: undefined,
			hasOnlyButton && isSearchFieldHidden
				? 'wp-block-search__searchfield-hidden'
				: undefined
		);
	};

	const buttonPositionControls = [
		{
			label: __( 'Button outside' ),
			value: 'button-outside',
		},
		{
			label: __( 'Button inside' ),
			value: 'button-inside',
		},
		{
			label: __( 'No button' ),
			value: 'no-button',
		},
		{
			label: __( 'Button only' ),
			value: 'button-only',
		},
	];

	const getResizableSides = () => {
		if ( hasOnlyButton ) {
			return {};
		}

		return {
			right: align !== 'right',
			left: align === 'right',
		};
	};

	const renderTextField = () => {
		// If the input is inside the wrapper, the wrapper gets the border color styles/classes, not the input control.
		const textFieldClasses = clsx(
			'wp-block-search__input',
			isButtonPositionInside ? undefined : borderProps.className,
			typographyProps.className
		);
		const textFieldStyles = {
			...( isButtonPositionInside
				? {
						borderRadius: borderProps.style?.borderRadius,
						borderTopLeftRadius:
							borderProps.style?.borderTopLeftRadius,
						borderTopRightRadius:
							borderProps.style?.borderTopRightRadius,
						borderBottomLeftRadius:
							borderProps.style?.borderBottomLeftRadius,
						borderBottomRightRadius:
							borderProps.style?.borderBottomRightRadius,
				  }
				: borderProps.style ),
			...typographyProps.style,
			textDecoration: undefined,
		};

		return (
			<input
				type="search"
				className={ textFieldClasses }
				style={ textFieldStyles }
				aria-label={ __( 'Optional placeholder text' ) }
				// We hide the placeholder field's placeholder when there is a value. This
				// stops screen readers from reading the placeholder field's placeholder
				// which is confusing.
				placeholder={
					placeholder ? undefined : __( 'Optional placeholder…' )
				}
				value={ placeholder }
				onChange={ ( event ) =>
					setAttributes( { placeholder: event.target.value } )
				}
				ref={ searchFieldRef }
			/>
		);
	};

	const renderButton = () => {
		// If the button is inside the wrapper, the wrapper gets the border color styles/classes, not the button.
		const buttonClasses = clsx(
			'wp-block-search__button',
			colorProps.className,
			typographyProps.className,
			isButtonPositionInside ? undefined : borderProps.className,
			buttonUseIcon ? 'has-icon' : undefined,
			__experimentalGetElementClassName( 'button' )
		);
		const buttonStyles = {
			...colorProps.style,
			...typographyProps.style,
			...( isButtonPositionInside
				? {
						borderRadius: borderProps.style?.borderRadius,
						borderTopLeftRadius:
							borderProps.style?.borderTopLeftRadius,
						borderTopRightRadius:
							borderProps.style?.borderTopRightRadius,
						borderBottomLeftRadius:
							borderProps.style?.borderBottomLeftRadius,
						borderBottomRightRadius:
							borderProps.style?.borderBottomRightRadius,
				  }
				: borderProps.style ),
		};
		const handleButtonClick = () => {
			if ( hasOnlyButton ) {
				setAttributes( {
					isSearchFieldHidden: ! isSearchFieldHidden,
				} );
			}
		};

		return (
			<>
				{ buttonUseIcon && (
					<button
						type="button"
						className={ buttonClasses }
						style={ buttonStyles }
						aria-label={
							buttonText
								? stripHTML( buttonText )
								: __( 'Search' )
						}
						onClick={ handleButtonClick }
						ref={ buttonRef }
					>
						<Icon icon={ search } />
					</button>
				) }

				{ ! buttonUseIcon && (
					<RichText
						identifier="buttonText"
						className={ buttonClasses }
						style={ buttonStyles }
						aria-label={ __( 'Button text' ) }
						placeholder={ __( 'Add button text…' ) }
						withoutInteractiveFormatting
						value={ buttonText }
						onChange={ ( html ) =>
							setAttributes( { buttonText: html } )
						}
						onClick={ handleButtonClick }
					/>
				) }
			</>
		);
	};
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const controls = (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							width: undefined,
							widthUnit: undefined,
							showLabel: true,
							buttonUseIcon: false,
							buttonPosition: 'button-outside',
							isSearchFieldHidden: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => ! showLabel }
						label={ __( 'Show label' ) }
						onDeselect={ () => {
							setAttributes( {
								showLabel: true,
							} );
						} }
						isShownByDefault
					>
						<ToggleControl
							checked={ showLabel }
							label={ __( 'Show label' ) }
							onChange={ ( value ) =>
								setAttributes( {
									showLabel: value,
								} )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => buttonPosition !== 'button-outside' }
						label={ __( 'Button position' ) }
						onDeselect={ () => {
							setAttributes( {
								buttonPosition: 'button-outside',
								isSearchFieldHidden: false,
							} );
						} }
						isShownByDefault
					>
						<SelectControl
							value={ buttonPosition }
							__next40pxDefaultSize
							label={ __( 'Button position' ) }
							onChange={ ( value ) => {
								setAttributes( {
									buttonPosition: value,
									isSearchFieldHidden:
										value === 'button-only',
								} );
							} }
							options={ buttonPositionControls }
						/>
					</ToolsPanelItem>
					{ buttonPosition !== 'no-button' && (
						<ToolsPanelItem
							hasValue={ () => !! buttonUseIcon }
							label={ __( 'Use button with icon' ) }
							onDeselect={ () => {
								setAttributes( {
									buttonUseIcon: false,
								} );
							} }
							isShownByDefault
						>
							<ToggleControl
								checked={ buttonUseIcon }
								label={ __( 'Use button with icon' ) }
								onChange={ ( value ) =>
									setAttributes( {
										buttonUseIcon: value,
									} )
								}
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						hasValue={ () => !! width }
						label={ __( 'Width' ) }
						onDeselect={ () => {
							setAttributes( {
								width: undefined,
								widthUnit: undefined,
							} );
						} }
						isShownByDefault
					>
						<VStack>
							<UnitControl
								__next40pxDefaultSize
								label={ __( 'Width' ) }
								id={ unitControlInputId } // Unused, kept for backwards compatibility
								min={
									isPercentageUnit( widthUnit )
										? 0
										: MIN_WIDTH
								}
								max={
									isPercentageUnit( widthUnit )
										? 100
										: undefined
								}
								step={ 1 }
								onChange={ ( newWidth ) => {
									const parsedNewWidth =
										newWidth === ''
											? undefined
											: parseInt( newWidth, 10 );
									setAttributes( {
										width: parsedNewWidth,
									} );
								} }
								onUnitChange={ ( newUnit ) => {
									setAttributes( {
										width:
											'%' === newUnit
												? PC_WIDTH_DEFAULT
												: PX_WIDTH_DEFAULT,
										widthUnit: newUnit,
									} );
								} }
								__unstableInputWidth="80px"
								value={ `${ width }${ widthUnit }` }
								units={ units }
							/>
							<ToggleGroupControl
								label={ __( 'Percentage Width' ) }
								value={
									PERCENTAGE_WIDTHS.includes( width ) &&
									widthUnit === '%'
										? width
										: undefined
								}
								hideLabelFromVision
								onChange={ ( newWidth ) => {
									setAttributes( {
										width: newWidth,
										widthUnit: '%',
									} );
								} }
								isBlock
								__next40pxDefaultSize
							>
								{ PERCENTAGE_WIDTHS.map( ( widthValue ) => {
									return (
										<ToggleGroupControlOption
											key={ widthValue }
											value={ widthValue }
											label={ sprintf(
												/* translators: %d: Percentage value. */
												__( '%d%%' ),
												widthValue
											) }
										/>
									);
								} ) }
							</ToggleGroupControl>
						</VStack>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);

	const isNonZeroBorderRadius = ( radius ) =>
		radius !== undefined && parseInt( radius, 10 ) !== 0;

	const padBorderRadius = ( radius ) =>
		isNonZeroBorderRadius( radius )
			? `calc(${ radius } + ${ DEFAULT_INNER_PADDING })`
			: undefined;

	const getWrapperStyles = () => {
		const styles = isButtonPositionInside
			? borderProps.style
			: {
					borderRadius: borderProps.style?.borderRadius,
					borderTopLeftRadius: borderProps.style?.borderTopLeftRadius,
					borderTopRightRadius:
						borderProps.style?.borderTopRightRadius,
					borderBottomLeftRadius:
						borderProps.style?.borderBottomLeftRadius,
					borderBottomRightRadius:
						borderProps.style?.borderBottomRightRadius,
			  };

		if ( isButtonPositionInside ) {
			// We have button inside wrapper and a border radius value to apply.
			// Add default padding so we don't get "fat" corners.
			//
			// CSS calc() is used here to support non-pixel units. The inline
			// style using calc() will only apply if both values have units.

			if ( typeof borderRadius === 'object' ) {
				// Individual corner border radii present.
				const {
					borderTopLeftRadius,
					borderTopRightRadius,
					borderBottomLeftRadius,
					borderBottomRightRadius,
				} = borderProps.style;

				return {
					...styles,
					borderTopLeftRadius: padBorderRadius( borderTopLeftRadius ),
					borderTopRightRadius:
						padBorderRadius( borderTopRightRadius ),
					borderBottomLeftRadius: padBorderRadius(
						borderBottomLeftRadius
					),
					borderBottomRightRadius: padBorderRadius(
						borderBottomRightRadius
					),
				};
			}

			// The inline style using calc() will only apply if both values
			// supplied to calc() have units. Deprecated block's may have
			// unitless integer.
			const radius = Number.isInteger( borderRadius )
				? `${ borderRadius }px`
				: borderRadius;

			styles.borderRadius = `calc(${ radius } + ${ DEFAULT_INNER_PADDING })`;
		}

		return styles;
	};

	const blockProps = useBlockProps( {
		className: getBlockClassNames(),
		style: {
			...typographyProps.style,
			// Input opts out of text decoration.
			textDecoration: undefined,
		},
	} );

	const labelClassnames = clsx(
		'wp-block-search__label',
		typographyProps.className
	);

	return (
		<div { ...blockProps }>
			{ controls }

			{ showLabel && (
				<RichText
					identifier="label"
					className={ labelClassnames }
					aria-label={ __( 'Label text' ) }
					placeholder={ __( 'Add label…' ) }
					withoutInteractiveFormatting
					value={ label }
					onChange={ ( html ) => setAttributes( { label: html } ) }
					style={ typographyProps.style }
				/>
			) }

			<ResizableBox
				size={ {
					width:
						width === undefined
							? 'auto'
							: `${ width }${ widthUnit }`,
					height: 'auto',
				} }
				className={ clsx(
					'wp-block-search__inside-wrapper',
					isButtonPositionInside ? borderProps.className : undefined
				) }
				style={ getWrapperStyles() }
				minWidth={ MIN_WIDTH }
				enable={ getResizableSides() }
				onResizeStart={ ( event, direction, elt ) => {
					setAttributes( {
						width: parseInt( elt.offsetWidth, 10 ),
						widthUnit: 'px',
					} );
					toggleSelection( false );
				} }
				onResizeStop={ ( event, direction, elt, delta ) => {
					setAttributes( {
						width: parseInt( width + delta.width, 10 ),
					} );
					toggleSelection( true );
				} }
				showHandle={ isSelected }
			>
				{ ( isButtonPositionInside ||
					isButtonPositionOutside ||
					hasOnlyButton ) && (
					<>
						{ renderTextField() }
						{ renderButton() }
					</>
				) }

				{ hasNoButton && renderTextField() }
			</ResizableBox>
		</div>
	);
}
