import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Component,
} from '@wordpress/element';
import {
	getPhrasingContentSchema,
} from '@wordpress/blocks';
import { RichText } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';

export const name = 'core/paragraph';

const schema = {
	content: {
		type: 'array',
		source: 'children',
		selector: 'p',
		default: [],
	},
	align: {
		type: 'string',
	},
	dropCap: {
		type: 'boolean',
		default: false,
	},
	placeholder: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
	},
	fontSize: {
		type: 'string',
	},
	customFontSize: {
		type: 'number',
	},
};

const supports = {
	className: false,
};

const _minHeight = 50;

class ParagraphBlock extends Component {
	/*constructor() {
		super( ...arguments );
		console.log('ParagraphBlock->constructor');
		console.log(...arguments)
	}*/
	render() {
		const {
			attributes,
			setAttributes,
			//className,
			style,
		} = this.props;
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
					placeholder={ __( 'Write Write!!' ) }
					aria-label={ __( 'test' ) }
				/>
			</View>
		);
	}
}

export const settings = {

	title: __( 'Paragraph' ),

	description: __( 'This is a simple text only block for adding a single paragraph of content.' ),

	icon: 'editor-paragraph',

	category: 'common',

	keywords: [ __( 'text' ) ],

	supports,

	attributes: schema,

	transforms: {
		from: [
			{
				type: 'raw',
				// Paragraph is a fallback and should be matched last.
				priority: 20,
				selector: 'p',
				schema: {
					p: {
						children: getPhrasingContentSchema(),
					},
				},
			},
		],
	},

	edit: ParagraphBlock,

	save( { attributes } ) {
		return <p>{ attributes.content }</p>;
	},
};
