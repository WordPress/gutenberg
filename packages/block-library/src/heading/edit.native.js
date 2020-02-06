/**
 * Internal dependencies
 */
import HeadingToolbar from './heading-toolbar';

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
	mergeBlocks,
	onFocus,
	onReplace,
	setAttributes,
	style,
} ) => (
	<View onAccessibilityTap={ onFocus }>
		<BlockControls>
			<HeadingToolbar
				minLevel={ 2 }
				maxLevel={ 7 }
				selectedLevel={ attributes.level }
				onChange={ ( newLevel ) =>
					setAttributes( { level: newLevel } )
				}
				isCollapsed={ false }
			/>
		</BlockControls>
		<RichText
			identifier="content"
			tagName={ 'h' + attributes.level }
			value={ attributes.content }
			style={ style }
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
