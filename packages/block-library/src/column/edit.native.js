
/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
	InnerBlocks,
	withColors,
} from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColumnEdit( {
	hasInnerBlocks,
	isSelected,
	getStylesFromColorScheme,
} ) {
	// TODO: make sure if column should reder placeholder if whole parent
	// columns block is not selected
	if ( ! isSelected && ! hasInnerBlocks ) {
		return (
			<View style={ [
				getStylesFromColorScheme( styles.columnPlaceholder, styles.columnPlaceholderDark ),
				! hasInnerBlocks && { ...styles.marginVerticalDense, ...styles.marginHorizontalNone },
			] } />
		);
	}

	return (
		<InnerBlocks
			renderAppender={ isSelected && InnerBlocks.ButtonBlockAppender }
		/>
	);
}

export default compose( [
	withColors( 'backgroundColor' ),
	withSelect( ( select, { clientId } ) => {
		const {
			getBlock,
		} = select( 'core/block-editor' );

		const block = getBlock( clientId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
	withPreferredColorScheme,
] )( ColumnEdit );
