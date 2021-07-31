/**
 * External dependencies
 */
import classnames from 'classnames';
import { has } from 'lodash';

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
import { Head } from '../components/block-list/head';
import { getLayoutType, getLayoutTypes } from '../layouts';

const layoutBlockSupportKey = '__experimentalLayout';

const canBlockSwitchLayout = ( blockTypeOrName ) => {
	const layoutBlockSupportConfig = getBlockSupport(
		blockTypeOrName,
		layoutBlockSupportKey
	);

	return layoutBlockSupportConfig?.allowSwitching;
};

function LayoutPanel( { setAttributes, attributes, name: blockName } ) {
	const { layout = {} } = attributes;
	const defaultLayout = useSetting( 'layout' );
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().supportsLayout;
	}, [] );

	if ( ! themeSupportsLayout ) {
		return null;
	}

	const allowLayoutSwitching = canBlockSwitchLayout( blockName );
	const { inherit = false, type = 'default' } = layout;
	const layoutType = getLayoutType( type );

	const onChangeType = ( newType ) =>
		setAttributes( { layout: { type: newType } } );
	const onChangeLayout = ( newLayout ) =>
		setAttributes( { layout: newLayout } );

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Layout' ) }>
				{ !! defaultLayout && (
					<ToggleControl
						label={ __( 'Inherit default layout' ) }
						checked={ !! inherit }
						onChange={ () =>
							setAttributes( { layout: { inherit: ! inherit } } )
						}
					/>
				) }

				{ ! inherit && allowLayoutSwitching && (
					<LayoutTypeSwitcher
						type={ type }
						onChange={ onChangeType }
					/>
				) }

				{ ! inherit && layoutType && (
					<layoutType.edit
						layout={ layout }
						onChange={ onChangeLayout }
					/>
				) }
			</PanelBody>
		</InspectorControls>
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
		const supportLayout = hasBlockSupport( name, layoutBlockSupportKey );
		const id = useInstanceId( BlockListBlock );
		const defaultLayout = useSetting( 'layout' ) || {};
		if ( ! supportLayout ) {
			return <BlockListBlock { ...props } />;
		}
		const { layout = {} } = attributes;
		const usedLayout = !! layout && layout.inherit ? defaultLayout : layout;
		const className = classnames(
			props?.className,
			`wp-container-${ id }`
		);

		const element = useContext( Head.context );

		return (
			<>
				{ element &&
					createPortal(
						<LayoutStyle
							selector={ `.wp-container-${ id }` }
							layout={ usedLayout }
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
