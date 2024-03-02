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
	Button,
	ButtonGroup,
	ToggleControl,
	PanelBody,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';
import { useSettings } from '../components/use-settings';
import { getLayoutType, getLayoutTypes } from '../layouts';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { LAYOUT_DEFINITIONS } from '../layouts/definitions';
import { useBlockSettings, useStyleOverride } from './utils';
import { unlock } from '../lock-unlock';

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

function LayoutPanelPure( {
	layout,
	setAttributes,
	name: blockName,
	clientId,
} ) {
	const settings = useBlockSettings( blockName );
	// Block settings come from theme.json under settings.[blockName].
	const { layout: layoutSettings } = settings;
	// Layout comes from block attributes.
	const [ defaultThemeLayout ] = useSettings( 'layout' );
	const { themeSupportsLayout } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			themeSupportsLayout: getSettings().supportsLayout,
		};
	}, [] );
	const blockEditingMode = useBlockEditingMode();

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

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
		allowSwitching,
		allowEditing = true,
		allowInheriting = true,
		default: defaultBlockLayout,
	} = blockSupportAndThemeSettings;

	if ( ! allowEditing ) {
		return null;
	}

	// Only show the inherit toggle if it's supported,
	// a default theme layout is set (e.g. one that provides `contentSize` and/or `wideSize` values),
	// and either the default / flow or the constrained layout type is in use, as the toggle switches from one to the other.
	const showInheritToggle = !! (
		allowInheriting &&
		!! defaultThemeLayout &&
		( ! layout?.type ||
			layout?.type === 'default' ||
			layout?.type === 'constrained' ||
			layout?.inherit )
	);

	const usedLayout = layout || defaultBlockLayout || {};
	const {
		inherit = false,
		type = 'default',
		contentSize = null,
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
	const hasContentSizeOrLegacySettings = !! inherit || !! contentSize;

	const onChangeType = ( newType ) =>
		setAttributes( { layout: { type: newType } } );
	const onChangeLayout = ( newLayout ) =>
		setAttributes( { layout: newLayout } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Layout' ) }>
					{ showInheritToggle && (
						<>
							<ToggleControl
								__nextHasNoMarginBottom
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
					) }

					{ ! inherit && allowSwitching && (
						<LayoutTypeSwitcher
							type={ type }
							onChange={ onChangeType }
						/>
					) }

					{ layoutType && layoutType.name !== 'default' && (
						<layoutType.inspectorControls
							layout={ usedLayout }
							onChange={ onChangeLayout }
							layoutBlockSupport={ blockSupportAndThemeSettings }
							name={ blockName }
							clientId={ clientId }
						/>
					) }
					{ constrainedType && displayControlsForLegacyLayouts && (
						<constrainedType.inspectorControls
							layout={ usedLayout }
							onChange={ onChangeLayout }
							layoutBlockSupport={ blockSupportAndThemeSettings }
							name={ blockName }
							clientId={ clientId }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			{ ! inherit && layoutType && (
				<layoutType.toolBarControls
					layout={ usedLayout }
					onChange={ onChangeLayout }
					layoutBlockSupport={ layoutBlockSupport }
					name={ blockName }
					clientId={ clientId }
				/>
			) }
		</>
	);
}

export default {
	shareWithChildBlocks: true,
	edit: LayoutPanelPure,
	attributeKeys: [ 'layout' ],
	hasSupport( name ) {
		return hasLayoutBlockSupport( name );
	},
};

function LayoutTypeSwitcher( { type, onChange } ) {
	return (
		<ButtonGroup>
			{ getLayoutTypes().map( ( { name, label } ) => {
				return (
					<Button
						key={ name }
						isPressed={ type === name }
						onClick={ () => onChange( name ) }
					>
						{ label }
					</Button>
				);
			} ) }
		</ButtonGroup>
	);
}

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
