/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { alignmentHelpers } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './block.scss';

function BlockOutline( {
	align,
	blockWidth,
	isParentSelected,
	isSelected,
	name,
	screenWidth,
} ) {
	const { isFullWidth, isContainerRelated } = alignmentHelpers;
	const isScreenWidthWider = blockWidth < screenWidth;

	const styleSolidBorder = [
		styles.solidBorder,
		isFullWidth( align ) && isScreenWidthWider && styles.borderFullWidth,
		isFullWidth( align ) &&
			isContainerRelated( name ) &&
			isScreenWidthWider &&
			styles.containerBorderFullWidth,
		usePreferredColorSchemeStyle(
			styles.solidBorderColor,
			styles.solidBorderColorDark
		),
	];
	const styleDashedBorder = [
		styles.dashedBorder,
		usePreferredColorSchemeStyle(
			styles.dashedBorderColor,
			styles.dashedBorderColorDark
		),
	];

	return (
		<>
			{ isSelected && (
				<View pointerEvents="box-none" style={ styleSolidBorder } />
			) }
			{ isParentSelected && <View style={ styleDashedBorder } /> }
		</>
	);
}

export default BlockOutline;
