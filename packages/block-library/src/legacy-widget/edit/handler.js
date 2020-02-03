/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import LegacyWidgetEditDomManager from './dom-manager';

const { XMLHttpRequest, FormData } = window;

class LegacyWidgetEditHandler extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			form: null,
		};
		this.widgetNonce = null;
		this.instanceUpdating = null;
		this.onInstanceChange = this.onInstanceChange.bind( this );
		this.requestWidgetUpdater = this.requestWidgetUpdater.bind( this );
	}

	componentDidMount() {
		this.isStillMounted = true;
		this.trySetNonce();
		this.requestWidgetUpdater( undefined, ( response ) => {
			this.props.onInstanceChange( null, !! response.form );
		} );
	}

	componentDidUpdate( prevProps ) {
		if ( ! this.widgetNonce ) {
			this.trySetNonce();
		}
		if (
			prevProps.instance !== this.props.instance &&
			this.instanceUpdating !== this.props.instance
		) {
			this.requestWidgetUpdater( undefined, ( response ) => {
				this.props.onInstanceChange( null, !! response.form );
			} );
		}
		if ( this.instanceUpdating === this.props.instance ) {
			this.instanceUpdating = null;
		}
	}

	componentWillUnmount() {
		this.isStillMounted = false;
	}

	render() {
		const {
			instanceId,
			id,
			number,
			idBase,
			instance,
			isSelected,
			widgetName,
		} = this.props;
		const { form } = this.state;

		if ( ! form ) {
			return null;
		}

		const widgetTitle = get( instance, [ 'title' ] );
		let title = null;
		if ( isSelected ) {
			if ( widgetTitle && widgetName ) {
				title = `${ widgetName }: ${ widgetTitle }`;
			} else if ( ! widgetTitle && widgetName ) {
				title = widgetName;
			} else if ( widgetTitle && ! widgetName ) {
				title = widgetTitle;
			}
		}
		return (
			<>
				{ title && (
					<div className="wp-block-legacy-widget__edit-widget-title">
						{ title }
					</div>
				) }
				<div
					className="wp-block-legacy-widget__edit-container"
					// Display none is used because when we switch from edit to preview,
					// we don't want to unmount the component.
					// Otherwise when we went back to edit we wound need to trigger
					// all widgets events again and some scripts may not deal well with this.
					style={ {
						display: this.props.isVisible ? 'block' : 'none',
					} }
				>
					<LegacyWidgetEditDomManager
						isReferenceWidget={ !! id }
						ref={ ( ref ) => {
							this.widgetEditDomManagerRef = ref;
						} }
						onInstanceChange={ this.onInstanceChange }
						number={ number ? number : instanceId * -1 }
						id={ id }
						idBase={ idBase }
						form={ form }
					/>
				</div>
			</>
		);
	}

	trySetNonce() {
		const element = document.getElementById( '_wpnonce_widgets' );
		if ( element && element.value ) {
			this.widgetNonce = element.value;
		}
	}

	onInstanceChange( instanceChanges ) {
		const { id } = this.props;
		if ( id ) {
			// For reference widgets there is no need to query an endpoint,
			// the widget is already saved with ajax.
			this.props.onInstanceChange( instanceChanges, true );
			return;
		}
		this.requestWidgetUpdater( instanceChanges, ( response ) => {
			this.instanceUpdating = response.instance;
			this.props.onInstanceChange( response.instance, !! response.form );
		} );
	}

	requestWidgetUpdater( instanceChanges, callback ) {
		const { id, idBase, instance, widgetClass } = this.props;
		const { isStillMounted } = this;
		if ( ! id && ! widgetClass ) {
			return;
		}

		// If we are in the presence of a reference widget, do a save ajax request
		// with empty changes so we retrieve the widget edit form.
		if ( id ) {
			const httpRequest = new XMLHttpRequest();
			const formData = new FormData();
			formData.append( 'action', 'save-widget' );
			formData.append( 'id_base', idBase );
			formData.append( 'widget-id', id );
			formData.append( 'widget-width', '250' );
			formData.append( 'widget-height', '200' );
			formData.append( 'savewidgets', this.widgetNonce );
			httpRequest.open( 'POST', window.ajaxurl );
			httpRequest.addEventListener( 'load', () => {
				if ( isStillMounted ) {
					const form = httpRequest.responseText;
					this.setState( { form } );
					if ( callback ) {
						callback( { form } );
					}
				}
			} );
			httpRequest.send( formData );
			return;
		}

		if ( widgetClass ) {
			apiFetch( {
				path: `/__experimental/widget-forms/${ widgetClass }/`,
				data: {
					instance,
					instance_changes: instanceChanges,
				},
				method: 'POST',
			} ).then( ( response ) => {
				if ( isStillMounted ) {
					this.setState( {
						form: response.form,
					} );
					if ( callback ) {
						callback( response );
					}
				}
			} );
		}
	}
}

export default withInstanceId( LegacyWidgetEditHandler );
