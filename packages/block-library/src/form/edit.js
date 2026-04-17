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
import {
	SelectControl,
	TextControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
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
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const resetAllSettings = () => {
		setAttributes( {
			submissionMethod: 'email',
			email: undefined,
			action: undefined,
			method: 'post',
		} );
	};

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
				<ToolsPanel
					dropdownMenuProps={ dropdownMenuProps }
					label={ __( 'Settings' ) }
					resetAll={ resetAllSettings }
				>
					<ToolsPanelItem
						hasValue={ () => submissionMethod !== 'email' }
						label={ __( 'Submissions method' ) }
						onDeselect={ () =>
							setAttributes( {
								submissionMethod: 'email',
							} )
						}
						isShownByDefault
					>
						<SelectControl
							__next40pxDefaultSize
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
					</ToolsPanelItem>
					{ submissionMethod === 'email' && (
						<ToolsPanelItem
							hasValue={ () => !! email }
							label={ __( 'Email for form submissions' ) }
							onDeselect={ () =>
								setAttributes( {
									email: undefined,
									action: undefined,
									method: 'post',
								} )
							}
							isShownByDefault
						>
							<TextControl
								__next40pxDefaultSize
								autoComplete="off"
								label={ __( 'Email for form submissions' ) }
								value={ email || '' }
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
								type="email"
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			</InspectorControls>
			{ submissionMethod !== 'email' && (
				<InspectorControls group="advanced">
					<SelectControl
						__next40pxDefaultSize
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
						__next40pxDefaultSize
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
						type="url"
					/>
				</InspectorControls>
			) }
			<form
				{ ...innerBlocksProps }
				encType={ submissionMethod === 'email' ? 'text/plain' : null }
			/>
		</>
	);
};
export default Edit;
