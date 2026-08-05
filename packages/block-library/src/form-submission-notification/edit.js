/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import clsx from 'clsx';

const Edit = ( { attributes } ) => {
	const { type } = attributes;
	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-form-submission-notification', {
			[ `form-notification-type-${ type }` ]: type,
		} ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps );

	return (
		<div
			{ ...innerBlocksProps }
			data-message-success={ __( 'Submission success notification' ) }
			data-message-error={ __( 'Submission error notification' ) }
		/>
	);
};
export default Edit;
