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
import { TextControl, SelectControl, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	formSubmissionNotificationSuccess,
	formSubmissionNotificationError,
} from './utils.js';

const TEMPLATE = [
	formSubmissionNotificationSuccess,
	formSubmissionNotificationError,
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
	const { action, method, email, submissionMethod } = attributes;
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
		template: TEMPLATE,
		renderAppender: hasInnerBlocks
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<SelectControl
						// __nextHasNoMarginBottom
						// size={ '__unstable-large' }
						label={ __( 'Submissions method' ) }
						options={ [
							// TODO: Allow plugins to add their own submission methods.
							{
								label: __( 'Send email' ),
								value: 'email',
							},
							{
								label: __( '- Custom -' ),
								value: 'custom',
							},
						] }
						value={ submissionMethod }
						onChange={ ( value ) =>
							setAttributes( { submissionMethod: value } )
						}
						help={
							submissionMethod === 'custom'
								? __(
										'Select the method to use for form submissions. Additional options for the "custom" mode can be found in the "Advanced" section.'
								  )
								: __(
										'Select the method to use for form submissions.'
								  )
						}
					/>
					{ submissionMethod === 'email' && (
						<TextControl
							__nextHasNoMarginBottom
							autoComplete="off"
							label={ __( 'Email for form submissions' ) }
							value={ email }
							required
							onChange={ ( value ) => {
								setAttributes( { email: value } );
								setAttributes( {
									action: `mailto:${ value }`,
								} );
								setAttributes( { method: 'post' } );
							} }
							help={ __(
								'The email address where form submissions will be sent. Separate multiple email addresses with a comma.'
							) }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			{ submissionMethod !== 'email' && (
				<InspectorControls group="advanced">
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Method' ) }
						options={ [
							{ label: 'Get', value: 'get' },
							{ label: 'Post', value: 'post' },
						] }
						value={ method }
						onChange={ ( value ) =>
							setAttributes( { method: value } )
						}
						help={ __(
							'Select the method to use for form submissions.'
						) }
					/>
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
				</InspectorControls>
			) }
			<form
				{ ...innerBlocksProps }
				className="wp-block-form"
				encType={ submissionMethod === 'email' ? 'text/plain' : null }
			/>
		</>
	);
};
export default Edit;
