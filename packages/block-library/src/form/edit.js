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
	'core/input-field',
	'core/columns',
	'core/group',
];

const TEMPLATE = [
	[
		'core/input-field',
		{
			type: 'text',
			label: __( 'Name' ),
			required: true,
		},
	],
	[
		'core/input-field',
		{
			type: 'email',
			label: __( 'Email' ),
			required: true,
		},
	],
	[
		'core/input-field',
		{
			type: 'url',
			label: __( 'Website' ),
		},
	],
	[
		'core/input-field',
		{
			type: 'textarea',
			label: __( 'Comment' ),
			required: true,
		},
	],
	[
		'core/input-field',
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
