/**
 * External dependencies
 */
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import './block.scss';
import { registerBlockType, query as hpq } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const { children, query, node } = hpq;

registerBlockType( 'core/pullquote', {

	title: __( 'Pullquote' ),

	icon: 'format-quote',

	category: 'formatting',

	attributes: {
		value: query( 'blockquote > p', node() ),
		citation: children( 'footer' ),
	},

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
						controls={ [ 'left', 'center', 'right', 'wide', 'full' ] }
					/>
				</BlockControls>
			),
			<blockquote key="quote" className={ className }>
				<Editable
					multiline="p"
					value={ value }
					onChange={
						( nextValue ) => setAttributes( {
							value: nextValue,
						} )
					}
					placeholder={ __( 'Write quote…' ) }
					focus={ focus && focus.editable === 'value' ? focus : null }
					onFocus={ ( props ) => setFocus( { ...props, editable: 'value' } ) }
					className="blocks-pullquote__content"
				/>
				{ ( citation || !! focus ) && (
					<Editable
						tagName="footer"
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
		const { value, citation, align = 'none' } = attributes;

		return (
			<blockquote className={ `align${ align }` }>
				{ value && value.map( ( paragraph, i ) => (
					<p key={ i }>
						{ isString( paragraph ) ? paragraph : paragraph.props.children }
					</p>
				) ) }

				{ citation && citation.length > 0 && (
					<footer>{ citation }</footer>
				) }
			</blockquote>
		);
	},
} );
