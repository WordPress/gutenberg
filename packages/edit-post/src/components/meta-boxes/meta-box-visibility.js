/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

class MetaBoxVisibility extends Component {
	componentDidMount() {
		this.updateDOM();
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isVisible !== prevProps.isVisible ) {
			this.updateDOM();
		}
	}

	updateDOM() {
		const { id, isVisible } = this.props;

		const element = document.getElementById( id );
		if ( ! element ) {
			return;
		}

		if ( isVisible ) {
			element.classList.remove( 'is-hidden' );
		} else {
			element.classList.add( 'is-hidden' );
		}
	}

	render() {
		return null;
	}
}

export default withSelect( ( select, { id } ) => ( {
	isVisible: select( 'core/edit-post' ).isEditorPanelEnabled(
		`meta-box-${ id }`
	),
} ) )( MetaBoxVisibility );
