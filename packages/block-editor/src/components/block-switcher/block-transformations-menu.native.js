/**
 * External dependencies
 */
import { findNodeHandle, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { switchToBlockType } from '@wordpress/blocks';
import { Picker } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';

const BlockTransformationsMenu = ( {
	// Dispatch
	createSuccessNotice,
	replaceBlocks,
	// Passed in
	anchorNodeRef,
	blockTitle,
	pickerRef,
	possibleTransformations,
	selectedBlock,
	selectedBlockClientId,
} ) => {
	const options = possibleTransformations.map( ( item ) => ( {
		label: item.title,
		value: item.id,
	} ) );

	const getAnchor = () =>
		anchorNodeRef ? findNodeHandle( anchorNodeRef ) : undefined;

	function onPickerSelect( value ) {
		replaceBlocks(
			selectedBlockClientId,
			switchToBlockType( selectedBlock, value )
		);

		const selectedItem = options.find( ( item ) => item.value === value );
		const successNotice = sprintf(
			/* translators: 1: From block title, e.g. Paragraph. 2: To block title, e.g. Header. */
			__( '%1$s transformed to %2$s' ),
			blockTitle,
			selectedItem.label
		);
		createSuccessNotice( successNotice );
	}

	return (
		<Picker
			ref={ pickerRef }
			options={ options }
			onChange={ onPickerSelect }
			hideCancelButton={ Platform.OS !== 'ios' }
			leftAlign={ true }
			getAnchor={ getAnchor }
			// translators: %s: block title e.g: "Paragraph".
			title={ sprintf( __( 'Transform %s to' ), blockTitle ) }
		/>
	);
};

export default compose(
	withDispatch( ( dispatch ) => {
		const { replaceBlocks } = dispatch( 'core/block-editor' );
		const { createSuccessNotice } = dispatch( 'core/notices' );
		return { createSuccessNotice, replaceBlocks };
	} ),
	withInstanceId
)( BlockTransformationsMenu );
