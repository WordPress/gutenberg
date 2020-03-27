/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LineHeightControl from '../components/line-height-control';
import InspectorControls from '../components/inspector-controls';
import { cleanEmptyObject } from './utils';

export const LINE_HEIGHT_SUPPRT_KEY = '__experimentalLineHeight';

/**
 * Override the default edit UI to include new inspector controls for block
 * color, if block defines support.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
export const withBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name: blockName } = props;
		if ( ! hasBlockSupport( blockName, LINE_HEIGHT_SUPPRT_KEY ) ) {
			return <BlockEdit key="edit" { ...props } />;
		}
		const { style } = props.attributes;
		const onChange = ( newLineHeightValue ) => {
			const newStyle = {
				...style,
				typography: {
					lineHeight: newLineHeightValue,
				},
			};
			props.setAttributes( {
				style: cleanEmptyObject( newStyle ),
			} );
		};

		return [
			<InspectorControls key="control">
				<PanelBody title={ __( 'Typography' ) }>
					<LineHeightControl
						value={ style?.typography?.lineHeight }
						onChange={ onChange }
					/>
				</PanelBody>
			</InspectorControls>,
			<BlockEdit key="edit" { ...props } />,
		];
	},
	'withToolbarControls'
);

addFilter(
	'editor.BlockEdit',
	'core/color/with-block-controls',
	withBlockControls
);
