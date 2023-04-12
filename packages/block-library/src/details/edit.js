/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	InspectorControls,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEMPLATE = [ [ 'core/details-summary' ], [ 'core/details-content' ] ];

function DetailsEdit( { attributes, setAttributes, clientId } ) {
	const { showContent } = attributes;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: TEMPLATE,
		template: TEMPLATE,
		templateLock: 'all',
	} );

	// Check if either the block or the inner blocks are selected.
	const hasSelection = useSelect( ( select ) => {
		const { isBlockSelected, hasSelectedInnerBlock } =
			select( blockEditorStore );
		/* Sets deep to true to also find blocks inside the details content block. */
		return (
			hasSelectedInnerBlock( clientId, true ) ||
			isBlockSelected( clientId )
		);
	}, [] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						label={ __( 'Open by default' ) }
						checked={ showContent }
						onChange={ () =>
							setAttributes( {
								showContent: ! showContent,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<details
				{ ...innerBlocksProps }
				open={ hasSelection || showContent }
			></details>
		</>
	);
}

export default DetailsEdit;
