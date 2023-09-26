/**
 * External dependencies
 */
import { TouchableWithoutFeedback, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Warning from '../warning';
import UnsupportedBlockDetails from '../unsupported-block-details';
import { store as blockEditorStore } from '../../store';
import { MAX_NESTING_DEPTH } from './constants';
import useUnsupportedBlockEditor from '../use-unsupported-block-editor';

const WarningMaxDepthExceeded = ( { clientId } ) => {
	const [ showDetails, setShowDetails ] = useState( false );

	const { isSelected, innerBlocks } = useSelect(
		( select ) => {
			const { getBlock, isBlockSelected } = select( blockEditorStore );
			return {
				innerBlocks: getBlock( clientId )?.innerBlocks || [],
				isSelected: isBlockSelected( clientId ),
			};
		},
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const {
		isUnsupportedBlockEditorSupported,
		canEnableUnsupportedBlockEditor,
	} = useUnsupportedBlockEditor( clientId );

	const onUngroup = () => {
		if ( ! innerBlocks.length ) {
			return;
		}

		replaceBlocks( clientId, innerBlocks );
	};

	let description;
	// When UBE can't be used, the description mentions using the web browser to edit the block.
	if (
		! isUnsupportedBlockEditorSupported &&
		! canEnableUnsupportedBlockEditor
	) {
		/* translators: Warning related to having blocks deeply nested. %d: The deepest nesting level. */
		const descriptionFormat = __(
			'Blocks nested deeper than %d levels may not render properly in the mobile editor. For this reason, we recommend flattening the content by ungrouping the block or editing the block using your web browser.'
		);
		description = sprintf( descriptionFormat, MAX_NESTING_DEPTH );
	}
	// Otherwise, the description mentions using the web editor (i.e. UBE).
	else {
		/* translators: Warning related to having blocks deeply nested. %d: The deepest nesting level. */
		const descriptionFormat = __(
			'Blocks nested deeper than %d levels may not render properly in the mobile editor. For this reason, we recommend flattening the content by ungrouping the block or editing the block using the web editor.'
		);
		description = sprintf( descriptionFormat, MAX_NESTING_DEPTH );
	}

	return (
		<TouchableWithoutFeedback
			disabled={ ! isSelected }
			accessibilityLabel={ __( 'Warning message' ) }
			accessibilityRole={ 'button' }
			accessibilityHint={ __( 'Tap here to show more details.' ) }
			onPress={ () => setShowDetails( true ) }
		>
			<View>
				<Warning
					message={ __(
						'Block cannot be rendered because it is deeply nested. Tap here for more details.'
					) }
				/>
				<UnsupportedBlockDetails
					clientId={ clientId }
					showSheet={ showDetails }
					onCloseSheet={ () => setShowDetails( false ) }
					title={ __( 'Deeply nested block' ) }
					description={ description }
					customActions={ [
						{ label: __( 'Ungroup block' ), onPress: onUngroup },
					] }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default WarningMaxDepthExceeded;
