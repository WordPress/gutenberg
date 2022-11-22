/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const ALLOWED_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/form-input',
	'core/form-submit-button',
	'core/columns',
	'core/group',
];

const TEMPLATE = [
	[
		'core/form-input',
		{
			type: 'text',
			label: __( 'Name' ),
			required: true,
		},
	],
	[
		'core/form-input',
		{
			type: 'email',
			label: __( 'Email' ),
			required: true,
		},
	],
	[
		'core/form-input',
		{
			type: 'url',
			label: __( 'Website' ),
		},
	],
	[
		'core/form-input',
		{
			type: 'textarea',
			label: __( 'Comment' ),
			required: true,
		},
	],
	[ 'core/form-submit-button', {} ],
];

const Edit = ( { attributes, setAttributes, clientId } ) => {
	const { formId } = attributes;
	const blockProps = useBlockProps();

	const { hasInnerBlocks } = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				hasInnerBlocks: !! ( block && block.innerBlocks.length ),
			};
		},
		[ clientId ]
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: TEMPLATE,
		renderAppender: hasInnerBlocks
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form settings' ) }>
					<TextControl
						autoComplete="off"
						label={ __( 'Form ID' ) }
						value={ formId }
						onChange={ ( newVal ) => {
							setAttributes( {
								formId: newVal,
							} );
						} }
						help={ __(
							'Unique identifier for this form. This value gets sent along with the form submission.'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<form { ...innerBlocksProps } />
		</>
	);
};
export default Edit;
