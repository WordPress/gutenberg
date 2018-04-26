/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withState } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	createBlock,
	BlockControls,
	BlockAlignmentToolbar,
	RichText,
	InnerBlocks,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';

const blockAttributes = {
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

export const name = 'core/pullquote';

export const settings = {

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

	edit: withState( {
		editable: 'content',
	} )( ( { attributes, setAttributes, isSelected, className, editable, setState } ) => {
		const { citation, align } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSetActiveEditable = ( newEditable ) => () => setState( { editable: newEditable } );

		return (
			<Fragment>
				<BlockControls>
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
					/>
				</BlockControls>
				<blockquote className={ className }>
					<InnerBlocks />
					{ ( citation || isSelected ) && (
						<RichText
							tagName="cite"
							value={ citation }
							/* translators: the individual or entity quoted */
							placeholder={ __( 'Write citation…' ) }
							onChange={
								( nextCitation ) => setAttributes( {
									citation: nextCitation,
								} )
							}
							isSelected={ isSelected && editable === 'cite' }
							onFocus={ onSetActiveEditable( 'cite' ) }
						/>
					) }
				</blockquote>
			</Fragment>
		);
	} ),

	save( { attributes } ) {
		const { citation, align } = attributes;

		return (
			<blockquote className={ `align${ align }` }>
				<InnerBlocks.Content />
				{ citation && citation.length > 0 && <RichText.Content tagName="cite" value={ citation } /> }
			</blockquote>
		);
	},

	deprecated: [ {
		attributes: {
			...blockAttributes,
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
		},

		migrate( { value = [], ...attributes } ) {
			return [
				attributes,
				value.map( ( { children: paragraph } ) =>
					createBlock( 'core/paragraph', {
						content: castArray( paragraph.props.children ),
					} )
				),
			];
		},

		save( { attributes } ) {
			const { value, citation, align } = attributes;

			return (
				<blockquote className={ `align${ align }` }>
					{ value && value.map( ( paragraph, i ) =>
						<p key={ i }>{ paragraph.children && paragraph.children.props.children }</p>
					) }
					{ citation && citation.length > 0 && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			);
		},
	}, {
		attributes: {
			...blockAttributes,
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
					{ citation && citation.length > 0 && <RichText.Content tagName="footer" value={ citation } /> }
				</blockquote>
			);
		},
	} ],
};
