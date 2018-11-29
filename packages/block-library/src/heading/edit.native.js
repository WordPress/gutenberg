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
import { parse, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';

const minHeight = 50;

class HeadingEdit extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			aztecHeight: 0,
		};
	}

	render() {
		const {
			attributes,
			setAttributes,
			mergeBlocks,
			insertBlocksAfter,
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
					onFocus={ this.props.onFocus } // always assign onFocus as a props
					onBlur={ this.props.onBlur } // always assign onBlur as a props
					style={ {
						minHeight: Math.max( minHeight, this.state.aztecHeight ),
					} }
					onChange={ ( event ) => {
						// Create a React Tree from the new HTML
						const newParaBlock = parse( `<!-- wp:heading {"level":${ level }} --><${ tagName }>${ event.content }</${ tagName }><!-- /wp:heading -->` )[ 0 ];
						setAttributes( {
							...this.props.attributes,
							content: newParaBlock.attributes.content,
						} );
					} }
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
					onContentSizeChange={ ( event ) => {
						this.setState( { aztecHeight: event.aztecHeight } );
					} }
					placeholder={ placeholder || __( 'Write heading…' ) }
				/>
			</View>
		);
	}
}
export default HeadingEdit;
