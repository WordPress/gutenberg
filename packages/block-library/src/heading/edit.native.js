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
import {
	RichText,
	BlockControls,
	__experimentalUseColors,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

const HeadingEdit = ( {
	attributes,
	mergeBlocks,
	onFocus,
	onReplace,
	setAttributes,
	style,
} ) => {
	const { align, content, level, placeholder } = attributes;

	/* eslint-disable @wordpress/no-unused-vars-before-return */
	const { TextColor } = __experimentalUseColors( [
		{ name: 'textColor', property: 'color' },
	] );
	/* eslint-enable @wordpress/no-unused-vars-before-return */

	return (
		<View onAccessibilityTap={ onFocus }>
			<BlockControls>
				<HeadingToolbar
					minLevel={ 2 }
					maxLevel={ 7 }
					selectedLevel={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
					isCollapsed={ false }
				/>
			</BlockControls>
			<TextColor>
				<RichText
					identifier="content"
					tagName={ 'h' + level }
					value={ content }
					style={ style }
					onChange={ ( value ) =>
						setAttributes( { content: value } )
					}
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
					placeholder={ placeholder || __( 'Write heading…' ) }
					textAlign={ align }
				/>
			</TextColor>
		</View>
	);
};

export default HeadingEdit;
