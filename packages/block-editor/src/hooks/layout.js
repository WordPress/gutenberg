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
import { useSelect, useDispatch } from '@wordpress/data';
import {
	CustomSelectControl,
	FlexBlock,
	PanelBody,
	RangeControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	arrowRight,
	arrowDown,
	grid,
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifySpaceBetween,
	justifyStretch,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';
import { useSettings } from '../components/use-settings';
import { getLayoutType } from '../layouts';
import { useLayout } from '../components/block-list/layout';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { LAYOUT_DEFINITIONS } from '../layouts/definitions';
import { useBlockSettings, useStyleOverride } from './utils';
import { unlock } from '../lock-unlock';

import {
	alignTop,
	alignCenter,
	alignBottom,
	spaceBetween,
	alignStretch,
} from '../components/block-vertical-alignment-control/icons';

const layoutBlockSupportKey = 'layout';

function hasLayoutBlockSupport( blockName ) {
	return (
		hasBlockSupport( blockName, 'layout' ) ||
		hasBlockSupport( blockName, '__experimentalLayout' )
	);
}

/**
 * Generates the utility classnames for the given block's layout attributes.
 *
 * @param { Object } blockAttributes Block attributes.
 * @param { string } blockName       Block name.
 *
 * @return { Array } Array of CSS classname strings.
 */
export function useLayoutClasses( blockAttributes = {}, blockName = '' ) {
	const { kebabCase } = unlock( componentsPrivateApis );
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
		const splitBlockName = blockName.split( '/' );
		const fullBlockName =
			splitBlockName[ 0 ] === 'core'
				? splitBlockName.pop()
				: splitBlockName.join( '-' );
		const compoundClassName = `wp-block-${ fullBlockName }-${ baseClassName }`;
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
	const [ blockGapSupport ] = useSettings( 'spacing.blockGap' );
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

function LayoutPanelPure( { layout, style, setAttributes, name: blockName } ) {
	const settings = useBlockSettings( blockName );
	// Block settings come from theme.json under settings.[blockName].
	const { layout: layoutSettings } = settings;
	const { allowEditing: allowEditingSetting } = layoutSettings;

	const { themeSupportsLayout } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			themeSupportsLayout: getSettings().supportsLayout,
		};
	}, [] );

	// Layout block support comes from the block's block.json.
	const layoutBlockSupport = getBlockSupport(
		blockName,
		layoutBlockSupportKey,
		{}
	);
	const blockSupportAndThemeSettings = {
		...layoutSettings,
		...layoutBlockSupport,
	};
	const {
		allowSwitching = false,
		allowEditing = allowEditingSetting ?? true,
		allowInheriting = true,
		default: defaultBlockLayout = { type: 'default' },
	} = blockSupportAndThemeSettings;

	const usedLayout = layout || defaultBlockLayout || {};
	const {
		inherit = false,
		type = 'default',
		contentSize = null,
		orientation = 'horizontal',
		flexWrap = 'nowrap',
		justifyContent = 'left',
		verticalAlignment = 'center',
	} = usedLayout;
	const { type: defaultBlockLayoutType } = defaultBlockLayout;

	const blockEditingMode = useBlockEditingMode();

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	if ( ! allowEditing ) {
		return null;
	}

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

	const innerWidthOptions = [
		{
			key: 'fill',
			value: 'fill',
			name: __( 'Fill' ),
		},
	];

	if ( allowSwitching || defaultBlockLayoutType === 'flex' ) {
		innerWidthOptions.unshift( {
			key: 'fit',
			value: 'fit',
			name: __( 'Fit' ),
		} );
	}

	if ( allowInheriting ) {
		innerWidthOptions.unshift( {
			key: 'theme',
			value: 'theme',
			name: __( 'Boxed' ),
		} );
	}

	const horizontalAlignmentOptions = [
		{
			key: 'left',
			value: 'left',
			icon: justifyLeft,
			name: __( 'Left' ),
		},
		{
			key: 'center',
			value: 'center',
			icon: justifyCenter,
			name: __( 'Center' ),
		},
		{
			key: 'right',
			value: 'right',
			icon: justifyRight,
			name: __( 'Right' ),
		},
	];
	if ( orientation === 'vertical' ) {
		horizontalAlignmentOptions.push( {
			key: 'stretch',
			value: 'stretch',
			icon: justifyStretch,
			name: __( 'Stretch' ),
		} );
	} else {
		horizontalAlignmentOptions.push( {
			key: 'space-between',
			value: 'space-between',
			icon: justifySpaceBetween,
			name: __( 'Space Between' ),
		} );
	}

	const horizontalControlValue = horizontalAlignmentOptions.find(
		( option ) => option.value === justifyContent
	);

	const onChangeHorizontal = ( { selectedItem } ) => {
		const { key } = selectedItem;
		setAttributes( {
			layout: {
				...usedLayout,
				justifyContent: key,
			},
		} );
	};

	const verticalAlignmentOptions = [
		{
			key: 'top',
			value: 'top',
			icon: alignTop,
			name: __( 'Top' ),
		},
		{
			key: 'center',
			value: 'center',
			icon: alignCenter,
			name: __( 'Middle' ),
		},
		{
			key: 'bottom',
			value: 'bottom',
			icon: alignBottom,
			name: __( 'Bottom' ),
		},
	];
	if ( orientation === 'vertical' ) {
		verticalAlignmentOptions.push( {
			key: 'space-between',
			value: 'space-between',
			icon: spaceBetween,
			name: __( 'Space Between' ),
		} );
	} else {
		verticalAlignmentOptions.push( {
			key: 'stretch',
			value: 'stretch',
			icon: alignStretch,
			name: __( 'Stretch' ),
		} );
	}

	const verticalControlValue = verticalAlignmentOptions.find(
		( option ) => option.value === verticalAlignment
	);

	const onChangeVertical = ( { selectedItem } ) => {
		const { key } = selectedItem;
		setAttributes( {
			layout: {
				...usedLayout,
				verticalAlignment: key,
			},
		} );
	};

	const onChangeType = ( newType ) => {
		if ( newType === 'stack' ) {
			const { type: previousLayoutType } = usedLayout;
			if ( previousLayoutType === 'flex' ) {
				let justification = justifyContent;
				let alignment = verticalAlignment;
				if ( justifyContent === 'space-between' ) {
					justification = 'left';
				}
				if ( verticalAlignment === 'stretch' ) {
					alignment = 'top';
				}
				setAttributes( {
					layout: {
						...usedLayout,
						type: 'flex',
						orientation: 'vertical',
						justifyContent: justification,
						verticalAlignment: alignment,
					},
				} );
			} else {
				setAttributes( {
					layout: {
						type: 'default',
					},
				} );
			}
		} else if ( newType === 'flex' ) {
			let justification = justifyContent;
			let alignment = verticalAlignment;
			if ( justifyContent === 'stretch' ) {
				justification = 'left';
			}
			if ( verticalAlignment === 'space-between' ) {
				alignment = 'center';
			}
			setAttributes( {
				layout: {
					...usedLayout,
					type: newType,
					orientation: 'horizontal',
					justifyContent: justification,
					verticalAlignment: alignment,
				},
			} );
		} else {
			setAttributes( {
				layout: {
					...usedLayout,
					type: newType,
				},
			} );
		}
	};

	const onChangeInnerWidth = ( { selectedItem } ) => {
		const { key } = selectedItem;
		if ( key === 'theme' ) {
			setAttributes( {
				layout: { ...usedLayout, type: 'constrained' },
			} );
		} else if ( key === 'fit' ) {
			setAttributes( {
				layout: {
					...usedLayout,
					type: 'flex',
					orientation: 'vertical',
				},
			} );
		} else {
			setAttributes( {
				layout: { ...usedLayout, type: 'default' },
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

	let defaultContentWidthValue = 'fill';
	if ( defaultBlockLayoutType === 'constrained' ) {
		defaultContentWidthValue = 'theme';
	} else if ( defaultBlockLayoutType === 'flex' ) {
		defaultContentWidthValue = 'fit';
	}

	let usedContentWidthValue = 'fill';
	if ( type === 'constrained' ) {
		usedContentWidthValue = 'theme';
	} else if ( type === 'flex' ) {
		usedContentWidthValue = 'fit';
	} else if ( ! type ) {
		usedContentWidthValue = defaultContentWidthValue;
	}

	const selectedContentWidth = innerWidthOptions.find(
		( option ) => option.value === usedContentWidthValue
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Layout' ) }>
					<VStack spacing={ 3 } className="components-wrapper-vstack">
						<HStack alignment="topLeft">
							{ ( allowSwitching ||
								defaultBlockLayoutType === 'flex' ) && (
								<FlexBlock>
									<ToggleGroupControl
										__nextHasNoMarginBottom
										label={ __( 'Direction' ) }
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

										{ allowSwitching && (
											<ToggleGroupControlOptionIcon
												key={ 'grid' }
												icon={ grid }
												value="grid"
												label={ __( 'Grid' ) }
											/>
										) }
									</ToggleGroupControl>
								</FlexBlock>
							) }
							<FlexBlock>
								{ ( ( type === 'flex' &&
									orientation === 'vertical' ) ||
									type === 'default' ||
									type === 'constrained' ) && (
									<CustomSelectControl
										label={ __( 'Content width' ) }
										value={ selectedContentWidth }
										options={ innerWidthOptions }
										onChange={ onChangeInnerWidth }
										__nextUnconstrainedWidth
										__next36pxDefaultSize
									/>
								) }
								{ type === 'flex' &&
									orientation === 'horizontal' && (
										<ToggleGroupControl
											__nextHasNoMarginBottom
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
									) }
							</FlexBlock>
						</HStack>

						{ type === 'grid' && (
							<layoutType.inspectorControls
								layout={ usedLayout }
								onChange={ onChangeLayout }
								layoutBlockSupport={
									blockSupportAndThemeSettings
								}
							/>
						) }

						<HStack alignment="topLeft">
							<>
								<FlexBlock>
									<CustomSelectControl
										label={ __( 'Vertical' ) }
										value={ verticalControlValue }
										options={ verticalAlignmentOptions }
										onChange={ onChangeVertical }
										__nextUnconstrainedWidth
										__next36pxDefaultSize
									/>
								</FlexBlock>
								<FlexBlock>
									<CustomSelectControl
										label={ __( 'Horizontal' ) }
										value={ horizontalControlValue }
										options={ horizontalAlignmentOptions }
										onChange={ onChangeHorizontal }
										__nextUnconstrainedWidth
										__next36pxDefaultSize
									/>
								</FlexBlock>
							</>
						</HStack>
						<HStack alignment="topLeft">
							<FlexBlock>
								<RangeControl
									label={ __( 'Block spacing' ) }
									onChange={ onChangeGap }
									value={ style?.spacing?.blockGap }
									min={ 0 }
									max={ 100 }
									withInputField={ false }
								/>
							</FlexBlock>
						</HStack>

						{ constrainedType &&
							displayControlsForLegacyLayouts && (
								<constrainedType.inspectorControls
									layout={ usedLayout }
									onChange={ onChangeLayout }
									layoutBlockSupport={
										blockSupportAndThemeSettings
									}
								/>
							) }
					</VStack>
				</PanelBody>
			</InspectorControls>
			{ ! inherit && layoutType && (
				<layoutType.toolBarControls
					layout={ usedLayout }
					onChange={ onChangeLayout }
					layoutBlockSupport={ layoutBlockSupport }
				/>
			) }
		</>
	);
}

export default {
	shareWithChildBlocks: true,
	edit: LayoutPanelPure,
	attributeKeys: [ 'layout', 'style' ],
	hasSupport( name ) {
		return hasLayoutBlockSupport( name );
	},
};

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

function BlockWithLayoutStyles( { block: BlockListBlock, props } ) {
	const { name, attributes } = props;
	const id = useInstanceId( BlockListBlock );
	const { layout } = attributes;
	const { default: defaultBlockLayout } =
		getBlockSupport( name, layoutBlockSupportKey ) || {};
	const usedLayout =
		layout?.inherit || layout?.contentSize || layout?.wideSize
			? { ...layout, type: 'constrained' }
			: layout || defaultBlockLayout || {};
	const layoutClasses = useLayoutClasses( attributes, name );

	const { kebabCase } = unlock( componentsPrivateApis );
	const selectorPrefix = `wp-container-${ kebabCase( name ) }-is-layout-`;
	// Higher specificity to override defaults from theme.json.
	const selector = `.${ selectorPrefix }${ id }.${ selectorPrefix }${ id }`;
	const [ blockGapSupport ] = useSettings( 'spacing.blockGap' );
	const hasBlockGapSupport = blockGapSupport !== null;

	// Get CSS string for the current layout type.
	// The CSS and `style` element is only output if it is not empty.
	const fullLayoutType = getLayoutType( usedLayout?.type || 'default' );
	const css = fullLayoutType?.getLayoutStyle?.( {
		blockName: name,
		selector,
		layout: usedLayout,
		style: attributes?.style,
		hasBlockGapSupport,
	} );

	// Attach a `wp-container-` id-based class name as well as a layout class name such as `is-layout-flex`.
	const layoutClassNames = classnames(
		{
			[ `${ selectorPrefix }${ id }` ]: !! css, // Only attach a container class if there is generated CSS to be attached.
		},
		layoutClasses
	);

	useStyleOverride( { css } );

	return (
		<BlockListBlock
			{ ...props }
			__unstableLayoutClassNames={ layoutClassNames }
		/>
	);
}

/**
 * Override the default block element to add the layout styles.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withLayoutStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const blockSupportsLayout = hasLayoutBlockSupport( props.name );
		const shouldRenderLayoutStyles = useSelect(
			( select ) => {
				// The callback returns early to avoid block editor subscription.
				if ( ! blockSupportsLayout ) {
					return false;
				}

				return ! select( blockEditorStore ).getSettings()
					.disableLayoutStyles;
			},
			[ blockSupportsLayout ]
		);

		if ( ! shouldRenderLayoutStyles ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockWithLayoutStyles block={ BlockListBlock } props={ props } />
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
		const parentLayout = useLayout() || {};
		const { orientation } = parentLayout;
		const { attributes } = props;
		const { style: { layout = {} } = {} } = attributes;
		const { width, height } = layout;
		const disableLayoutStyles = useSelect( ( select ) => {
			const { getSettings } = select( blockEditorStore );
			return !! getSettings().disableLayoutStyles;
		} );
		const shouldRenderChildLayoutStyles = ! disableLayoutStyles;

		const id = useInstanceId( BlockListBlock );
		const selector = `.wp-container-content-${ id }`;

		const isConstrained =
			parentLayout.type === 'constrained' ||
			parentLayout.type === 'default' ||
			parentLayout.type === undefined;

		const widthProp =
			isConstrained || orientation === 'vertical'
				? 'selfAlign'
				: 'selfStretch';
		const heightProp =
			isConstrained || orientation === 'vertical'
				? 'selfStretch'
				: 'selfAlign';

		let css = `${ selector } {
			box-sizing: border-box;}`;

		if ( orientation === 'horizontal' ) {
			// set width
			if ( layout[ widthProp ] === 'fixed' && width ) {
				css += `${ selector } {
					max-width: ${ width };
					flex-grow: 0;
					flex-shrink: 1;
					flex-basis: ${ width };
					
				}`;
			} else if ( layout[ widthProp ] === 'fixedNoShrink' && width ) {
				css += `${ selector } {
					width: ${ width };
					flex-shrink: 0;
					flex-grow: 0;
					flex-basis: auto;
				}`;
			} else if ( layout[ widthProp ] === 'fill' ) {
				css += `${ selector } {
					flex-grow: 1;
					flex-shrink: 1;
					flex-basis: 100%;
				}`;
			} else if ( layout[ widthProp ] === 'fit' ) {
				css += `${ selector } {
					flex-grow: 0;
					flex-shrink: 0;
					flex-basis: auto;
					width: fit-content;
				}`;
			}

			// set height
			if ( layout[ heightProp ] === 'fill' ) {
				css += `${ selector } {
					align-self: stretch;
				}`;
			} else if ( layout[ heightProp ] === 'fit' ) {
				css += `${ selector } {
						height: fit-content;
					}`;
			} else if ( layout[ heightProp ] === 'fixedNoShrink' ) {
				css += `${ selector } {
						height: ${ height };
					}`;
			}
		} else {
			// set width
			if ( layout[ widthProp ] === 'fixed' && width ) {
				css += `${ selector } {
					max-width: ${ width };
				}`;
			} else if ( layout[ widthProp ] === 'fixedNoShrink' && width ) {
				css += `${ selector } {
					width: ${ width };
				}`;
			} else if ( layout[ widthProp ] === 'fill' ) {
				css += `${ selector } {
					align-self: stretch;
				}`;
			} else if ( layout[ widthProp ] === 'fit' ) {
				css += `${ selector } {
					width: fit-content;
				}`;
			}

			// set height
			if ( layout[ heightProp ] === 'fixed' && height ) {
				css += `${ selector } {
					max-height: ${ height };
					flex-grow: 0;
					flex-shrink: 1;
					flex-basis: ${ height };
				}`;
			} else if ( layout[ heightProp ] === 'fixedNoShrink' && height ) {
				css += `${ selector } {
					height: ${ height };
					flex-shrink: 0;
					flex-grow: 0;
					flex-basis: auto;
				}`;
			} else if ( layout[ heightProp ] === 'fill' ) {
				css += `${ selector } {
					flex-grow: 1;
					flex-shrink: 1;
					flex-basis: 100%;
				}`;
			} else if ( layout[ heightProp ] === 'fit' ) {
				css += `${ selector } {
					flex-grow: 0;
					flex-shrink: 0;
					flex-basis: auto;
					height: auto;
				}`;
			}
		}

		// Attach a `wp-container-content` id-based classname.
		const className = classnames( props?.className, {
			[ `wp-container-content-${ id }` ]:
				shouldRenderChildLayoutStyles && !! css, // Only attach a container class if there is generated CSS to be attached.
		} );

		const { setStyleOverride, deleteStyleOverride } = unlock(
			useDispatch( blockEditorStore )
		);

		useEffect( () => {
			if ( ! css ) return;
			setStyleOverride( id, { css } );
			return () => {
				deleteStyleOverride( id );
			};
		}, [ id, css, setStyleOverride, deleteStyleOverride ] );

		return <BlockListBlock { ...props } className={ className } />;
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
