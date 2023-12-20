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
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const BlockTransformationsMenu = ( {
	anchorNodeRef,
	blockTitle,
	pickerRef,
	possibleTransformations,
	selectedBlock,
	selectedBlockClientId,
} ) => {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const pickerOptions = () => {
		const selectedBlockName = selectedBlock?.name ?? '';
		const blocksThatSplitWhenTransformed = {
			'core/list': [ 'core/paragraph', 'core/heading' ],
			'core/quote': [ 'core/paragraph' ],
			'core/pullquote': [ 'core/paragraph' ],
		};

		return possibleTransformations.map( ( item ) => {
			const label =
				selectedBlockName.length &&
				blocksThatSplitWhenTransformed[ selectedBlockName ] &&
				blocksThatSplitWhenTransformed[ selectedBlockName ].includes(
					item.id
				)
					? `${ item.title } blocks`
					: item.title;
			return {
				label,
				value: item.id,
			};
		} );
	};

	const getAnchor = () =>
		anchorNodeRef ? findNodeHandle( anchorNodeRef ) : undefined;

	function onPickerSelect( value ) {
		replaceBlocks(
			selectedBlockClientId,
			switchToBlockType( selectedBlock, value )
		);

		const selectedItem = pickerOptions().find(
			( item ) => item.value === value
		);
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
			testID="block-transformations-menu"
			ref={ pickerRef }
			options={ pickerOptions() }
			onChange={ onPickerSelect }
			hideCancelButton={ Platform.OS !== 'ios' }
			leftAlign={ true }
			getAnchor={ getAnchor }
			// translators: %s: block title e.g: "Paragraph".
			title={ sprintf( __( 'Transform %s to' ), blockTitle ) }
		/>
	);
};

export default BlockTransformationsMenu;
