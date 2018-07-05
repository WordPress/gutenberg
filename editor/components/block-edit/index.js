/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { Component, compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Edit from './edit';
import { BlockEditContextProvider } from './context';

export class BlockEdit extends Component {
	constructor( props ) {
		super( props );
		this.setFocusedElement = this.setFocusedElement.bind( this );
		this.state = {
			focusedElement: null,
			setFocusedElement: this.setFocusedElement,
		};
	}

	getChildContext() {
		const { canUserUseUnfilteredHTML } = this.props;

		return {
			canUserUseUnfilteredHTML,
		};
	}

	setFocusedElement( focusedElement ) {
		this.setState( ( prevState ) => {
			if ( prevState.focusedElement === focusedElement ) {
				return null;
			}
			return { focusedElement };
		} );
	}

	static getDerivedStateFromProps( props ) {
		const { id, name, isSelected } = props;

		return {
			name,
			isSelected,
			uid: id,
		};
	}

	render() {
		return (
			<BlockEditContextProvider value={ this.state }>
				<Edit { ...this.props } />
			</BlockEditContextProvider>
		);
	}
}

BlockEdit.childContextTypes = {
	canUserUseUnfilteredHTML: noop,
};

export default compose( [
	withSelect( ( select ) => ( {
		postType: select( 'core/editor' ).getEditedPostAttribute( 'type' ),
		canUserUseUnfilteredHTML: select( 'core/editor' ).canUserUseUnfilteredHTML(),
	} ) ),
] )( BlockEdit );
