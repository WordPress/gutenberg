import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Component,
} from '@wordpress/element';

import { RichText } from '@wordpress/editor';

const _minHeight = 50;

class ParagraphBlock extends Component {
	render() {
		const {
			attributes,
			setAttributes,
			//className,
			style,
		} = this.props;

		const {
			placeholder,
		} = attributes;

		return (
			<View>
				<RichText
					content={ { contentTree: attributes.content, eventCount: attributes.eventCount } }
					style={ style, [
						{ minHeight: Math.max( _minHeight, attributes.aztecHeight !== null ? attributes.aztecHeight : 0 ) },
					] }
					onChange={ ( event ) => {
						//console.log(event);
						setAttributes( {
							...this.props.attributes,
							content: event.content,
							eventCount: event.eventCount,
						} );
					}
					}
					onContentSizeChange={ ( event ) => {
						setAttributes( {
							...this.props.attributes,
							aztecHeight: event.aztecHeight,
						} );
					}
					}
					placeholder={ placeholder || __( 'Add text or type / to add content' ) }
					aria-label={ __( 'test' ) }
				/>
			</View>
		);
	}
}

const ParagraphEdit = function ParagraphEdit( { attributes, setAttributes } ) {
	return ( <ParagraphBlock attributes={ attributes } setAttributes={ setAttributes } /> );
};

export default ParagraphEdit;
