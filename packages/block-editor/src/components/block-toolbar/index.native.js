/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { BlockFormatControls, BlockControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export const BlockToolbar = () => (
	<View style={ styles.container } >
		<BlockControls.Slot />
		<BlockFormatControls.Slot />
	</View>
);

export default compose( [
	withSelect( ( select ) => ( {
		hasRedo: select( 'core/editor' ).hasEditorRedo(),
		hasUndo: select( 'core/editor' ).hasEditorUndo(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		redo: dispatch( 'core/editor' ).redo,
		undo: dispatch( 'core/editor' ).undo,
		clearSelectedBlock: dispatch( 'core/editor' ).clearSelectedBlock,
	} ) ),
] )( BlockToolbar );
