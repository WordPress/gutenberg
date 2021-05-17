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
	__experimentalUnitControl as UnitControl,
} from '@wordpress/block-editor';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	ToolbarGroup,
	Button,
	ButtonGroup,
	ToolbarButton,
	ResizableBox,
	PanelBody,
	BaseControl,
	__experimentalUseCustomUnits as useCustomUnits,
	SelectControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { search } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useRef, useEffect } from '@wordpress/element';

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
} from './utils.js';

// Used to calculate border radius adjustment to avoid "fat" corners when
// button is placed inside wrapper.
const DEFAULT_INNER_PADDING = 4;
const BUTTON_BEHAVIOR_EXPAND = 'expand-searchfield';
const BUTTON_BEHAVIOR_LINK = 'search-page-link';
const SEARCHFIELD_ANIMATION_DURATION = 300; //ms

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
		buttonBehavior,
		style,
	} = attributes;

	const borderRadius = style?.border?.radius;
	const unitControlInstanceId = useInstanceId( UnitControl );
	const unitControlInputId = `wp-block-search__width-${ unitControlInstanceId }`;
	const searchFieldRef = useRef();
	const buttonRef = useRef();

	useEffect( () => {
		if ( isSelected ) {
			showSearchField();
		} else {
			hideSearchField();
		}
	}, [ isSelected ] );

	useEffect( () => {
		if ( 'button-only' !== buttonPosition ) {
			showSearchField( false );
		} else {
			hideSearchField();
		}
	}, [ buttonPosition ] );

	const hideSearchField = () => {
		searchFieldRef.current.style.width = `${ searchFieldRef.current.offsetWidth }px`;
		searchFieldRef.current.style.flexGrow = '0';
		searchFieldRef.current.style.transitionDuration = `${ SEARCHFIELD_ANIMATION_DURATION }ms`;
		searchFieldRef.current.style.transitionProperty = 'margin-left';

		const offset =
			searchFieldRef.current.offsetWidth +
			parseInt(
				window.getComputedStyle( searchFieldRef.current ).marginRight
			) +
			parseInt( window.getComputedStyle( buttonRef.current ).marginLeft );

		searchFieldRef.current.style.marginLeft = `-${ offset }px`;
	};

	const showSearchField = ( animate = true ) => {
		const duration = animate ? SEARCHFIELD_ANIMATION_DURATION : 0;

		searchFieldRef.current.style.marginLeft = 0;
		searchFieldRef.current.style.transitionDuration = `${ duration }ms`;

		const resetWidth = setTimeout( () => {
			searchFieldRef.current.style.flexGrow = '1';
			searchFieldRef.current.style.width = `${ width }${ widthUnit }`;
			clearTimeout( resetWidth );
		}, duration );
	};

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
			BUTTON_BEHAVIOR_EXPAND === buttonBehavior
				? 'wp-block-search__button-behavior-expand'
				: undefined,
			BUTTON_BEHAVIOR_LINK === buttonBehavior
				? 'wp-block-search__button-behavior-link'
				: undefined,
			! buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__text-button'
				: undefined,
			buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__icon-button'
				: undefined,
			isSelected ? 'wp-block-search__is-selected' : undefined
		);
	};

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
		if (
			'button-only' === buttonPosition &&
			'search-page-link' === buttonBehavior
		) {
			return {};
		}

		return {
			right: align === 'right' ? false : true,
			left: align === 'right' ? true : false,
		};
	};

	const hideSearchField = () => {
		searchFieldRef.current.style.width = `${ searchFieldRef.current.offsetWidth }px`;
		searchFieldRef.current.style.flexGrow = '0';
		searchFieldRef.current.style.transitionDuration = `${ SEARCHFIELD_ANIMATION_DURATION }ms`;
		searchFieldRef.current.style.transitionProperty = 'margin-left';

		const offset =
			searchFieldRef.current.offsetWidth +
			parseInt(
				window.getComputedStyle( searchFieldRef.current ).marginRight
			) +
			parseInt( window.getComputedStyle( buttonRef.current ).marginLeft );

		searchFieldRef.current.style.marginLeft = `-${ offset }px`;
	};

	const showSearchField = ( animate = true ) => {
		const duration = animate ? SEARCHFIELD_ANIMATION_DURATION : 0;

		searchFieldRef.current.style.marginLeft = 0;
		searchFieldRef.current.style.transitionDuration = `${ duration }ms`;

		const resetWidth = setTimeout( () => {
			searchFieldRef.current.style.flexGrow = '1';
			searchFieldRef.current.style.width = `${ width }${ widthUnit }`;
			clearTimeout( resetWidth );
		}, duration );
	};

	const renderTextField = () => {
		return (
			<input
				className="wp-block-search__input"
				style={ { borderRadius } }
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
		return (
			<>
				{ buttonUseIcon && (
					<Button
						icon={ search }
						className="wp-block-search__button"
						style={ { borderRadius } }
						onClick={ showSearchField }
						ref={ buttonRef }
					/>
				) }

				{ ! buttonUseIcon && (
					<RichText
						className="wp-block-search__button"
						style={ { borderRadius } }
						aria-label={ __( 'Button text' ) }
						placeholder={ __( 'Add button text…' ) }
						withoutInteractiveFormatting
						value={ buttonText }
						onChange={ ( html ) =>
							setAttributes( { buttonText: html } )
						}
						onClick={ showSearchField }
						ref={ buttonRef }
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
					<DropdownMenu
						icon={ getButtonPositionIcon() }
						label={ __( 'Change button position' ) }
					>
						{ ( { onClose } ) => (
							<MenuGroup className="wp-block-search__button-position-menu">
								<MenuItem
									icon={ noButton }
									onClick={ () => {
										setAttributes( {
											buttonPosition: 'no-button',
										} );
										onClose();
									} }
								>
									{ __( 'No Button' ) }
								</MenuItem>
								<MenuItem
									icon={ buttonOutside }
									onClick={ () => {
										setAttributes( {
											buttonPosition: 'button-outside',
										} );
										onClose();
									} }
								>
									{ __( 'Button Outside' ) }
								</MenuItem>
								<MenuItem
									icon={ buttonInside }
									onClick={ () => {
										setAttributes( {
											buttonPosition: 'button-inside',
										} );
										onClose();
									} }
								>
									{ __( 'Button Inside' ) }
								</MenuItem>
								<MenuItem
									icon={ buttonOnly }
									onClick={ () => {
										setAttributes( {
											buttonPosition: 'button-only',
										} );

										onClose();
									} }
								>
									{ __( 'Button Only' ) }
								</MenuItem>
							</MenuGroup>
						) }
					</DropdownMenu>

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
					{ 'button-only' === buttonPosition && (
						<SelectControl
							label={ __( 'On button click' ) }
							value={ buttonBehavior }
							onChange={ ( behavior ) =>
								setAttributes( { buttonBehavior: behavior } )
							}
							options={ [
								{
									value: BUTTON_BEHAVIOR_EXPAND,
									label: __( 'Show and expand search field' ),
								},
								{
									value: BUTTON_BEHAVIOR_LINK,
									label: __( 'Navigate to search page' ),
								},
								//{ value: 'search-modal', 'label': __( 'Show search modal') },
							] }
						/>
					) }

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

	const getWrapperStyles = () => {
		if ( 'button-inside' === buttonPosition && style?.border?.radius ) {
			// We have button inside wrapper and a border radius value to apply.
			// Add default padding so we don't get "fat" corners.
			const outerRadius =
				parseInt( style?.border?.radius, 10 ) + DEFAULT_INNER_PADDING;

			return { borderRadius: `${ outerRadius }px` };
		}

		return undefined;
	};

	const blockProps = useBlockProps( {
		className: getBlockClassNames(),
	} );

	return (
		<div { ...blockProps }>
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
				size={ {
					width: `${ width }${ widthUnit }`,
				} }
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
					'button-outside' === buttonPosition ||
					( 'button-only' === buttonPosition &&
						BUTTON_BEHAVIOR_LINK !== buttonBehavior ) ) && (
					<>
						{ renderTextField() }
						{ renderButton() }
					</>
				) }

				{ 'button-only' === buttonPosition &&
					BUTTON_BEHAVIOR_LINK === buttonBehavior &&
					renderButton() }
				{ 'no-button' === buttonPosition && renderTextField() }
			</ResizableBox>
		</div>
	);
}
