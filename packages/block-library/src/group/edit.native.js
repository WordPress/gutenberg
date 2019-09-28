
/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	InnerBlocks,
	withColors,
} from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function GroupEdit( {
	hasInnerBlocks,
	isSelected,
} ) {
	if ( ! isSelected && ! hasInnerBlocks ) {
		return (
			<View style={ styles.groupPlaceholder } />
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
] )( GroupEdit );
