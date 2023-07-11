/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	InspectorControls,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to add a hidden block' ),
		},
	],
];

function DetailsEdit( { attributes, setAttributes, clientId } ) {
	const { showContent, summary } = attributes;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		__experimentalCaptureToolbars: true,
	} );

	// Check if either the block or the inner blocks are selected.
	const hasSelection = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock } =
				select( blockEditorStore );
			/* Sets deep to true to also find blocks inside the details content block. */
			return (
				hasSelectedInnerBlock( clientId, true ) ||
				isBlockSelected( clientId )
			);
		},
		[ clientId ]
	);

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
			>
				<summary onClick={ ( event ) => event.preventDefault() }>
					<RichText
						aria-label={ __( 'Write summary' ) }
						placeholder={ __( 'Write summary…' ) }
						allowedFormats={ [] }
						withoutInteractiveFormatting
						value={ summary }
						onChange={ ( newSummary ) =>
							setAttributes( { summary: newSummary } )
						}
						multiline={ false }
					/>
				</summary>
				{ innerBlocksProps.children }
			</details>
		</>
	);
}

export default DetailsEdit;
