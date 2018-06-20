/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { RichText } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getFootnoteByUid, orderFootnotes } from './footnotes-utils.js';
import './editor.scss';

class FootnotesEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			editable: null,
		};
	}

	onChange( footnoteUid ) {
		return ( nextValue ) => {
			const { attributes, orderedFootnoteUids, setAttributes } = this.props;

			const nextFootnotes = orderedFootnoteUids.map( ( { id } ) => {
				if ( id === footnoteUid ) {
					return {
						id,
						text: nextValue,
					};
				}

				return getFootnoteByUid( attributes.footnotes, id );
			} );

			setAttributes( {
				footnotes: nextFootnotes,
			} );
		};
	}

	onSetActiveEditable( id ) {
		return () => {
			this.setState( { editable: id } );
		};
	}

	render() {
		const { attributes, editable, orderedFootnoteUids, isSelected } = this.props;
		const orderedFootnotes = orderFootnotes( attributes.footnotes, orderedFootnoteUids );

		return (
			<ol className="blocks-footnotes__footnotes-list">
				{ orderedFootnotes.map( ( footnote ) => (
					<li key={ footnote.id }>
						<RichText
							tagName="span"
							value={ footnote.text }
							onChange={ this.onChange( footnote.id ) }
							isSelected={ isSelected && editable === footnote.id }
							placeholder={ __( 'Write footnote…' ) }
							onFocus={ this.onSetActiveEditable( footnote.id ) }
						/>
					</li>
				) ) }
			</ol>
		);
	}
}

export default withSelect( ( select ) => ( {
	orderedFootnoteUids: select( 'core/editor' ).getFootnotes(),
} ) )( FootnotesEdit );
