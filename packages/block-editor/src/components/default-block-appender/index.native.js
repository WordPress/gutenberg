/**
 * External dependencies
 */
import { Pressable, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import { withSelect, withDispatch } from '@wordpress/data';
import { getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockInsertionPoint from '../block-list/insertion-point';
import styles from './style.scss';
import { store as blockEditorStore } from '../../store';

const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };
const noop = () => {};

export function DefaultBlockAppender( {
	isLocked,
	isVisible,
	onAppend,
	placeholder,
	containerStyle,
	showSeparator,
} ) {
	if ( isLocked || ! isVisible ) {
		return null;
	}

	const value =
		typeof placeholder === 'string'
			? decodeEntities( placeholder )
			: __( 'Start writing…' );

	const appenderStyles = [
		styles.blockHolder,
		showSeparator && containerStyle,
	];

	return (
		<Pressable onPress={ onAppend } hitSlop={ hitSlop }>
			<View style={ appenderStyles } pointerEvents="box-only">
				{ showSeparator ? (
					<BlockInsertionPoint />
				) : (
					<RichText placeholder={ value } onChange={ noop } />
				) }
			</View>
		</Pressable>
	);
}

export default compose(
	withSelect( ( select, ownProps ) => {
		const { getBlockCount, getBlockName, isBlockValid, getTemplateLock } =
			select( blockEditorStore );

		const isEmpty = ! getBlockCount( ownProps.rootClientId );
		const isLastBlockDefault =
			getBlockName( ownProps.lastBlockClientId ) ===
			getDefaultBlockName();
		const isLastBlockValid = isBlockValid( ownProps.lastBlockClientId );

		return {
			isVisible: isEmpty || ! isLastBlockDefault || ! isLastBlockValid,
			isLocked: !! getTemplateLock( ownProps.rootClientId ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { insertDefaultBlock, startTyping } =
			dispatch( blockEditorStore );

		return {
			onAppend() {
				const { rootClientId } = ownProps;

				insertDefaultBlock( undefined, rootClientId );
				startTyping();
			},
		};
	} )
)( DefaultBlockAppender );
