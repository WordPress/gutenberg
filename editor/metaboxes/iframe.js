/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, findDOMNode } from '@wordpress/element';

// @TODO add error handling.
class MetaboxIframe extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			width: 0,
			height: 0,
		};

		this.formData = [];
		this.originalFormData = [];
		this.form = null;

		this.checkMessageForResize = this.checkMessageForResize.bind( this );
		this.handleMetaboxReload = this.handleMetaboxReload.bind( this );
		this.checkMetaboxState = this.checkMetaboxState.bind( this );
		this.isFrameAccessible = this.isFrameAccessible.bind( this );
		this.observeChanges = this.observeChanges.bind( this );
	}

	isFrameAccessible() {
		try {
			return !! this.node.contentDocument.body;
		} catch ( e ) {
			return false;
		}
	}

	componentDidMount() {
		/**
		 * Sets up an event listener for resizing. The resizing occurs inside
		 * the iframe, see gutenberg/assets/js/metabox.js
		 */
		window.addEventListener( 'message', this.checkMessageForResize, false );

		this.node.addEventListener( 'load', this.observeChanges );
	}

	componentWillReceiveProps( nextProps ) {
		// Metabox updating.
		if ( this.props.isUpdating === false && nextProps.isUpdating === true ) {
			const iframe = findDOMNode( this.node );
			iframe.addEventListener( 'load', this.handleMetaboxReload );

			// The standard post.php form ID post should probably be mimicked.
			const form = this.node.contentWindow.document.getElementById( 'post' );
			form.submit();
		}
	}

	componentWillUnmount() {
		const iframe = findDOMNode( this.node );
		iframe.removeEventListener( 'message', this.checkMessageForResize );

		if ( this.dirtyObserver ) {
			this.dirtyObserver.disconnect();
		}

		if ( this.form !== null ) {
			this.form.removeEventListener( 'input', this.checkMetaboxState );
			this.form.removeEventListener( 'change', this.checkMetaboxState );
		}

		this.node.removeEventListener( 'load', this.observeChanges );
	}

	observeChanges() {
		this.originalFormData = this.getFormData( this.node );

		const form = this.node.contentWindow.document.getElementById( 'post' );
		this.form = form;
		// Add event listeners to handle dirty checking.
		this.dirtyObserver = new window.MutationObserver( this.checkMetaboxState );
		this.dirtyObserver.observe( findDOMNode( form ), {
			attributes: true,
			attributeOldValue: true,
			characterData: true,
			characterDataOldValue: true,
			childList: true,
			subtree: true,
		} );
		form.addEventListener( 'change', this.checkMetaboxState );
		form.addEventListener( 'input', this.checkMetaboxState );
	}

	getFormData( node ) {
		if ( ! this.isFrameAccessible ) {
			return;
		}

		const form = node.contentWindow.document.getElementById( 'post' );

		const data = new window.FormData( form );
		const entries = Array.from( data.entries() );
		return entries;
	}

	checkMetaboxState() {
		const entries = this.getFormData( this.node );

		if ( ! isEqual( this.originalFormData, entries ) ) {
			if ( this.props.isDirty === false ) {
				this.props.changedMetaboxState( this.props.location, true );
			}

			return;
		}

		// If the data is the same as the original and we have metabox marked as dirty.
		if ( this.props.isDirty === true ) {
			this.props.changedMetaboxState( this.props.location, false );
		}
	}

	handleMetaboxReload( event ) {
		event.target.removeEventListener( 'load', this.handleMetaboxReload );
		this.props.metaboxReloaded( this.props.location );
	}

	checkMessageForResize( event ) {
		const iframe = this.node;

		// Attempt to parse the message data as JSON if passed as string
		let data = event.data || {};
		if ( 'string' === typeof data ) {
			try {
				data = JSON.parse( data );
			} catch ( e ) {} // eslint-disable-line no-empty
		}

		if ( data.source !== 'metabox' || data.location !== this.props.location ) {
			return;
		}

		// Verify that the mounted element is the source of the message
		if ( ! iframe || iframe.contentWindow !== event.source ) {
			return;
		}

		// Update the state only if the message is formatted as we expect, i.e.
		// as an object with a 'resize' action, width, and height
		const { action, width, height } = data;
		const { width: oldWidth, height: oldHeight } = this.state;

		if ( 'resize' === action && ( oldWidth !== width || oldHeight !== height ) ) {
			this.setState( { width, height } );
		}
	}

	render() {
		const { location, className, id } = this.props;

		return (
			<iframe
				ref={ ( node ) => {
					this.node = node;
				} }
				title={ __( 'Extended Settings' ) }
				key="metabox"
				id={ id }
				className={ className }
				src={ `${ window._wpMetaboxUrl }&metabox=${ location }` }
				width={ Math.ceil( this.state.width ) }
				height={ Math.ceil( this.state.height ) } />
		);
	}
}

export default MetaboxIframe;
