/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import {
	// Button,
	// ButtonGroup,
	FlexBlock,
	// ToggleControl,
	Rect,
	Path,
	PanelBody,
	RangeControl,
	SVG,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext, createPortal } from '@wordpress/element';
import {
	arrowRight,
	arrowDown,
	grid,
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifySpaceBetween,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';
import useSetting from '../components/use-setting';
import { LayoutStyle } from '../components/block-list/layout';
import BlockList from '../components/block-list';
import { getLayoutType, getLayoutTypes } from '../layouts';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { LAYOUT_DEFINITIONS } from '../layouts/definitions';
import { kebabCase } from '../utils/object';

const layoutBlockSupportKey = 'layout';

function hasLayoutBlockSupport( blockName ) {
	return (
		hasBlockSupport( blockName, 'layout' ) ||
		hasBlockSupport( blockName, '__experimentalLayout' )
	);
}
import {
	alignTop,
	alignCenter,
	alignBottom,
	spaceBetween,
} from '../components/block-vertical-alignment-control/icons';

const horizontalAlignmentOptions = [
	{
		value: 'left',
		icon: justifyLeft,
		label: __( 'Left' ),
	},
	{
		value: 'center',
		icon: justifyCenter,
		label: __( 'Middle' ),
	},
	{
		value: 'right',
		icon: justifyRight,
		label: __( 'Right' ),
	},
	{
		value: 'space-between',
		icon: justifySpaceBetween,
		label: __( 'Space Between' ),
	},
];

const verticalAlignmentOptions = [
	{
		value: 'top',
		icon: alignTop,
		label: __( 'Top' ),
	},
	{
		value: 'center',
		icon: alignCenter,
		label: __( 'Middle' ),
	},
	{
		value: 'bottom',
		icon: alignBottom,
		label: __( 'Bottom' ),
	},
	{
		value: 'space-between',
		icon: spaceBetween,
		label: __( 'Space Between' ),
	},
];

const innerWidthOptions = [
	{
		value: 'fill',
		icon: (
			<SVG
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Rect
					x="19"
					y="5"
					width="1.5"
					height="14"
					fill="currentColor"
				/>
				<Rect x="4" y="5" width="1.5" height="14" fill="currentColor" />
				<Path
					d="M13.0005 9L16.0005 12L13.0005 15"
					stroke="currentColor"
				/>
				<Path d="M11 15L8 12L11 9" stroke="currentColor" />
			</SVG>
		),
		label: __( 'Fill' ),
	},
	{
		value: 'fit',
		icon: (
			<SVG
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Rect
					x="13.0002"
					y="5"
					width="1.5"
					height="14"
					fill="currentColor"
				/>
				<Rect
					x="8.00024"
					y="5"
					width="1.5"
					height="14"
					fill="currentColor"
				/>
				<Path
					d="M21.0002 15L18.0002 12L21.0002 9"
					stroke="currentColor"
				/>
				<Path d="M2 9L5 12L2 15" stroke="currentColor" />
			</SVG>
		),
		label: __( 'Fit' ),
	},
	{
		value: 'theme',
		icon: (
			<SVG
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Rect
					x="7"
					y="11"
					width="1.5"
					height="1.5"
					fill="currentColor"
				/>
				<Rect
					x="10"
					y="11"
					width="1.5"
					height="1.5"
					fill="currentColor"
				/>
				<Rect
					x="13"
					y="11"
					width="1.5"
					height="1.5"
					fill="currentColor"
				/>
				<Rect
					x="16"
					y="11"
					width="1.5"
					height="1.5"
					fill="currentColor"
				/>
				<Rect
					x="19"
					y="5"
					width="1.5"
					height="14"
					fill="currentColor"
				/>
				<Rect x="4" y="5" width="1.5" height="14" fill="currentColor" />
			</SVG>
		),
		label: __( 'Fixed' ),
	},
];

/**
 * Generates the utility classnames for the given block's layout attributes.
 *
 * @param { Object } blockAttributes Block attributes.
 * @param { string } blockName       Block name.
 *
 * @return { Array } Array of CSS classname strings.
 */
export function useLayoutClasses( blockAttributes = {}, blockName = '' ) {
	const rootPaddingAlignment = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().__experimentalFeatures
			?.useRootPaddingAwareAlignments;
	}, [] );
	const { layout } = blockAttributes;

	const { default: defaultBlockLayout } =
		getBlockSupport( blockName, layoutBlockSupportKey ) || {};
	const usedLayout =
		layout?.inherit || layout?.contentSize || layout?.wideSize
			? { ...layout, type: 'constrained' }
			: layout || defaultBlockLayout || {};

	const layoutClassnames = [];

	if ( LAYOUT_DEFINITIONS[ usedLayout?.type || 'default' ]?.className ) {
		const baseClassName =
			LAYOUT_DEFINITIONS[ usedLayout?.type || 'default' ]?.className;
		const compoundClassName = `wp-block-${ blockName
			.split( '/' )
			.pop() }-${ baseClassName }`;
		layoutClassnames.push( baseClassName, compoundClassName );
	}

	if (
		( usedLayout?.inherit ||
			usedLayout?.contentSize ||
			usedLayout?.type === 'constrained' ) &&
		rootPaddingAlignment
	) {
		layoutClassnames.push( 'has-global-padding' );
	}

	if ( usedLayout?.orientation ) {
		layoutClassnames.push( `is-${ kebabCase( usedLayout.orientation ) }` );
	}

	if ( usedLayout?.justifyContent ) {
		layoutClassnames.push(
			`is-content-justification-${ kebabCase(
				usedLayout.justifyContent
			) }`
		);
	}

	if ( usedLayout?.flexWrap && usedLayout.flexWrap === 'nowrap' ) {
		layoutClassnames.push( 'is-nowrap' );
	}

	return layoutClassnames;
}

