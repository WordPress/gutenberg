/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenTakeoverHeader from './editor-screen-takeover-header';

/**
 * External dependencies
 */
import Modal from 'react-modal';

Modal.setAppElement( document.getElementById( 'editor' ) );

export default class EditorScreenTakeover extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			height: window.innerHeight - 32,
		};

		this.updateWindowHeight = this.updateWindowHeight.bind( this );
	}

	componentDidMount() {
		window.addEventListener( 'resize', this.updateWindowHeight );
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.updateWindowHeight );
	}

	updateWindowHeight() {
		this.setState( {
			height: window.innerHeight - 32,
		} );
	}

	render() {
		const { height } = this.state;
		const { icon, title, children, isOpen, onClose } = this.props;
		return <Modal
			isOpen={ isOpen }
			className={ 'edit-post-plugin-screen-takeover__editor-screen-takeover' }
			overlayClassName={ 'edit-post-plugin-screen-takeover__editor-screen-takeover-overlay' }
			parentSelector={ () => document.getElementsByClassName( 'gutenberg' )[ 0 ] }
			onRequestClose={ onClose }
			style={ {
				overlay: {
					height: height,
				},
			} }
		>
			<ScreenTakeoverHeader icon={ icon } title={ title } onClose={ onClose } />
			<div className="edit-post-plugin-screen-takeover__editor-screen-takeover-content">
				{ children }
			</div>
		</Modal>;
	}
}
