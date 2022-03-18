/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { dragHandle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import styles from './style.scss';

const shadowStyle = {
	shadowColor: '#000',
	shadowOffset: {
		width: 0,
		height: 2,
	},
	shadowOpacity: 0.25,
	shadowRadius: 3.84,

	elevation: 5,
};

export default function BlockDraggableChip( { icon } ) {
	return (
		<View style={ [ styles[ 'draggable-chip__container' ], shadowStyle ] }>
			<BlockIcon icon={ dragHandle } />
			<BlockIcon icon={ icon } />
		</View>
	);
}
