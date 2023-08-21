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

const BLOCKS_WITH_OUTLINE = [ 'core/social-link', 'core/missing' ];

function BlockOutline( {
	blockCategory,
	hasInnerBlocks,
	isRootList,
	isSelected,
	name,
} ) {
	const textBlockWithOutline = BLOCKS_WITH_OUTLINE.includes( name );
	const hasBlockTextCategory =
		blockCategory === 'text' && ! textBlockWithOutline;
	const hasBlockMediaCategory =
		blockCategory === 'media' ||
		blockCategory === 'embed' ||
		! blockCategory;
	const shouldShowCompactOutline =
		( hasBlockMediaCategory && ! hasInnerBlocks ) || textBlockWithOutline;

	const styleSolidBorder = [
		styles.solidBorder,
		usePreferredColorSchemeStyle(
			styles.solidBorderColor,
			styles.solidBorderColorDark
		),
		shouldShowCompactOutline && styles.solidBorderCompact,
		hasBlockTextCategory && styles.solidBorderTextContent,
	];

	const shoudlShowOutline =
		isSelected &&
		( ( hasBlockTextCategory && hasInnerBlocks ) ||
			( ! hasBlockTextCategory && hasInnerBlocks ) ||
			( ! hasBlockTextCategory && isRootList ) ||
			textBlockWithOutline );

	return (
		shoudlShowOutline && (
			<View pointerEvents="box-none" style={ styleSolidBorder } />
		)
	);
}

export default BlockOutline;
