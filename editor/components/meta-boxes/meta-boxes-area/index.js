/**
 * External dependencies
 */
import { isEqual } from 'lodash';
import classnames from 'classnames';
import { connect } from 'react-redux';
import jQuery from 'jquery';

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
import { handleMetaBoxReload, metaBoxStateChanged, metaBoxLoaded } from '../../../actions';
import { getMetaBox, isSavingPost } from '../../../selectors';

class MetaBoxesArea extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			loading: false,
		};
		this.originalFormData = '';
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

	componentWillUnmount() {
		this.mounted = false;
		this.unbindFormEvents();
		document.querySelector( '#metaboxes' ).appendChild( this.form );
	}

	unbindFormEvents() {
		if ( this.form ) {
			this.form.removeEventListener( 'change', this.checkState );
			this.form.removeEventListener( 'input', this.checkState );
		}
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

			// Save the metaboxes
			window.fetch( addQueryArgs( window._wpMetaBoxUrl, { meta_box: location } ), fetchOptions )
				.then( () => {
					if ( ! this.mounted ) {
						return false;
					}
					this.setState( { loading: false } );
					this.props.metaBoxReloaded( location );
				} );
		}
	}

	fetchMetaboxes() {
		const { location } = this.props;
		this.form = document.querySelector( '.metabox-location-' + location );
		this.node.appendChild( this.form );
		this.form.onSubmit = ( event ) => event.preventDefault();
		this.originalFormData = this.getFormData();
		this.form.addEventListener( 'change', this.checkState );
		this.form.addEventListener( 'input', this.checkState );
		this.props.metaBoxLoaded( location );
	}

	getFormData() {
		return jQuery( this.form ).serialize();
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
		metaBoxLoaded: ( location ) => dispatch( metaBoxLoaded( location ) ),
	};
}

export default connect( mapStateToProps, mapDispatchToProps )( MetaBoxesArea );
