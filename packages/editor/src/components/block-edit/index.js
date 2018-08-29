/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Edit from './edit';
import { BlockEditContextProvider } from './context';

class BlockEdit extends Component {
	constructor( props ) {
		super( props );

		this.setFocusedElement = this.setFocusedElement.bind( this );

		this.state = {
			focusedElement: null,
			setFocusedElement: this.setFocusedElement,
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
		const { clientId, name, isSelected } = props;

		return {
			name,
			isSelected,
			clientId,
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

export default BlockEdit;
