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
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import {
	Button,
	ToggleControl,
	PanelBody,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, positionCenter, stretchWide } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';
import useSetting from '../components/use-setting';
import { LayoutStyle } from '../components/block-list/layout';

function LayoutPanel( { setAttributes, attributes } ) {
	const { layout = {} } = attributes;
	const { wideSize, contentSize, inherit = false } = layout;
	const defaultLayout = useSetting( 'layout' );
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().supportsLayout;
	}, [] );

	const units = useCustomUnits( {
		availableUnits: useSetting( 'layout.units' ) || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

	if ( ! themeSupportsLayout ) {
		return null;
	}
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
				{ ! inherit && (
					<>
						<div className="block-editor-hooks__layout-controls">
							<div className="block-editor-hooks__layout-controls-unit">
								<UnitControl
									label={ __( 'Content' ) }
									labelPosition="top"
									__unstableInputWidth="80px"
									value={ contentSize || wideSize || '' }
									onChange={ ( nextWidth ) => {
										nextWidth =
											0 > parseFloat( nextWidth )
												? '0'
												: nextWidth;
										setAttributes( {
											layout: {
												...layout,
												contentSize: nextWidth,
											},
										} );
									} }
									units={ units }
								/>
								<Icon icon={ positionCenter } />
							</div>
							<div className="block-editor-hooks__layout-controls-unit">
								<UnitControl
									label={ __( 'Wide' ) }
									labelPosition="top"
									__unstableInputWidth="80px"
									value={ wideSize || contentSize || '' }
									onChange={ ( nextWidth ) => {
										nextWidth =
											0 > parseFloat( nextWidth )
												? '0'
												: nextWidth;
										setAttributes( {
											layout: {
												...layout,
												wideSize: nextWidth,
											},
										} );
									} }
									units={ units }
								/>
								<Icon icon={ stretchWide } />
							</div>
						</div>
						<div className="block-editor-hooks__layout-controls-reset">
							<Button
								variant="secondary"
								isSmall
								disabled={ ! contentSize && ! wideSize }
								onClick={ () =>
									setAttributes( {
										layout: {
											contentSize: undefined,
											wideSize: undefined,
											inherit: false,
										},
									} )
								}
							>
								{ __( 'Reset' ) }
							</Button>
						</div>
					</>
				) }
				<p className="block-editor-hooks__layout-controls-helptext">
					{ __(
						'Customize the width for all elements that are assigned to the center or wide columns.'
					) }
				</p>
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Filters registered block settings, extending attributes to include `layout`.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addAttribute( settings ) {
	if ( has( settings.attributes, [ 'layout', 'type' ] ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, '__experimentalLayout' ) ) {
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
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
export const withInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name: blockName } = props;
		const supportLayout = hasBlockSupport(
			blockName,
			'__experimentalLayout'
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
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
export const withLayoutStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const supportLayout = hasBlockSupport( name, '__experimentalLayout' );
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

		return (
			<>
				<LayoutStyle
					selector={ `.wp-container-${ id }` }
					layout={ usedLayout }
				/>
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
