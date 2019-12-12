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

const BlockCaption = ( { accessible, accessibilityLabel, onBlur, onChange, onFocus, isSelected, shouldDisplay, text } ) => (
	<View
		accessibilityLabel={ accessibilityLabel }
		accessibilityRole="button"
		accessible={ accessible }
		style={ { padding: 12, flex: 1, display: shouldDisplay ? 'flex' : 'none' } }
	>
		<Caption
			isSelected={ isSelected }
			onBlur={ onBlur }
			onChange={ onChange }
			onFocus={ onFocus }
			value={ text }
		/>
	</View>
);

export default compose( [
	withSelect( ( select, { accessibilityLabelCreator, clientId } ) => {
		const {
			getBlockAttributes,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );
		const { caption } = getBlockAttributes( clientId );
		const accessibilityLabel = accessibilityLabelCreator ? accessibilityLabelCreator( caption ) : undefined;
		const isBlockSelected = getSelectedBlockClientId() === clientId;

		// We'll render the caption so that the soft keyboard is not forced to close on Android
		// but still hide it by setting its display style to none. See wordpress-mobile/gutenberg-mobile#1221
		const shouldDisplay = ! RichText.isEmpty( caption ) > 0 || isBlockSelected;

		return {
			accessibilityLabel,
			shouldDisplay,
			text: caption,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		const { updateBlockAttributes } = dispatch( 'core/block-editor' );
		return {
			onChange: ( caption ) => {
				updateBlockAttributes( clientId, { caption } );
			},
		};
	} ),
] )( BlockCaption );
