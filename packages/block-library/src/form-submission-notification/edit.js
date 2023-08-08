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
import { PanelBody, SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import classnames from 'classnames';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			content: __(
				"Enter the message you wish displayed for form submission error/success, and select the type of the message (success/error) from the block's options."
			),
		},
	],
];

const Edit = ( { attributes, setAttributes, clientId } ) => {
	const { type } = attributes;
	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-form-submission-notification', {
			[ `form-notification-type-${ type }` ]: type,
		} ),
	} );

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
				<PanelBody title={ __( 'Notification settings' ) }>
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Notification type' ) }
						options={ [
							{ label: __( 'Success' ), value: 'success' },
							{ label: __( 'Error' ), value: 'error' },
						] }
						value={ type }
						onChange={ ( value ) =>
							setAttributes( { type: value } )
						}
						help={ __(
							'Select the notification type (success/error)'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
};
export default Edit;
