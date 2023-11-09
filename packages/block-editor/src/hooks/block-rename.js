/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';

export const withBlockRenameControl = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name, attributes, setAttributes, isSelected } = props;

		const supportsBlockNaming = hasBlockSupport(
			name,
			'__experimentalMetadata',
			false
		);

		return (
			<>
				{ isSelected && supportsBlockNaming && (
					<InspectorControls group="advanced">
						<TextControl
							__nextHasNoMarginBottom
							label={ __( 'Block name' ) }
							value={ attributes?.metadata?.name || '' }
							onChange={ ( newName ) => {
								setAttributes( {
									metadata: {
										...attributes?.metadata,
										name: newName,
									},
								} );
							} }
						/>
					</InspectorControls>
				) }

				<BlockEdit key="edit" { ...props } />
			</>
		);
	},
	'withToolbarControls'
);

addFilter(
	'editor.BlockEdit',
	'core/block-rename-ui/with-block-rename-control',
	withBlockRenameControl
);
