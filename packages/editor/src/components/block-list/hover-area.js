/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

class HoverArea extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hoverArea: null,
		};
		this.onMouseLeave = this.onMouseLeave.bind( this );
		this.onMouseMove = this.onMouseMove.bind( this );
	}

	componentWillUnmount() {
		if ( this.props.container ) {
			this.toggleListeners( this.props.container, false );
		}
	}

	componentDidMount() {
		if ( this.props.container ) {
			this.toggleListeners( this.props.container );
		}
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.container === this.props.container ) {
			return;
		}
		if ( prevProps.container ) {
			this.toggleListeners( prevProps.container, false );
		}
		if ( this.props.container ) {
			this.toggleListeners( this.props.container, true );
		}
	}

	toggleListeners( container, shouldListnerToEvents = true ) {
		const method = shouldListnerToEvents ? 'addEventListener' : 'removeEventListener';
		container[ method ]( 'mousemove', this.onMouseMove );
		container[ method ]( 'mouseleave', this.onMouseLeave );
	}

	onMouseLeave() {
		if ( this.state.hoverArea ) {
			this.setState( { hoverArea: null } );
		}
	}

	onMouseMove( event ) {
		const { isRTL, container } = this.props;
		const { width, left, right } = container.getBoundingClientRect();

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

		return children( { hoverArea } );
	}
}

export default withSelect( ( select ) => {
	return {
		isRTL: select( 'core/block-editor' ).getSettings().isRTL,
	};
} )( HoverArea );

