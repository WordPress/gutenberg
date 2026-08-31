import clsx from 'clsx';
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
import { useEffect, useMemo, useRef } from '@wordpress/element';
import {
	SelectControl,
	ToggleControl,
	ResizableBox,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { speak } from '@wordpress/a11y';
import { Path, SVG } from '@wordpress/primitives';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

// Help text describing each wrapper element option. Kept local to the block
// because the choices and their guidance are specific to the Search block.
const TAG_NAME_MESSAGES = {
	'': __(
		'Lets the theme decide. Uses the <search> landmark element if the theme opts in, otherwise a <form>.'
	),
	search: __(
		'Wraps the block in a <search> landmark, announced as a search region by assistive technologies.'
	),
	form: __(
		'Uses a <form role="search"> wrapper for backward compatibility with existing theme styles.'
	),
};

// Used to calculate border radius adjustment to avoid "fat" corners when
// button is placed inside wrapper.
const DEFAULT_INNER_PADDING = '4px';

// Dimension presets are stored by reference, e.g. `var:preset|dimension|50`.
const DIMENSION_PRESET_PREFIX = 'var:preset|dimension|';

// Keep this block-specific icon aligned with the PHP renderer. Unlike the
// Search icon from @wordpress/icons, it remains fill-based so existing theme
// styles continue to work in both the editor and the front end.
const searchBlockIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6S16.3 5 13 5zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
	</SVG>
);

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
		align,
		buttonText,
		buttonPosition,
		buttonUseIcon,
		tagName,
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
	const [ fluidTypographySettings, layout, dimensionSizes ] = useSettings(
		'typography.fluid',
		'layout',
		'dimensions.dimensionSizes'
	);
	const typographyProps = useTypographyProps( attributes, {
		typography: {
			fluid: fluidTypographySettings,
		},
		layout: {
			wideSize: layout?.wideSize,
		},
	} );
	const isButtonPositionInside = 'button-inside' === buttonPosition;
	const isButtonPositionOutside = 'button-outside' === buttonPosition;
	const hasNoButton = 'no-button' === buttonPosition;
	const hasOnlyButton = 'button-only' === buttonPosition;
	const isSearchFieldHidden = hasOnlyButton && ! isSelected;
	const searchFieldRef = useRef();
	const buttonRef = useRef();

	// The width control writes a CSS length, which may be a preset reference.
	// Resolve it so the resize handles have a real length to work from.
	const width = style?.dimensions?.width;
	const resolvedWidth = useMemo( () => {
		if ( ! width || ! width.startsWith( DIMENSION_PRESET_PREFIX ) ) {
			return width;
		}
		const slug = width.slice( DIMENSION_PRESET_PREFIX.length );
		const preset = [
			...( dimensionSizes?.custom ?? [] ),
			...( dimensionSizes?.theme ?? [] ),
			...( dimensionSizes?.default ?? [] ),
		].find( ( size ) => size.slug === slug );
		return preset?.size ?? width;
	}, [ width, dimensionSizes ] );

	const setWidth = ( nextWidth ) => {
		setAttributes( {
			style: {
				...style,
				dimensions: {
					...style?.dimensions,
					width: nextWidth,
				},
			},
		} );
	};

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
			isSearchFieldHidden
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
			hasNoButton ? colorProps.className : undefined,
			isButtonPositionInside ? undefined : borderProps.className,
			typographyProps.className
		);
		const textFieldStyles = {
			...( hasNoButton ? colorProps.style : {} ),
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
						ref={ buttonRef }
					>
						<Icon icon={ searchBlockIcon } />
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
							showLabel: true,
							buttonUseIcon: false,
							buttonPosition: 'button-outside',
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
							} );
						} }
						isShownByDefault
					>
						<SelectControl
							value={ buttonPosition }
							label={ __( 'Button position' ) }
							onChange={ ( value ) => {
								setAttributes( {
									buttonPosition: value,
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
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<SelectControl
					label={ __( 'HTML element' ) }
					value={ tagName ?? '' }
					options={ [
						{ label: __( 'Default' ), value: '' },
						{ label: '<search>', value: 'search' },
						{ label: '<form>', value: 'form' },
					] }
					onChange={ ( value ) => {
						setAttributes( { tagName: value } );
						// The help text is updated via aria-describedby, which
						// is not re-announced while focus remains on the select.
						// Announce the new description so it is not missed.
						// speak() strips HTML-like tags, which would drop the
						// element names (e.g. <search>) entirely. Remove only the
						// angle brackets so the words are retained when spoken.
						speak(
							TAG_NAME_MESSAGES[ value ].replace( /[<>]/g, '' )
						);
					} }
					help={ TAG_NAME_MESSAGES[ tagName ?? '' ] }
				/>
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

	// Reflect an explicit <search> choice in the editor markup so wrapper
	// styles match the front end. The <form> and theme-deferred default keep
	// the historical <div> to avoid nesting a live <form> in the editor.
	const Wrapper = 'search' === tagName ? 'search' : 'div';

	return (
		<>
			{ controls }
			<Wrapper { ...blockProps }>
				{ showLabel && (
					<RichText
						identifier="label"
						className={ labelClassnames }
						aria-label={ __( 'Label text' ) }
						placeholder={ __( 'Add label…' ) }
						withoutInteractiveFormatting
						value={ label }
						onChange={ ( html ) =>
							setAttributes( { label: html } )
						}
						style={ typographyProps.style }
					/>
				) }

				<ResizableBox
					size={ {
						width:
							! resolvedWidth || '0' === resolvedWidth
								? 'auto'
								: resolvedWidth,
						height: 'auto',
					} }
					className={ clsx(
						'wp-block-search__inside-wrapper',
						isButtonPositionInside
							? borderProps.className
							: undefined
					) }
					style={ getWrapperStyles() }
					enable={ getResizableSides() }
					onResizeStart={ ( event, direction, elt ) => {
						// Pin the current rendered width in pixels so dragging
						// starts from where the block is, whatever unit or
						// preset it was set with.
						setWidth( `${ parseInt( elt.offsetWidth, 10 ) }px` );
						toggleSelection( false );
					} }
					onResizeStop={ ( event, direction, elt ) => {
						setWidth( `${ parseInt( elt.offsetWidth, 10 ) }px` );
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
			</Wrapper>
		</>
	);
}
