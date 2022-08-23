/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { dragHandle } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

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

/**
 * Block draggable chip component
 *
 * @param {Object} props        Component props.
 * @param {Object} [props.icon] Block icon.
 * @return {JSX.Element} Chip component.
 */
export default function BlockDraggableChip( { icon } ) {
	const containerStyle = usePreferredColorSchemeStyle(
		styles[ 'draggable-chip__container' ],
		styles[ 'draggable-chip__container--dark' ]
	);

	return (
		<View style={ [ containerStyle, shadowStyle ] } testID="draggable-chip">
			<BlockIcon icon={ dragHandle } />
			{ icon && <BlockIcon icon={ icon } /> }
		</View>
	);
}
