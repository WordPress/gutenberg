/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Caption, RichText } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import { store as blockEditorStore } from '../../store';

const BlockCaption = ( {
	accessible,
	accessibilityLabelCreator,
	onBlur,
	onChange,
	onFocus,
	isSelected,
	shouldDisplay,
	text,
	insertBlocksAfter,
} ) => (
	<View style={ [ styles.container, shouldDisplay && styles.padding ] }>
		<Caption
			accessibilityLabelCreator={ accessibilityLabelCreator }
			accessible={ accessible }
			isSelected={ isSelected }
			onBlur={ onBlur }
			onChange={ onChange }
			onFocus={ onFocus }
			shouldDisplay={ shouldDisplay }
			value={ text }
			insertBlocksAfter={ insertBlocksAfter }
		/>
	</View>
);

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockAttributes,
			getSelectedBlockClientId,
			getBlockName,
			getBlockRootClientId,
		} = select( blockEditorStore );
		const { caption } = getBlockAttributes( clientId ) || {};
		const isBlockSelected = getSelectedBlockClientId() === clientId;

		const parentId = getBlockRootClientId( clientId );
		const parentBlockName = getBlockName( parentId );

		const hideCaption = hasBlockSupport(
			parentBlockName,
			'__experimentalHideChildBlockControls',
			false
		);

		// We'll render the caption so that the soft keyboard is not forced to close on Android
		// but still hide it by setting its display style to none. See wordpress-mobile/gutenberg-mobile#1221
		const shouldDisplay =
			! hideCaption &&
			( ! RichText.isEmpty( caption ) > 0 || isBlockSelected );

		return {
			shouldDisplay,
			text: caption,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		const { updateBlockAttributes } = dispatch( blockEditorStore );
		return {
			onChange: ( caption ) => {
				updateBlockAttributes( clientId, { caption } );
			},
		};
	} ),
] )( BlockCaption );
