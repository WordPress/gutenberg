/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './block.scss';

function BlockOutline( { isParentSelected, isSelected } ) {
	const styleDashedBorder = [
		styles.dashedBorder,
		usePreferredColorSchemeStyle(
			styles.dashedBorderColor,
			styles.dashedBorderColorDark
		),
	];

	return (
		<>
			{ isSelected && <View pointerEvents="box-none" /> }
			{ isParentSelected && <View style={ styleDashedBorder } /> }
		</>
	);
}

export default BlockOutline;
