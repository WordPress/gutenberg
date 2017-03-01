/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { find } from 'lodash';
import { EnhancedInputComponent } from 'wp-blocks';

export default class ImageBlockForm extends Component {

	merge() {
		this.props.remove();
	}

	focus( position ) {
		this.caption.focus( position );
	}

	bindCaption = ( ref ) => {
		this.caption = ref;
	}

	render() {
		const { block: { attrs, children }, setAttributes, moveDown, moveUp, remove, appendBlock } = this.props;
		const image = find( children, ( { name } ) => 'img' === name );
		if ( ! image ) {
			return null;
		}
		const caption = attrs.caption || '';
		const removePrevious = () => {
			if ( ! caption ) {
				remove();
			}
		};
		const splitValue = ( left, right ) => {
			setAttributes( { caption: left } );
			appendBlock( {
				type: 'WP_Block',
				blockType: 'paragraph',
				attrs: {},
				startText: '<!-- wp:paragraph -->',
				endText: '<!-- /wp -->',
				rawContent: '<!-- wp:paragraph -->' + right + '<!-- /wp -->',
				children: [ {
					type: 'Text',
					value: right
				} ]
			} );
		};

		return (
			<div>
				<img
					src={ image.attrs.src }
					className="image-caption-block__display"
				/>
				<div className="image-caption-block__caption">
					<EnhancedInputComponent
						ref={ this.bindCaption }
						moveUp={ moveUp }
						removePrevious={ removePrevious }
						moveDown={ moveDown }
						splitValue={ splitValue }
						value={ caption }
						onChange={ ( value ) => setAttributes( { caption: value } ) }
						placeholder="Enter a caption"
					/>
				</div>
			</div>
		);
	}
}
