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
const MEDIA_BLOCKS_WITH_OUTLINE = [ 'core/audio', 'core/file' ];

function BlockOutline( { blockCategory, hasInnerBlocks, isSelected, name } ) {
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

	let shouldShowOutline = true;
	if ( hasBlockTextCategory && ! hasInnerBlocks ) {
		shouldShowOutline = false;
	} else if (
		blockCategory === 'media' &&
		! hasInnerBlocks &&
		! MEDIA_BLOCKS_WITH_OUTLINE.includes( name )
	) {
		shouldShowOutline = false;
	} else if ( blockCategory === 'media' && name === 'core/cover' ) {
		shouldShowOutline = false;
	} else if (
		blockCategory === 'design' &&
		DESIGN_BLOCKS_WITHOUT_OUTLINE.includes( name )
	) {
		shouldShowOutline = false;
	}

	if ( shouldShowOutline ) {
		return (
			<View
				pointerEvents="box-none"
				style={ styleSolidBorder }
				testID="block-outline"
			/>
		);
	}

	return null;
}

export default BlockOutline;
