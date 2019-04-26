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
	attributes: {
		level,
		placeholder,
		content,
	},
	insertBlocksAfter,
	isSelected,
	mergeBlocks,
	onFocus,
	onBlur,
	setAttributes,
	style,
} ) => (
	<View onAccessibilityTap={ onFocus }>
		<BlockControls>
			<HeadingToolbar
				minLevel={ 2 }
				maxLevel={ 5 }
				selectedLevel={ level }
				onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) }
			/>
		</BlockControls>
		<RichText
			identifier="content"
			tagName={ 'h' + level }
			value={ content }
			isSelected={ isSelected }
			style={ {
				...style,
				minHeight: styles[ 'wp-block-heading' ].minHeight,
			} }
			onFocus={ onFocus } // always assign onFocus as a props
			onBlur={ onBlur } // always assign onBlur as a props
			onChange={ ( value ) => setAttributes( { content: value } ) }
			onMerge={ mergeBlocks }
			unstableOnSplit={
				insertBlocksAfter ?
					( before, after, ...blocks ) => {
						setAttributes( { content: before } );
						insertBlocksAfter( [
							...blocks,
							createBlock( 'core/paragraph', { content: after } ),
						] );
					} :
					undefined
			}
			placeholder={ placeholder || __( 'Write heading…' ) }
		/>
	</View>
);

export default HeadingEdit;