/**
 * Generates a CSS rule with the given block's layout styles.
 *
 * @param { Object } blockAttributes Block attributes.
 * @param { string } blockName       Block name.
 * @param { string } selector        A selector to use in generating the CSS rule.
 *
 * @return { string } CSS rule.
 */
export function useLayoutStyles( blockAttributes = {}, blockName, selector ) {
	const { layout = {}, style = {} } = blockAttributes;
	// Update type for blocks using legacy layouts.
	const usedLayout =
		layout?.inherit || layout?.contentSize || layout?.wideSize
			? { ...layout, type: 'constrained' }
			: layout || {};
	const fullLayoutType = getLayoutType( usedLayout?.type || 'default' );
	const blockGapSupport = useSetting( 'spacing.blockGap' );
	const hasBlockGapSupport = blockGapSupport !== null;
	const css = fullLayoutType?.getLayoutStyle?.( {
		blockName,
		selector,
		layout,
		style,
		hasBlockGapSupport,
	} );
	return css;
}

function LayoutPanel( { setAttributes, attributes, name: blockName } ) {
	const { layout } = attributes;
	const defaultThemeLayout = useSetting( 'layout' );
	const { themeSupportsLayout } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			themeSupportsLayout: getSettings().supportsLayout,
		};
	}, [] );
	const blockEditingMode = useBlockEditingMode();

	const layoutBlockSupport = getBlockSupport(
		blockName,
		layoutBlockSupportKey,
		{}
	);
	const {
		// allowSwitching,
		allowEditing = true,
		// allowInheriting = true,
		default: defaultBlockLayout,
	} = layoutBlockSupport;

	if ( ! allowEditing ) {
		return null;
	}

	// Only show the inherit toggle if it's supported,
	// a default theme layout is set (e.g. one that provides `contentSize` and/or `wideSize` values),
	// and either the default / flow or the constrained layout type is in use, as the toggle switches from one to the other.
	// const showInheritToggle = !! (
	// 	allowInheriting &&
	// 	!! defaultThemeLayout &&
	// 	( ! layout?.type ||
	// 		layout?.type === 'default' ||
	// 		layout?.type === 'constrained' ||
	// 		layout?.inherit )
	// );

	const usedLayout = layout || defaultBlockLayout || {};
	const {
		inherit = false,
		type = 'default',
		contentSize = null,
		orientation = 'horizontal',
		flexWrap = 'nowrap',
	} = usedLayout;
	/**
	 * `themeSupportsLayout` is only relevant to the `default/flow` or
	 * `constrained` layouts and it should not be taken into account when other
	 * `layout` types are used.
	 */
	if (
		( type === 'default' || type === 'constrained' ) &&
		! themeSupportsLayout
	) {
		return null;
	}
	const layoutType = getLayoutType( type );
	const constrainedType = getLayoutType( 'constrained' );
	const displayControlsForLegacyLayouts =
		! usedLayout.type && ( contentSize || inherit );
	// const hasContentSizeOrLegacySettings = !! inherit || !! contentSize;

	const onChangeType = ( newType ) => {
		if ( newType === 'stack' ) {
			const { innerWidth } = usedLayout;
			if ( innerWidth === 'fit' ) {
				setAttributes( {
					layout: {
						...usedLayout,
						type: 'flex',
						orientation: 'vertical',
					},
				} );
			} else if ( innerWidth === 'theme' ) {
				setAttributes( {
					layout: {
						type: 'constrained',
					},
				} );
			} else {
				setAttributes( { layout: { type: 'default' } } );
			}
		} else {
			setAttributes( { layout: { ...usedLayout, type: newType } } );
		}
	};

	const onChangeInnerWidth = ( key ) => {
		if ( key === 'theme' ) {
			setAttributes( {
				layout: { ...usedLayout, type: 'constrained', innerWidth: key },
			} );
		} else if ( key === 'fit' ) {
			if (
				usedLayout.type === 'constrained' ||
				usedLayout.type === 'default'
			) {
				setAttributes( {
					layout: {
						...usedLayout,
						type: 'flex',
						orientation: 'vertical',
						innerWidth: key,
					},
				} );
			} else {
				setAttributes( {
					layout: { ...usedLayout, type: 'flex', innerWidth: key },
				} );
			}
		} else {
			setAttributes( {
				layout: { ...usedLayout, innerWidth: key },
			} );
		}
	};

	const onChangeLayout = ( newLayout ) =>
		setAttributes( { layout: newLayout } );

	const onChangeGap = ( newGap ) => {
		setAttributes( {
			style: {
				...style,
				spacing: {
					...style?.spacing,
					blockGap: `${ newGap }px`,
				},
			},
		} );
	};

	const onChangeWrap = ( newWrap ) => {
		setAttributes( {
			layout: {
				...usedLayout,
				flexWrap: newWrap,
			},
		} );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Layout' ) }>
					{ /* { showInheritToggle && (
						<>
							<ToggleControl
								__nextHasNoMarginBottom
								style={{marginBottom: , marginTop: 00}}
								className="block-editor-hooks__toggle-control"
								label={ __( 'Inner blocks use content width' ) }
								checked={
									layoutType?.name === 'constrained' ||
									hasContentSizeOrLegacySettings
								}
								onChange={ () =>
									setAttributes( {
										layout: {
											type:
												layoutType?.name ===
													'constrained' ||
												hasContentSizeOrLegacySettings
													? 'default'
													: 'constrained',
										},
									} )
								}
								help={
									layoutType?.name === 'constrained' ||
									hasContentSizeOrLegacySettings
										? __(
												'Nested blocks use content width with options for full and wide widths.'
										  )
										: __(
												'Nested blocks will fill the width of this container. Toggle to constrain.'
										  )
								}
							/>
						</>
					) } */ }

					{ /* { ! inherit && allowSwitching && (
						<LayoutTypeSwitcher
							type={ type }
							onChange={ onChangeType }
						/>
					) } */ }
					<VStack spacing={ 3 } className="components-wrapper-vstack">
						<ToggleGroupControl
							__nextHasNoMarginBottom
							style={ { marginBottom: 0, marginTop: 0 } }
							size={ '__unstable-large' }
							label={ __( 'Layout direction' ) }
							value={
								type === 'default' ||
								type === 'constrained' ||
								( type === 'flex' &&
									orientation === 'vertical' )
									? 'stack'
									: type
							}
							onChange={ onChangeType }
							isBlock={ true }
							className="components-toggle-group-control__full-width"
						>
							<ToggleGroupControlOptionIcon
								key={ 'stack' }
								icon={ arrowDown }
								value="stack"
								label={ __( 'Stack' ) }
							/>
							<ToggleGroupControlOptionIcon
								key={ 'row' }
								icon={ arrowRight }
								value="flex"
								label={ __( 'Row' ) }
							/>
							<ToggleGroupControlOptionIcon
								key={ 'grid' }
								icon={ grid }
								value="grid"
								label={ __( 'Grid' ) }
							/>
						</ToggleGroupControl>
						{ layoutType && layoutType.name === 'grid' && (
							<layoutType.inspectorControls
								layout={ usedLayout }
								onChange={ onChangeLayout }
								layoutBlockSupport={ layoutBlockSupport }
							/>
						) }
						<HStack spacing={ 2 } justify="stretch">
							<FlexBlock>
								<ToggleGroupControl
									__nextHasNoMarginBottom
									style={ { marginBottom: 0, marginTop: 0 } }
									label={ __( 'Vertical' ) }
									value={
										usedLayout?.verticalAlignment || 'top'
									}
									onChange={ ( selectedItem ) => {
										setAttributes( {
											layout: {
												...usedLayout,
												verticalAlignment: selectedItem,
											},
										} );
									} }
									isBlock={ true }
									className="components-toggle-group-control__full-width"
								>
									{ verticalAlignmentOptions.map(
										( option ) => (
											<ToggleGroupControlOptionIcon
												key={ option.value }
												icon={ option.icon }
												value={ option.value }
												label={ option.label }
											/>
										)
									) }
								</ToggleGroupControl>
							</FlexBlock>
							<FlexBlock>
								<ToggleGroupControl
									__nextHasNoMarginBottom
									style={ { marginBottom: 0, marginTop: 0 } }
									label={ __( 'Horizontal' ) }
									value={ 'left' }
									isBlock={ true }
									onChange={ ( selectedItem ) => {
										setAttributes( {
											layout: {
												...usedLayout,
												justifyContent: selectedItem,
											},
										} );
									} }
									className="components-toggle-group-control__full-width"
								>
									{ horizontalAlignmentOptions.map(
										( { value, icon, label } ) => (
											<ToggleGroupControlOptionIcon
												key={ value }
												icon={ icon }
												value={ value }
												label={ label }
											/>
										)
									) }
								</ToggleGroupControl>
							</FlexBlock>
						</HStack>
						<ToggleGroupControl
							__nextHasNoMarginBottom
							style={ { marginBottom: 0, marginTop: 0 } }
							label={ __( 'Content width' ) }
							value={ usedLayout?.verticalAlignment || 'top' }
							onChange={ onChangeInnerWidth }
							isBlock={ true }
							className="components-toggle-group-control__full-width"
						>
							{ innerWidthOptions.map( ( option ) => (
								<ToggleGroupControlOptionIcon
									key={ option.value }
									icon={ option.icon }
									value={ option.value }
									label={ option.label }
								/>
							) ) }
						</ToggleGroupControl>
						{ layoutType &&
							layoutType.name === 'grid' &&
							orientation === 'horizontal' && (
								<div style={ { marginTop: '24px' } }>
									<ToggleGroupControl
										__nextHasNoMarginBottom
										style={ {
											marginBottom: 0,
											marginTop: 0,
										} }
										size={ '__unstable-large' }
										label={ __( 'Wrap' ) }
										value={ flexWrap }
										onChange={ onChangeWrap }
										isBlock={ true }
									>
										<ToggleGroupControlOption
											key={ 'wrap' }
											value="wrap"
											label={ __( 'Yes' ) }
										/>
										<ToggleGroupControlOption
											key={ 'nowrap' }
											value="nowrap"
											label={ __( 'No' ) }
										/>
									</ToggleGroupControl>
								</div>
							) }
						{ /* { layoutType &&
						layoutType.name !== 'default' &&
						layoutType.name !== 'constrained' && (
							<layoutType.inspectorControls
								layout={ usedLayout }
								onChange={ onChangeLayout }
								layoutBlockSupport={ layoutBlockSupport }
							/>
						) } */ }
						{ constrainedType &&
							displayControlsForLegacyLayouts && (
								<constrainedType.inspectorControls
									layout={ usedLayout }
									onChange={ onChangeLayout }
									layoutBlockSupport={ layoutBlockSupport }
								/>
							) }
						<RangeControl
							label={ __( 'Gap' ) }
							onChange={ onChangeGap }
							value={ style?.spacing?.blockGap }
							min={ 0 }
							max={ 100 }
							withInputField={ false }
						/>
					</VStack>
				</PanelBody>
			</InspectorControls>
			{ ! inherit && blockEditingMode === 'default' && layoutType && (
				<layoutType.toolBarControls
					layout={ usedLayout }
					onChange={ onChangeLayout }
					layoutBlockSupport={ layoutBlockSupport }
				/>
			) }
		</>
	);
}
// function LayoutTypeSwitcher( { type, onChange } ) {
// 	return (
// 		<ButtonGroup>
// 			{ getLayoutTypes().map( ( { name, label } ) => {
// 				return (
// 					<Button
// 						key={ name }
// 						isPressed={ type === name }
// 						onClick={ () => onChange( name ) }
// 					>
// 						{ label }
// 					</Button>
// 				);
// 			} ) }
// 		</ButtonGroup>
// 	);
// }

