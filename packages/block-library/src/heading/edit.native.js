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
import { RichText } from '@wordpress/editor';
import { parse, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';

const minHeight = 50;

class HeadingEdit extends Component {
	render() {
		const {
			attributes,
			setAttributes,
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
				<HeadingToolbar minLevel={ 2 } maxLevel={ 5 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
				<RichText
					tagName={ tagName }
					value={ content }
					style={ {
						minHeight: Math.max( minHeight, typeof attributes.aztecHeight === 'undefined' ? 0 : attributes.aztecHeight ),
					} }
					onChange={ ( event ) => {
						// Create a React Tree from the new HTML
						const newParaBlock = parse( `<!-- wp:heading {"level":${ level }} --><${ tagName }>${ event.content }</${ tagName }><!-- /wp:heading -->` )[ 0 ];
						setAttributes( {
							...this.props.attributes,
							content: newParaBlock.attributes.content,
						} );
					} }
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
						setAttributes( { aztecHeight: event.aztecHeight } );
					} }
					placeholder={ placeholder || __( 'Write heading…' ) }
				/>
			</View>
		);
	}
}
export default HeadingEdit;
