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

function BlockOutline( {
	blockCategory,
	hasInnerBlocks,
	isRootList,
	isSelected,
} ) {
	const hasBlockTextCategory = blockCategory === 'text';
	const hasBlockMediaCategory =
		blockCategory === 'media' ||
		blockCategory === 'embed' ||
		! blockCategory;

	const styleSolidBorder = [
		styles.solidBorder,
		usePreferredColorSchemeStyle(
			styles.solidBorderColor,
			styles.solidBorderColorDark
		),
		hasBlockMediaCategory && ! hasInnerBlocks && styles.solidBorderCompact,
		hasBlockTextCategory && styles.solidBorderTextContent,
	];

	const shoudlShowOutline =
		isSelected &&
		( ( hasBlockTextCategory && hasInnerBlocks ) ||
			( ! hasBlockTextCategory && hasInnerBlocks ) ||
			( ! hasBlockTextCategory && isRootList ) );

	return (
		shoudlShowOutline && (
			<View pointerEvents="box-none" style={ styleSolidBorder } />
		)
	);
}

export default BlockOutline;
