/**
 * External dependencies
 */
import classnames from 'classnames';
import { has, kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import {
	getBlockDefaultClassName,
	getBlockSupport,
	hasBlockSupport,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import {
	Button,
	ButtonGroup,
	ToggleControl,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';
import useSetting from '../components/use-setting';
import { LayoutStyle } from '../components/block-list/layout';
import BlockList from '../components/block-list';
import { getLayoutType, getLayoutTypes } from '../layouts';

const layoutBlockSupportKey = '__experimentalLayout';

/**
 * Generates the utility classnames for the given blocks layout attributes.
 * This method was primarily added to reintroduce classnames that were removed
 * in the 5.9 release (https://github.com/WordPress/gutenberg/issues/38719), rather
 * than providing an extensive list of all possible layout classes. The plan is to
 * have the style engine generate a more extensive list of utility classnames which
 * will then replace this method.
 *
 * @param { Object } layout            Layout object.
 * @param { Object } layoutDefinitions An object containing layout definitions, stored in theme.json.
 *
 * @return { Array } Array of CSS classname strings.
 */
function useLayoutClasses( layout, layoutDefinitions ) {
	const rootPaddingAlignment = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().__experimentalFeatures
			?.useRootPaddingAwareAlignments;
	}, [] );
	const layoutClassnames = [];

	if ( layoutDefinitions?.[ layout?.type || 'default' ]?.className ) {
		layoutClassnames.push(
			layoutDefinitions?.[ layout?.type || 'default' ]?.className
		);
	}

	if ( ( layout?.inherit || layout?.contentSize ) && rootPaddingAlignment ) {
		layoutClassnames.push( 'has-global-padding' );
	}

	if ( layout?.orientation ) {
		layoutClassnames.push( `is-${ kebabCase( layout.orientation ) }` );
	}

	if ( layout?.justifyContent ) {
		layoutClassnames.push(
			`is-content-justification-${ kebabCase( layout.justifyContent ) }`
		);
	}

	if ( layout?.flexWrap && layout.flexWrap === 'nowrap' ) {
		layoutClassnames.push( 'is-nowrap' );
	}

	return layoutClassnames;
}

function LayoutPanel( { setAttributes, attributes, name: blockName } ) {
	const { layout } = attributes;
	const defaultThemeLayout = useSetting( 'layout' );
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().supportsLayout;
	}, [] );

	const layoutBlockSupport = getBlockSupport(
		blockName,
		layoutBlockSupportKey,
		{}
	);
	const {
		allowSwitching,
		allowEditing = true,
		allowInheriting = true,
		default: defaultBlockLayout,
	} = layoutBlockSupport;

	if ( ! allowEditing ) {
		return null;
	}

	// Only show the inherit toggle if it's supported,
	// a default theme layout is set (e.g. one that provides `contentSize` and/or `wideSize` values),
	// and either the default / flow or the column layout type is in use, as the toggle switches from one to the other.
	const showInheritToggle = !! (
		allowInheriting &&
		!! defaultThemeLayout &&
		( ! layout?.type ||
			layout?.type === 'default' ||
			layout?.type === 'column' ||
			layout?.inherit )
	);

	const usedLayout = layout || defaultBlockLayout || {};
	const { inherit = false, type = 'default' } = usedLayout;
	/**
	 * `themeSupportsLayout` is only relevant to the `default/flow`
	 * layout and it should not be taken into account when other
	 * `layout` types are used.
	 */
	if ( type === 'default' && ! themeSupportsLayout ) {
		return null;
	}
	const layoutType = getLayoutType( type );

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
								label={ __(
									'Inner blocks respect content width'
								) }
								checked={ layoutType?.name === 'column' }
								onChange={ () =>
									setAttributes( {
										layout: {
											type:
												layoutType?.name === 'column'
													? 'default'
													: 'column',
										},
									} )
								}
							/>
							<p className="block-editor-hooks__layout-controls-helptext">
								{ !! inherit
									? __(
											'Nested blocks use theme content width with options for full and wide widths.'
									  )
									: __(
											'Nested blocks will fill the width of this container.'
									  ) }
							</p>
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
							layoutBlockSupport={ layoutBlockSupport }
						/>
					) }
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
	if ( has( settings.attributes, [ 'layout', 'type' ] ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, layoutBlockSupportKey ) ) {
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
		const supportLayout = hasBlockSupport(
			blockName,
			layoutBlockSupportKey
		);

		return [
			supportLayout && <LayoutPanel key="layout" { ...props } />,
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
		const hasLayoutBlockSupport = hasBlockSupport(
			name,
			layoutBlockSupportKey
		);
		const disableLayoutStyles = useSelect( ( select ) => {
			const { getSettings } = select( blockEditorStore );
			return !! getSettings().disableLayoutStyles;
		} );
		const shouldRenderLayoutStyles =
			hasLayoutBlockSupport && ! disableLayoutStyles;
		const id = useInstanceId( BlockListBlock );
		const defaultThemeLayout = useSetting( 'layout' ) || {};
		const element = useContext( BlockList.__unstableElementContext );
		const { layout } = attributes;
		const { default: defaultBlockLayout } =
			getBlockSupport( name, layoutBlockSupportKey ) || {};
		const usedLayout = layout?.inherit
			? defaultThemeLayout
			: layout || defaultBlockLayout || {};
		const layoutClasses = hasLayoutBlockSupport
			? useLayoutClasses( usedLayout, defaultThemeLayout?.definitions )
			: null;
		const selector = `.${ getBlockDefaultClassName(
			name
		) }.wp-container-${ id }`;
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
				layoutDefinitions: defaultThemeLayout?.definitions,
				style: attributes?.style,
				hasBlockGapSupport,
			} );
		}

		// Attach a `wp-container-` id-based class name as well as a layout class name such as `is-layout-flex`.
		const className = classnames(
			props?.className,
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
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	}
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
	'editor.BlockEdit',
	'core/editor/layout/with-inspector-controls',
	withInspectorControls
);
