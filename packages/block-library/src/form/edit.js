/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

const ALLOWED_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/form-input',
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
	[
		'core/form-input',
		{
			type: 'submit',
			label: __( 'Submit' ),
		},
	],
];

const Edit = ( { attributes, setAttributes } ) => {
	const { formId } = attributes;
	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: TEMPLATE,
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
