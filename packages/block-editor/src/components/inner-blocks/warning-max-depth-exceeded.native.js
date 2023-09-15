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
import BlockFallbackWebVersion from '../block-fallback-web-version';
import { store as blockEditorStore } from '../../store';
import { MAX_NESTING_DEPTH } from './constants';

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

	const onUngroup = () => {
		if ( ! innerBlocks.length ) {
			return;
		}

		replaceBlocks( clientId, innerBlocks );
	};

	/* translators: Warning related to having blocks deeply nested. %d: The deepest nesting level. */
	const descriptionFormat = __(
		'Blocks nested deeper than %d levels may not render properly in the mobile editor. For this reason, we recommend flattening the content by ungrouping the block or editing the block using the web editor.'
	);
	const description = sprintf( descriptionFormat, MAX_NESTING_DEPTH );

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
				<BlockFallbackWebVersion
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
