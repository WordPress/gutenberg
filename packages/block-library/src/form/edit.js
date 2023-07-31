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
import { TextControl, SelectControl } from '@wordpress/components';
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
			type: 'textarea',
			label: __( 'Comment' ),
			required: true,
		},
	],
	[ 'core/form-submit-button', {} ],
];

const Edit = ( { attributes, setAttributes, clientId } ) => {
	const { action, method, email } = attributes;
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
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Form method' ) }
					options={ [
						{ label: 'Send email', value: 'email' },
						{ label: 'Get', value: 'get' },
						{ label: __( 'Post' ), value: 'post' },
					] }
					value={ method }
					onChange={ ( value ) => setAttributes( { method: value } ) }
					help={ __(
						'Whether the form will send an email, or submit a POST/GET request.'
					) }
				/>
				{ method === 'email' && (
					<TextControl
						__nextHasNoMarginBottom
						autoComplete="off"
						label={ __( 'Email for form submissions' ) }
						value={ email }
						onChange={ ( value ) =>
							setAttributes( { email: value } )
						}
						help={ __(
							'The email address where form submissions will be sent. Leave empty to use the site admin address.'
						) }
					/>
				) }
				{ method !== 'email' && (
					<TextControl
						__nextHasNoMarginBottom
						autoComplete="off"
						label={ __( 'Form action' ) }
						value={ action }
						onChange={ ( newVal ) => {
							setAttributes( {
								action: newVal,
							} );
						} }
						help={ __(
							'The URL where the form should be submitted.'
						) }
					/>
				) }
			</InspectorControls>
			<form { ...innerBlocksProps } />
		</>
	);
};
export default Edit;
