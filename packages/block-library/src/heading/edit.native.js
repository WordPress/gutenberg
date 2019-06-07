/**
 * Internal dependencies
 */
import HeadingToolbar from './heading-toolbar';
import styles from './editor.scss';

/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, BlockControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

const HeadingEdit = ( {
	attributes,
	isSelected,
	mergeBlocks,
	onBlur,
	onFocus,
	onReplace,
	setAttributes,
	style,
} ) => (
	<View onAccessibilityTap={ onFocus }>
		<BlockControls>
			<HeadingToolbar
				minLevel={ 2 }
				maxLevel={ 5 }
				selectedLevel={ attributes.level }
				onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) }
			/>
		</BlockControls>
		<RichText
			identifier="content"
			tagName={ 'h' + attributes.level }
			value={ attributes.content }
			isSelected={ isSelected }
			style={ {
				...style,
				minHeight: styles[ 'wp-block-heading' ].minHeight,
			} }
			onFocus={ onFocus } // always assign onFocus as a props
			onBlur={ onBlur } // always assign onBlur as a props
			onChange={ ( value ) => setAttributes( { content: value } ) }
			onMerge={ mergeBlocks }
			onSplit={ ( value ) => {
				if ( ! value ) {
					return createBlock( 'core/paragraph' );
				}

				return createBlock( 'core/heading', {
					...attributes,
					content: value,
				} );
			} }
			onReplace={ onReplace }
			onRemove={ () => onReplace( [] ) }
			placeholder={ attributes.placeholder || __( 'Write heading…' ) }
		/>
	</View>
);

export default HeadingEdit;
