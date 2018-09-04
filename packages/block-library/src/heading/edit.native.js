/**
 * Internal dependencies
 */
import createLevelControl from './level-control';

/**
 * External dependencies
 */
import { View } from 'react-native';
import { range } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { RichText } from '@wordpress/editor';
import { parse } from '@wordpress/blocks';
import { Toolbar } from '@wordpress/components';

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
		} = this.props;

		const {
			level,
			placeholder,
		} = attributes;

		const tagName = 'h' + level;

		return (
			<View>
				<Toolbar controls={ range( 2, 5 ).map( ( index ) => createLevelControl( index, level, setAttributes ) ) } />
				<RichText
					tagName={ tagName }
					content={ { contentTree: attributes.content, eventCount: attributes.eventCount } }
					style={ {
						minHeight: Math.max( minHeight, typeof attributes.aztecHeight === 'undefined' ? 0 : attributes.aztecHeight ),
					} }
					onChange={ ( event ) => {
						// Create a React Tree from the new HTML
						const newParaBlock = parse( `<!-- wp:heading --><${ tagName }>${ event.content }</${ tagName }><!-- /wp:heading -->` )[ 0 ];
						setAttributes( {
							...this.props.attributes,
							content: newParaBlock.attributes.content,
							eventCount: event.eventCount,
						} );
					} }
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
