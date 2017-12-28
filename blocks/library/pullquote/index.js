/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const toEditableValue = value => map( value, ( subValue => subValue.children ) );
const fromEditableValue = value => map( value, ( subValue ) => ( {
	children: subValue,
} ) );
const blockAttributes = {
	value: {
		type: 'array',
		source: 'query',
		selector: 'blockquote > p',
		query: {
			children: {
				source: 'node',
			},
		},
	},
	citation: {
		type: 'array',
		source: 'children',
		selector: 'cite',
	},
	align: {
		type: 'string',
		default: 'none',
	},
};

registerBlockType( 'core/pullquote', {

	title: __( 'Pullquote' ),

	description: __( 'A pullquote is a brief, attention-catching quotation taken from the main text of an article and used as a subheading or graphic feature.' ),

	icon: 'format-quote',

	category: 'formatting',

	attributes: blockAttributes,

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { value, citation, align } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );

		return [
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
					/>
				</BlockControls>
			),
			<blockquote key="quote" className={ className }>
				<Editable
					multiline="p"
					value={ toEditableValue( value ) }
					onChange={
						( nextValue ) => setAttributes( {
							value: fromEditableValue( nextValue ),
						} )
					}
					placeholder={ __( 'Write quote…' ) }
					focus={ focus && focus.editable === 'value' ? focus : null }
					onFocus={ ( props ) => setFocus( { ...props, editable: 'value' } ) }
					wrapperClassName="blocks-pullquote__content"
				/>
				{ ( citation || !! focus ) && (
					<Editable
						tagName="cite"
						value={ citation }
						placeholder={ __( 'Write caption…' ) }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						focus={ focus && focus.editable === 'citation' ? focus : null }
						onFocus={ ( props ) => setFocus( { ...props, editable: 'citation' } ) }
					/>
				) }
			</blockquote>,
		];
	},

	save( { attributes } ) {
		const { value, citation, align } = attributes;

		return (
			<blockquote className={ `align${ align }` }>
				{ value && value.map( ( paragraph, i ) =>
					<p key={ i }>{ paragraph.children && paragraph.children.props.children }</p>
				) }
				{ citation && citation.length > 0 && (
					<cite>{ citation }</cite>
				) }
			</blockquote>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
			citation: {
				type: 'array',
				source: 'children',
				selector: 'footer',
			},
		},

		save( { attributes } ) {
			const { value, citation, align } = attributes;

			return (
				<blockquote className={ `align${ align }` }>
					{ value && value.map( ( paragraph, i ) =>
						<p key={ i }>{ paragraph.children && paragraph.children.props.children }</p>
					) }
					{ citation && citation.length > 0 && (
						<footer>{ citation }</footer>
					) }
				</blockquote>
			);
		},
	} ],
} );
