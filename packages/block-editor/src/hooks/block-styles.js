/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { hasBlockSupport, getBlockType } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import BlockStyles from '../components/block-styles';
import DefaultStylePicker from '../components/default-style-picker';

export const withInspectorControls = createHigherOrderComponent(
	compose( [
		withSelect( ( select ) => {
			const { getSelectedBlockClientId, getBlockName } = select(
				'core/block-editor'
			);
			const { getBlockStyles } = select( 'core/blocks' );
			const selectedBlockClientId = getSelectedBlockClientId();
			const selectedBlockName =
				selectedBlockClientId && getBlockName( selectedBlockClientId );
			const blockType =
				selectedBlockClientId && getBlockType( selectedBlockName );
			const blockStyles =
				selectedBlockClientId && getBlockStyles( selectedBlockName );
			return {
				blockType,
				selectedBlockClientId,
				hasBlockStyles: blockStyles && blockStyles.length > 0,
			};
		} ),

		( WrappedComponent ) => ( props ) => {
			if ( ! props?.hasBlockStyles ) {
				return <WrappedComponent { ...props } />;
			}

			const { selectedBlockClientId, blockType } = props;

			return (
				<Fragment>
					<InspectorControls>
						<div>
							<PanelBody title={ __( 'Styles' ) }>
								<BlockStyles
									clientId={ selectedBlockClientId }
								/>
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
	] ),
	'withInspectorControls'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/block-styles/with-inspector-controls',
	withInspectorControls
);
