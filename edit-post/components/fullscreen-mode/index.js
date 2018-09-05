/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

class FullscreenMode extends Component {
	componentDidMount() {
		this.sync();
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isActive !== prevProps.isActive ) {
			this.sync();
		}
	}

	sync() {
		const { isActive } = this.props;
		if ( isActive ) {
			document.body.classList.add( 'is-fullscreen-mode' );
		} else {
			document.body.classList.remove( 'is-fullscreen-mode' );
		}
	}

	render() {
		return null;
	}
}

export default withSelect( ( select ) => ( {
	isActive: select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' ),
} ) )( FullscreenMode );
