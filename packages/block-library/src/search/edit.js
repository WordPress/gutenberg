/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/block-editor';
import {
	ToolbarDropdownMenu,
	ToolbarGroup,
	Button,
	ButtonGroup,
	ToolbarButton,
	ResizableBox,
	PanelBody,
	BaseControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useInstanceId, useResizeObserver } from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { search } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	buttonOnly,
	buttonOutside,
	buttonInside,
	noButton,
	buttonWithIcon,
	toggleLabel,
} from './icons';
import {
	PC_WIDTH_DEFAULT,
	PX_WIDTH_DEFAULT,
	MIN_WIDTH,
	MIN_WIDTH_UNIT,
	getAlignedStyles,
	hasAlignedWidth,
} from './utils.js';

// Used to calculate border radius adjustment to avoid "fat" corners when
// button is placed inside wrapper.
const DEFAULT_INNER_PADDING = '4px';

export default function SearchEdit( {
	className,
	attributes,
	setAttributes,
	toggleSelection,
	isSelected,
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
		style,
	} = attributes;

	const [ resizeListener ] = useResizeObserver();
	const borderRadius = style?.border?.radius;
	const borderProps = useBorderProps( attributes );

	// Check for old deprecated numerical border radius. Done as a separate
	// check so that a borderRadius style won't overwrite the longhand
	// per-corner styles.
	if ( typeof borderRadius === 'number' ) {
		borderProps.style.borderRadius = `${ borderRadius }px`;
	}

	const unitControlInstanceId = useInstanceId( UnitControl );
	const unitControlInputId = `wp-block-search__width-${ unitControlInstanceId }`;

	const units = useCustomUnits( {
		availableUnits: [ '%', 'px' ],
		defaultValues: { '%': PC_WIDTH_DEFAULT, px: PX_WIDTH_DEFAULT },
	} );

	const getBlockClassNames = () => {
		return classnames(
			className,
			'button-inside' === buttonPosition
				? 'wp-block-search__button-inside'
				: undefined,
			'button-outside' === buttonPosition
				? 'wp-block-search__button-outside'
				: undefined,
			'no-button' === buttonPosition
				? 'wp-block-search__no-button'
				: undefined,
			'button-only' === buttonPosition
				? 'wp-block-search__button-only'
				: undefined,
			! buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__text-button'
				: undefined,
			buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__icon-button'
				: undefined
		);
	};

	const buttonPositionControls = [
		{
			role: 'menuitemradio',
			title: __( 'Button outside' ),
			isActive: buttonPosition === 'button-outside',
			icon: buttonOutside,
			onClick: () => {
				setAttributes( {
					buttonPosition: 'button-outside',
				} );
			},
		},
		{
			role: 'menuitemradio',
			title: __( 'Button inside' ),
			isActive: buttonPosition === 'button-inside',
			icon: buttonInside,
			onClick: () => {
				setAttributes( {
					buttonPosition: 'button-inside',
				} );
			},
		},
		{
			role: 'menuitemradio',
			title: __( 'No button' ),
			isActive: buttonPosition === 'no-button',
			icon: noButton,
			onClick: () => {
				setAttributes( {
					buttonPosition: 'no-button',
				} );
			},
		},
	];

	const getButtonPositionIcon = () => {
		switch ( buttonPosition ) {
			case 'button-inside':
				return buttonInside;
			case 'button-outside':
				return buttonOutside;
			case 'no-button':
				return noButton;
			case 'button-only':
				return buttonOnly;
		}
	};

	const getResizableSides = () => {
		if ( 'button-only' === buttonPosition ) {
			return {};
		}

		return {
			right: align === 'right' ? false : true,
			left: align === 'right' ? true : false,
		};
	};

	const renderTextField = () => {
		return (
			<input
				className="wp-block-search__input"
				style={ borderProps.style }
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
			/>
		);
	};

	const renderButton = () => {
		return (
			<>
				{ buttonUseIcon && (
					<Button
						icon={ search }
						className="wp-block-search__button"
						style={ borderProps.style }
					/>
				) }

				{ ! buttonUseIcon && (
					<RichText
						className="wp-block-search__button"
						style={ borderProps.style }
						aria-label={ __( 'Button text' ) }
						placeholder={ __( 'Add button text…' ) }
						withoutInteractiveFormatting
						value={ buttonText }
						onChange={ ( html ) =>
							setAttributes( { buttonText: html } )
						}
					/>
				) }
			</>
		);
	};

	const controls = (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Toggle search label' ) }
						icon={ toggleLabel }
						onClick={ () => {
							setAttributes( {
								showLabel: ! showLabel,
							} );
						} }
						className={ showLabel ? 'is-pressed' : undefined }
					/>
					<ToolbarDropdownMenu
						icon={ getButtonPositionIcon() }
						label={ __( 'Change button position' ) }
						controls={ buttonPositionControls }
					/>
					{ 'no-button' !== buttonPosition && (
						<ToolbarButton
							title={ __( 'Use button with icon' ) }
							icon={ buttonWithIcon }
							onClick={ () => {
								setAttributes( {
									buttonUseIcon: ! buttonUseIcon,
								} );
							} }
							className={
								buttonUseIcon ? 'is-pressed' : undefined
							}
						/>
					) }
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Display Settings' ) }>
					<BaseControl
						label={ __( 'Width' ) }
						id={ unitControlInputId }
					>
						<UnitControl
							id={ unitControlInputId }
							min={ `${ MIN_WIDTH }${ MIN_WIDTH_UNIT }` }
							onChange={ ( newWidth ) => {
								const filteredWidth =
									widthUnit === '%' &&
									parseInt( newWidth, 10 ) > 100
										? 100
										: newWidth;

								setAttributes( {
									width: parseInt( filteredWidth, 10 ),
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
							style={ { maxWidth: 80 } }
							value={ `${ width }${ widthUnit }` }
							unit={ widthUnit }
							units={ units }
						/>

						<ButtonGroup
							className="wp-block-search__components-button-group"
							aria-label={ __( 'Percentage Width' ) }
						>
							{ [ 25, 50, 75, 100 ].map( ( widthValue ) => {
								return (
									<Button
										key={ widthValue }
										isSmall
										variant={
											`${ widthValue }%` ===
											`${ width }${ widthUnit }`
												? 'primary'
												: undefined
										}
										onClick={ () =>
											setAttributes( {
												width: widthValue,
												widthUnit: '%',
											} )
										}
									>
										{ widthValue }%
									</Button>
								);
							} ) }
						</ButtonGroup>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
		</>
	);

	const padBorderRadius = ( radius ) =>
		radius ? `calc(${ radius } + ${ DEFAULT_INNER_PADDING })` : undefined;

	const getWrapperStyles = () => {
		const isNonZeroBorderRadius = parseInt( borderRadius, 10 ) !== 0;

		if ( 'button-inside' === buttonPosition && isNonZeroBorderRadius ) {
			// We have button inside wrapper and a border radius value to apply.
			// Add default padding so we don't get "fat" corners.
			//
			// CSS calc() is used here to support non-pixel units.

			if ( typeof borderRadius === 'object' ) {
				// Individual corner border radii present.
				const {
					topLeft,
					topRight,
					bottomLeft,
					bottomRight,
				} = borderRadius;

				return {
					borderTopLeftRadius: padBorderRadius( topLeft ),
					borderTopRightRadius: padBorderRadius( topRight ),
					borderBottomLeftRadius: padBorderRadius( bottomLeft ),
					borderBottomRightRadius: padBorderRadius( bottomRight ),
				};
			}

			// The inline style using calc() will only apply if both values
			// supplied to calc() have units. Deprecated block's may have
			// unitless integer.
			const radius = Number.isInteger( borderRadius )
				? `${ borderRadius }px`
				: borderRadius;

			return {
				borderRadius: `calc(${ radius } + ${ DEFAULT_INNER_PADDING })`,
			};
		}

		return undefined;
	};

	// If aligned left/right, the block will be floated. When floated a wrapper
	// element is added around the search block. This would make the search
	// block's percentage width only a fraction of the wrapper which will not
	// have an appropriate width when floated.
	//
	// A ref is used here to be able to determine the available width and
	// calculate the styles to add to the block to correct the floating issue.
	const searchRef = useRef();
	const alignedStyles = getAlignedStyles( searchRef.current, attributes );

	// If setting width on block to overcome the floated block make the
	// resizable box fill the floated block.
	const innerWidth = hasAlignedWidth( attributes )
		? '100%'
		: `${ width }${ widthUnit }`;

	const blockProps = useBlockProps( {
		className: getBlockClassNames(),
		style: alignedStyles,
		ref: searchRef,
	} );

	return (
		<div { ...blockProps }>
			{ resizeListener }
			{ controls }

			{ showLabel && (
				<RichText
					className="wp-block-search__label"
					aria-label={ __( 'Label text' ) }
					placeholder={ __( 'Add label…' ) }
					withoutInteractiveFormatting
					value={ label }
					onChange={ ( html ) => setAttributes( { label: html } ) }
				/>
			) }

			<ResizableBox
				size={ { width: innerWidth } }
				className="wp-block-search__inside-wrapper"
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
				{ ( 'button-inside' === buttonPosition ||
					'button-outside' === buttonPosition ) && (
					<>
						{ renderTextField() }
						{ renderButton() }
					</>
				) }

				{ 'button-only' === buttonPosition && renderButton() }
				{ 'no-button' === buttonPosition && renderTextField() }
			</ResizableBox>
		</div>
	);
}