/**
 * Filters registered block settings, extending attributes to include `layout`.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	if ( 'type' in ( settings.attributes?.layout ?? {} ) ) {
		return settings;
	}
	if ( hasLayoutBlockSupport( settings ) ) {
		settings.attributes = {
			...settings.attributes,
			layout: {
				type: 'object',
			},
		};
	}

	return settings;
}

/**
 * Override the default edit UI to include layout controls
 *
 * @param {Function} BlockEdit Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name: blockName } = props;
		const supportLayout = hasLayoutBlockSupport( blockName );

		const blockEditingMode = useBlockEditingMode();
		return [
			supportLayout && blockEditingMode === 'default' && (
				<LayoutPanel key="layout" { ...props } />
			),
			<BlockEdit key="edit" { ...props } />,
		];
	},
	'withInspectorControls'
);

/**
 * Override the default block element to add the layout styles.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withLayoutStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const blockSupportsLayout = hasLayoutBlockSupport( name );
		const disableLayoutStyles = useSelect( ( select ) => {
			const { getSettings } = select( blockEditorStore );
			return !! getSettings().disableLayoutStyles;
		} );
		const shouldRenderLayoutStyles =
			blockSupportsLayout && ! disableLayoutStyles;
		const id = useInstanceId( BlockListBlock );
		const element = useContext( BlockList.__unstableElementContext );
		const { layout } = attributes;
		const { default: defaultBlockLayout } =
			getBlockSupport( name, layoutBlockSupportKey ) || {};
		const usedLayout =
			layout?.inherit || layout?.contentSize || layout?.wideSize
				? { ...layout, type: 'constrained' }
				: layout || defaultBlockLayout || {};
		const layoutClasses = blockSupportsLayout
			? useLayoutClasses( attributes, name )
			: null;
		// Higher specificity to override defaults from theme.json.
		const selector = `.wp-container-${ id }.wp-container-${ id }`;
		const blockGapSupport = useSetting( 'spacing.blockGap' );
		const hasBlockGapSupport = blockGapSupport !== null;

		// Get CSS string for the current layout type.
		// The CSS and `style` element is only output if it is not empty.
		let css;
		if ( shouldRenderLayoutStyles ) {
			const fullLayoutType = getLayoutType(
				usedLayout?.type || 'default'
			);
			css = fullLayoutType?.getLayoutStyle?.( {
				blockName: name,
				selector,
				layout: usedLayout,
				style: attributes?.style,
				hasBlockGapSupport,
			} );
		}

		// Attach a `wp-container-` id-based class name as well as a layout class name such as `is-layout-flex`.
		const layoutClassNames = classnames(
			{
				[ `wp-container-${ id }` ]: shouldRenderLayoutStyles && !! css, // Only attach a container class if there is generated CSS to be attached.
			},
			layoutClasses
		);

		return (
			<>
				{ shouldRenderLayoutStyles &&
					element &&
					!! css &&
					createPortal(
						<LayoutStyle
							blockName={ name }
							selector={ selector }
							css={ css }
							layout={ usedLayout }
							style={ attributes?.style }
						/>,
						element
					) }
				<BlockListBlock
					{ ...props }
					__unstableLayoutClassNames={ layoutClassNames }
				/>
			</>
		);
	},
	'withLayoutStyles'
);

/**
 * Override the default block element to add the child layout styles.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withChildLayoutStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { attributes } = props;
		const { style: { layout = {} } = {} } = attributes;
		const { selfStretch, flexSize } = layout;
		const hasChildLayout = selfStretch || flexSize;
		const disableLayoutStyles = useSelect( ( select ) => {
			const { getSettings } = select( blockEditorStore );
			return !! getSettings().disableLayoutStyles;
		} );
		const shouldRenderChildLayoutStyles =
			hasChildLayout && ! disableLayoutStyles;

		const element = useContext( BlockList.__unstableElementContext );
		const id = useInstanceId( BlockListBlock );
		const selector = `.wp-container-content-${ id }`;

		let css = '';

		if ( selfStretch === 'fixed' && flexSize ) {
			css += `${ selector } {
				flex-basis: ${ flexSize };
				box-sizing: border-box;
			}`;
		} else if ( selfStretch === 'fill' ) {
			css += `${ selector } {
				flex-grow: 1;
			}`;
		}

		// Attach a `wp-container-content` id-based classname.
		const className = classnames( props?.className, {
			[ `wp-container-content-${ id }` ]:
				shouldRenderChildLayoutStyles && !! css, // Only attach a container class if there is generated CSS to be attached.
		} );

		return (
			<>
				{ shouldRenderChildLayoutStyles &&
					element &&
					!! css &&
					createPortal( <style>{ css }</style>, element ) }
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	},
	'withChildLayoutStyles'
);

addFilter(
	'blocks.registerBlockType',
	'core/layout/addAttribute',
	addAttribute
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/layout/with-layout-styles',
	withLayoutStyles
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/layout/with-child-layout-styles',
	withChildLayoutStyles
);
addFilter(
	'editor.BlockEdit',
	'core/editor/layout/with-inspector-controls',
	withInspectorControls
);
