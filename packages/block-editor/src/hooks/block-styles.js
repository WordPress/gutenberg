/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { hasBlockSupport, getBlockType } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import BlockStyles from '../components/block-styles';
import DefaultStylePicker from '../components/default-style-picker';

export const withInspectorControls = createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const { blockType, selectedBlockClientId, hasBlockStyles } = useSelect(
			( select ) => {
				const { getSelectedBlockClientId, getBlockName } = select(
					'core/block-editor'
				);
				const { getBlockStyles } = select( 'core/blocks' );
				const blockClientId = getSelectedBlockClientId();
				const selectedBlockName =
					blockClientId && getBlockName( blockClientId );
				const blockStyles =
					blockClientId && getBlockStyles( selectedBlockName );

				return {
					blockType:
						blockClientId && getBlockType( selectedBlockName ),
					selectedBlockClientId: blockClientId,
					hasBlockStyles: blockStyles && blockStyles.length > 0,
				};
			},
			[]
		);

		if ( ! hasBlockStyles ) {
			return <WrappedComponent { ...props } />;
		}

		return (
			<Fragment>
				<InspectorControls>
					<div>
						<PanelBody title={ __( 'Styles' ) }>
							<BlockStyles clientId={ selectedBlockClientId } />
							{ hasBlockSupport(
								blockType.name,
								'defaultStylePicker',
								true
							) && (
								<DefaultStylePicker
									blockName={ blockType.name }
								/>
							) }
						</PanelBody>
					</div>
				</InspectorControls>

				<WrappedComponent { ...props } />
			</Fragment>
		);
	},
	'withInspectorControls'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/block-styles/with-inspector-controls',
	withInspectorControls,
	20
);
