/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

class WithHoverAreas extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hoverArea: null,
		};
		this.bindContainer = this.bindContainer.bind( this );
		this.onMouseLeave = this.onMouseLeave.bind( this );
		this.onMouseMove = this.onMouseMove.bind( this );
	}

	componentWillUnmount() {
		this.toggleListeners( true );
	}

	bindContainer( ref ) {
		this.toggleListeners( true );

		if ( ref ) {
			this.container = ref;
			this.toggleListeners();
		}
	}

	toggleListeners( shouldRemoveEvents ) {
		if ( ! this.container ) {
			return;
		}
		const method = shouldRemoveEvents ? 'removeEventListener' : 'addEventListener';
		this.container[ method ]( 'mousemove', this.onMouseMove );
		this.container[ method ]( 'mouseleave', this.onMouseLeave );
	}

	onMouseLeave() {
		if ( this.state.hoverArea ) {
			this.setState( { hoverArea: null } );
		}
	}

	onMouseMove( event ) {
		const { isRTL } = this.props;
		const { width, left, right } = this.container.getBoundingClientRect();

		let hoverArea = null;
		if ( ( event.clientX - left ) < width / 3 ) {
			hoverArea = isRTL ? 'right' : 'left';
		} else if ( ( right - event.clientX ) < width / 3 ) {
			hoverArea = isRTL ? 'left' : 'right';
		}

		if ( hoverArea !== this.state.hoverArea ) {
			this.setState( { hoverArea } );
		}
	}

	render() {
		const { hoverArea } = this.state;
		const { children } = this.props;

		return children( { hoverArea, bindContainer: this.bindContainer } );
	}
}

export default withSelect( ( select ) => {
	return {
		isRTL: select( 'core/editor' ).getEditorSettings().isRTL,
	};
} )( WithHoverAreas );

