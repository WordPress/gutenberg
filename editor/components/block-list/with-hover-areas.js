/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from '@wordpress/element';

/**
 * Module constants
 */
const HOVER_AREA_SIZE = 120;

const withHoverAreas = ( WrappedComponent ) => {
	class WithHoverAreasComponent extends Component {
		constructor() {
			super( ...arguments );
			this.state = {
				hoverArea: null,
			};
			this.onMouseLeave = this.onMouseLeave.bind( this );
			this.onMouseMove = this.onMouseMove.bind( this );
		}

		componentDidMount() {
			// Disable reason: We use findDOMNode to avoid unnecessary extra dom Nodes
			// eslint-disable-next-line react/no-find-dom-node
			this.container = findDOMNode( this );
			this.container.addEventListener( 'mousemove', this.onMouseMove );
			this.container.addEventListener( 'mouseleave', this.onMouseLeave );
		}

		componentWillUnmount() {
			this.container.removeEventListener( 'mousemove', this.onMouseMove );
			this.container.removeEventListener( 'mouseleave', this.onMouseLeave );
		}

		onMouseLeave() {
			if ( this.state.hoverArea ) {
				this.setState( { hoverArea: null } );
			}
		}

		onMouseMove( event ) {
			const { width, left, right } = this.container.getBoundingClientRect();
			const isSmall = width < ( HOVER_AREA_SIZE * 2 ) + 10;

			let hoverArea = null;
			if ( ( event.clientX - left ) < ( isSmall ? width / 2 : HOVER_AREA_SIZE ) ) {
				hoverArea = 'left';
			} else if ( ( right - event.clientX ) < ( isSmall ? width / 2 : HOVER_AREA_SIZE ) ) {
				hoverArea = 'right';
			}

			if ( hoverArea !== this.state.hoverArea ) {
				this.setState( { hoverArea } );
			}
		}

		render() {
			const { hoverArea } = this.state;
			return (
				<WrappedComponent { ...this.props } hoverArea={ hoverArea } />
			);
		}
	}

	return WithHoverAreasComponent;
};

export default withHoverAreas;
