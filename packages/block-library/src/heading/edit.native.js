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
import { Component } from '@wordpress/element';
import { RichText, BlockControls } from '@wordpress/editor';
import { createBlock } from '@wordpress/blocks';

class HeadingEdit extends Component {
	render() {
		const {
			attributes,
			setAttributes,
			mergeBlocks,
			insertBlocksAfter,
			style,
		} = this.props;

		const {
			level,
			placeholder,
			content,
		} = attributes;

		const tagName = 'h' + level;

		return (
			<View>
				<BlockControls>
					<HeadingToolbar minLevel={ 2 } maxLevel={ 5 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
				</BlockControls>
				<RichText
					tagName={ tagName }
					value={ content }
					isSelected={ this.props.isSelected }
					style={ style }
					onFocus={ this.props.onFocus } // always assign onFocus as a props
					onBlur={ this.props.onBlur } // always assign onBlur as a props
					onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
					onChange={ ( value ) => setAttributes( { content: value } ) }
					onMerge={ mergeBlocks }
					onSplit={
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
	}
}
export default HeadingEdit;
