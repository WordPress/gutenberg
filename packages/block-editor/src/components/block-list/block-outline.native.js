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

const TEXT_BLOCKS_WITH_OUTLINE = [ 'core/missing', 'core/freeform' ];
const DESIGN_BLOCKS_WITHOUT_OUTLINE = [ 'core/button', 'core/spacer' ];

function BlockOutline( {
	blockCategory,
	hasInnerBlocks,
	isRootList,
	isSelected,
	name,
} ) {
	const textBlockWithOutline = TEXT_BLOCKS_WITH_OUTLINE.includes( name );

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

	if ( ! isSelected ) {
		return null;
	}

	let shouldShowOutline = false;

	if ( hasBlockTextCategory && hasInnerBlocks ) {
		shouldShowOutline = true;
	} else if ( ! hasBlockTextCategory && hasInnerBlocks ) {
		shouldShowOutline = true;
	} else if ( blockCategory === 'design' ) {
		if ( ! DESIGN_BLOCKS_WITHOUT_OUTLINE.includes( name ) ) {
			shouldShowOutline = true;
		}
	} else if ( ! hasBlockTextCategory && isRootList ) {
		shouldShowOutline = true;
	} else if ( name.includes( 'core/social-link' ) ) {
		shouldShowOutline = true;
	} else if ( textBlockWithOutline ) {
		shouldShowOutline = true;
	}

	return (
		shouldShowOutline && (
			<View
				pointerEvents="box-none"
				style={ styleSolidBorder }
				testID="block-outline"
			/>
		)
	);
}

export default BlockOutline;
