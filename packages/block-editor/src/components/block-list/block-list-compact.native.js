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
		<View style={ containerStyle }>
			{ blockClientIds.map( ( currentClientId ) => (
				<BlockListBlock
					clientId={ currentClientId }
					key={ currentClientId }
					marginHorizontal={ marginHorizontal }
					marginVertical={ marginVertical }
				/>
			) ) }
		</View>
	);
}

export default BlockListCompact;
