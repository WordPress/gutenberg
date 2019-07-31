/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const Caption = ( { accessible, accessibilityLabel, onBlur, onChange, onFocus, isParentSelected, isSelected, text } ) => {
	// We still want to render the caption so that the soft keyboard is not forced to close on Android
	const shouldCaptionDisplay = ! RichText.isEmpty( text ) > 0 || isParentSelected;

	return (
		<View style={ {	padding: 12, flex: 1, display: shouldCaptionDisplay ? 'flex' : 'none' } }
			accessible={ accessible }
			accessibilityLabel={ accessibilityLabel }
			accessibilityRole={ 'button' }
		>
			<RichText
				rootTagsToEliminate={ [ 'p' ] }
				placeholder={ __( 'Write caption…' ) }
				value={ text }
				onChange={ onChange }
				unstableOnFocus={ onFocus }
				onBlur={ onBlur } // always assign onBlur as props
				isSelected={ isSelected }
				__unstableMobileNoFocusOnMount
				fontSize={ 14 }
				underlineColorAndroid="transparent"
				textAlign={ 'center' }
				tagName={ '' }
			/>
		</View>
	);
};

export default Caption;
