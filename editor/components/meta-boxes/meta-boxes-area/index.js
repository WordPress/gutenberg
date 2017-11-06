/**
 * External dependencies
 */
import { isEqual } from 'lodash';
import classnames from 'classnames';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { Component } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import './meta-box-area.scss';
import { handleMetaBoxReload, metaBoxStateChanged } from '../../actions';
import { getMetaBox, isSavingPost } from '../../selectors';

function insertAndRunScripts( element, html ) {
	element.innerHTML = html;
	const scripts = [];
	const ret = element.childNodes;
	for ( let i = 0; ret[ i ]; i++ ) {
		if ( scripts && nodeName( ret[ i ], 'script' ) && ( ! ret[ i ].type || ret[ i ].type.toLowerCase() === 'text/javascript' ) ) {
			scripts.push( ret[ i ].parentNode ? ret[ i ].parentNode.removeChild( ret[ i ] ) : ret[ i ] );
		}
	}

	for ( const script in scripts ) {
		evalScript( scripts[ script ] );
	}
}

function nodeName( elem, name ) {
	return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
}

function evalScript( elem ) {
	const data = ( elem.text || elem.textContent || elem.innerHTML || '' );
	const head = document.getElementsByTagName( 'head' )[ 0 ] || document.documentElement,
		script = document.createElement( 'script' );
	script.type = 'text/javascript';
	script.appendChild( document.createTextNode( data ) );
	head.insertBefore( script, head.firstChild );
	head.removeChild( script );

	if ( elem.parentNode ) {
		elem.parentNode.removeChild( elem );
	}
}

class MetaBoxesArea extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			loading: true,
		};
		this.originalFormData = [];
		this.bindNode = this.bindNode.bind( this );
		this.checkState = this.checkState.bind( this );
	}

	bindNode( node ) {
		this.node = node;
	}

	componentDidMount() {
		this.mounted = true;
		this.fetchMetaboxes();
	}

	componentWillUnmout() {
		this.mounted = false;
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.isUpdating && ! this.props.isUpdating ) {
			this.setState( { loading: true } );
			const { location } = nextProps;
			const headers = new window.Headers();
			const fetchOptions = {
				method: 'POST',
				headers,
				body: new window.FormData( this.form ),
				credentials: 'include',
			};
			const request = window.fetch( addQueryArgs( window._wpMetaBoxUrl, { meta_box: location } ), fetchOptions );
			this.onMetaboxResponse( request, false );
		}
	}

	fetchMetaboxes() {
		const { location } = this.props;
		const request = window.fetch( addQueryArgs( window._wpMetaBoxUrl, { meta_box: location } ), { credentials: 'include' } );
		this.onMetaboxResponse( request );
	}

	onMetaboxResponse( request, initial = true ) {
		request.then( ( response ) => response.text() )
			.then( ( body ) => {
				if ( ! this.mounted ) {
					return;
				}
				insertAndRunScripts( this.node, body );
				this.form = this.node.querySelector( '.meta-box-form' );
				this.form.onSubmit = ( event ) => event.preventDefault();
				this.originalFormData = this.getFormData();
				this.form.addEventListener( 'change', this.checkState );
				this.form.addEventListener( 'input', this.checkState );
				this.setState( { loading: false } );
				if ( ! initial ) {
					this.props.metaBoxReloaded( this.props.location );
				}
			} );
	}

	getFormData() {
		const data = new window.FormData( this.form );
		const entries = Array.from( data.entries() );
		return entries;
	}

	checkState() {
		const { loading } = this.state;
		const { isDirty, changedMetaBoxState, location } = this.props;

		const newIsDirty = ! isEqual( this.originalFormData, this.getFormData() );

		/**
		 * If we are not updating, then if dirty and equal to original, then set not dirty.
		 * If we are not updating, then if not dirty and not equal to original, set as dirty.
		 */
		if ( ! loading && isDirty !== newIsDirty ) {
			changedMetaBoxState( location, newIsDirty );
		}
	}

	render() {
		const { location } = this.props;
		const { loading } = this.state;

		const classes = classnames(
			'editor-meta-boxes-area',
			`is-${ location }`,
			{
				'is-loading': loading,
			}
		);

		return (
			<div className={ classes }>
				{ loading && <Spinner /> }
				<div ref={ this.bindNode } />
			</div>
		);
	}
}

function mapStateToProps( state, ownProps ) {
	const metaBox = getMetaBox( state, ownProps.location );
	const { isDirty, isUpdating } = metaBox;

	return {
		isDirty,
		isUpdating,
		isPostSaving: isSavingPost( state ) ? true : false,
	};
}

function mapDispatchToProps( dispatch ) {
	return {
		// Used to set the reference to the MetaBox in redux, fired when the component mounts.
		metaBoxReloaded: ( location ) => dispatch( handleMetaBoxReload( location ) ),
		changedMetaBoxState: ( location, hasChanged ) => dispatch( metaBoxStateChanged( location, hasChanged ) ),
	};
}

export default connect( mapStateToProps, mapDispatchToProps )( MetaBoxesArea );
