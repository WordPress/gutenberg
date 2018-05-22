/**
 * External dependencies
 */
import { get, isEqual } from 'lodash';

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
import './editor.scss';

class FootnotesEditor extends Component {
	constructor( props ) {
		super( ...arguments );

		this.setFootnotesInOrder( props.footnotesOrder );
		this.state = {
			editable: null,
		};
	}

	setFootnotesInOrder( footnotesOrder ) {
		const { attributes, setAttributes } = this.props;

		const footnotes = footnotesOrder.map( ( { id } ) => {
			return this.getFootnoteById( attributes.footnotes, id );
		} );

		setAttributes( { footnotes } );
	}

	getFootnoteById( footnotes, footnoteUid ) {
		const filteredFootnotes = footnotes.filter(
			( footnote ) => footnote.id === footnoteUid );

		return get( filteredFootnotes, [ 0 ], { id: footnoteUid, text: '' } );
	}

	onChange( footnoteUid ) {
		return ( nextValue ) => {
			const { attributes, footnotesOrder, setAttributes } = this.props;

			const nextFootnotes = footnotesOrder.map( ( { id } ) => {
				if ( id === footnoteUid ) {
					return {
						id,
						text: nextValue,
					};
				}

				return this.getFootnoteById( attributes.footnotes, id );
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

	componentWillReceiveProps( nextProps ) {
		const { footnotesOrder } = this.props;
		const nextFootnotesOrder = nextProps.footnotesOrder;

		if ( ! isEqual( footnotesOrder, nextFootnotesOrder ) ) {
			this.setFootnotesInOrder( nextFootnotesOrder );
		}
	}

	render() {
		const { attributes, editable, isSelected } = this.props;
		const { footnotes } = attributes;

		return (
			<ol className="blocks-footnotes__footnotes-list">
				{ footnotes.map( ( footnote ) => (
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
	footnotesOrder: select( 'core/editor' ).getFootnotes(),
} ) )( FootnotesEditor );
