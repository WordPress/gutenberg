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

const TEXT_BLOCKS_WITH_OUTLINE = [ 'core/missing' ];

function BlockOutline( {
	blockCategory,
	hasInnerBlocks,
	isRootList,
	isSelected,
	name,
} ) {
	const textBlockWithOutline = TEXT_BLOCKS_WITH_OUTLINE.includes( name );
	const socialBlockWithOutline = name.includes( 'core/social-link' );

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
			socialBlockWithOutline ||
			textBlockWithOutline );

	return (
		shoudlShowOutline && (
			<View pointerEvents="box-none" style={ styleSolidBorder } />
		)
	);
}

export default BlockOutline;
