/**
 * Internal dependencies
 */
import { registerBlock, query } from 'api';
import Editable from 'components/editable';

const { children, prop } = query;

registerBlock( 'core/heading', {
	title: wp.i18n.__( 'Heading' ),

	icon: 'heading',

	category: 'common',

	attributes: {
		content: children( 'h1,h2,h3,h4,h5,h6' ),
		nodeName: prop( 'h1,h2,h3,h4,h5,h6', 'nodeName' ),
		align: prop( 'h1,h2,h3,h4,h5,h6', 'style.textAlign' )
	},

	controls: [
		...'123456'.split( '' ).map( ( level ) => ( {
			icon: 'heading',
			title: wp.i18n.sprintf( wp.i18n.__( 'Heading %s' ), level ),
			isActive: ( { nodeName } ) => 'H' + level === nodeName,
			onClick( attributes, setAttributes ) {
				setAttributes( { nodeName: 'H' + level } );
			},
			subscript: level
		} ) )
	],

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content, align } ) => {
					if ( Array.isArray( content ) ) {
						// TODO this appears to always be true?
						// TODO reject the switch if more than one paragraph
						content = content[ 0 ];
					}
					return {
						nodeName: 'H2',
						content,
						align
					};
				}
			}
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content, align } ) => {
					return {
						content: [ content ],
						align
					};
				}
			}
		]
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: wp.element.concatChildren( attributes.content, attributesToMerge.content )
		};
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeWithPrevious } ) {
		const { content, nodeName = 'H2', align } = attributes;

		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				value={ content }
				focus={ focus }
				onFocus={ setFocus }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				style={ align ? { textAlign: align } : null }
				onMerge={ mergeWithPrevious }
			/>
		);
	},

	save( { attributes } ) {
		const { align, nodeName = 'H2', content } = attributes;
		const Tag = nodeName.toLowerCase();

		return (
			<Tag style={ align ? { textAlign: align } : null }>
				{ content }
			</Tag>
		);
	},
} );
