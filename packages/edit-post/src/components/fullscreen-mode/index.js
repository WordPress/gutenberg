/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { doAction } from '@wordpress/hooks';

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
		let delay = 0;
		if ( isActive ) {
			document.body.classList.add( 'is-fullscreen-mode' );
			delay = 300; // .is-fullscreen-mode has a fade in animation of 0.3s
		} else {
			document.body.classList.remove( 'is-fullscreen-mode' );
		}

		setTimeout( () => doAction( 'fullscreenModeToggled' ), delay );
	}

	render() {
		return null;
	}
}

export default withSelect( ( select ) => ( {
	isActive: select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' ),
} ) )( FullscreenMode );
