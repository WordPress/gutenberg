/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import Modal from 'react-modal';
import ScreenTakeoverHeader from './editor-screen-takeover-header';

Modal.setAppElement( document.getElementById( 'editor' ) );

export default class EditorScreenTakeover extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			height: window.innerHeight - 32,
		};
	}

	updateWindowHeight() {
		this.setState( {
			height: window.innerHeight - 32,
		} );
	}

	componentDidMount() {
		window.addEventListener( 'resize', this.updateWindowHeight.bind( this ) );
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.updateWindowHeight.bind( this ) );
	}

	getModal() {
		const height = this.state.height;
		const { icon, title, children } = this.props;
		return <Modal
			isOpen={ true }
			className={ 'edit-post-plugin-screen-takeover__editor-screen-takeover' }
			overlayClassName={ 'edit-post-plugin-screen-takeover__editor-screen-takeover-overlay' }
			parentSelector={ () => document.getElementsByClassName( 'gutenberg' )[ 0 ] }
			style={ {
				overlay: {
					height: height,
				},
			} }
		>
			<ScreenTakeoverHeader icon={ icon } title={ title } />
			{ children }
		</Modal>;
	}

	render() {
		return this.getModal();
	}
}
