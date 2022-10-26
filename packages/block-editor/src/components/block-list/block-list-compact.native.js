/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';

/**
 * NOTE: This is a component currently used by the List block (V2)
 * It only passes the needed props for this block, if other blocks will use it
 * make sure you pass other props that might be required coming from:
 * components/inner-blocks/index.native.js
 */

function BlockListCompact( props ) {
	const {
		marginHorizontal = styles.defaultBlock.marginLeft,
		marginVertical = styles.defaultBlock.marginTop,
		rootClientId,
	} = props;
	const { blockClientIds } = useSelect(
		( select ) => {
			const { getBlockOrder } = select( blockEditorStore );
			const blockOrder = getBlockOrder( rootClientId );

			return {
				blockClientIds: blockOrder,
			};
		},
		[ rootClientId ]
	);

	const containerStyle = {
		marginVertical: -marginVertical,
		marginHorizontal: -marginHorizontal,
	};

	return (
		<View style={ containerStyle } testID="block-list-wrapper">
			{ blockClientIds.map( ( currentClientId ) => (
				<BlockListBlock
					clientId={ currentClientId }
					rootClientId={ rootClientId }
					key={ currentClientId }
					marginHorizontal={ marginHorizontal }
					marginVertical={ marginVertical }
				/>
			) ) }
		</View>
	);
}

export default BlockListCompact;
