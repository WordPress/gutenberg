/**
 * External dependencies
 */
import { get, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button, PanelBody, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import { update } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import LegacyWidgetEditHandler from './handler';
import LegacyWidgetPlaceholder from './placeholder';

class LegacyWidgetEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hasEditForm: true,
			isPreview: false,
		};
		this.switchToEdit = this.switchToEdit.bind( this );
		this.switchToPreview = this.switchToPreview.bind( this );
		this.changeWidget = this.changeWidget.bind( this );
	}

	render() {
		const {
			attributes,
			availableLegacyWidgets,
			hasPermissionsToManageWidgets,
			isSelected,
			prerenderedEditForm,
			setAttributes,
			setWidgetId,
			widgetId,
		} = this.props;
		const { isPreview, hasEditForm } = this.state;
		const { widgetClass } = attributes;
		const widgetObject =
			( widgetId && availableLegacyWidgets[ widgetId ] ) ||
			( widgetClass && availableLegacyWidgets[ widgetClass ] );

		if ( ! widgetId && ! widgetClass ) {
			return (
				<LegacyWidgetPlaceholder
					availableLegacyWidgets={ availableLegacyWidgets }
					hasPermissionsToManageWidgets={
						hasPermissionsToManageWidgets
					}
					onChangeWidget={ ( newWidget ) => {
						const {
							isReferenceWidget,
							id_base: idBase,
						} = availableLegacyWidgets[ newWidget ];
						if ( isReferenceWidget ) {
							setWidgetId( newWidget );
						}
						setAttributes( {
							instance: {},
							idBase,
							widgetClass: isReferenceWidget
								? undefined
								: newWidget,
						} );
					} }
				/>
			);
		}

		const inspectorControls = widgetObject ? (
			<InspectorControls>
				<PanelBody title={ widgetObject.name }>
					{ widgetObject.description }
				</PanelBody>
			</InspectorControls>
		) : null;
		if ( ! hasPermissionsToManageWidgets ) {
			return (
				<>
					{ inspectorControls }
					{ this.renderWidgetPreview() }
				</>
			);
		}

		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						{ widgetObject && ! widgetObject.isHidden && (
							<Button
								onClick={ this.changeWidget }
								label={ __( 'Change widget' ) }
								icon={ update }
							/>
						) }
						{ hasEditForm && (
							<>
								<Button
									className="components-tab-button"
									isPressed={ ! isPreview }
									onClick={ this.switchToEdit }
								>
									<span>{ __( 'Edit' ) }</span>
								</Button>
								<Button
									className="components-tab-button"
									isPressed={ isPreview }
									onClick={ this.switchToPreview }
								>
									<span>{ __( 'Preview' ) }</span>
								</Button>
							</>
						) }
					</ToolbarGroup>
				</BlockControls>
				{ inspectorControls }
				{ hasEditForm && (
					<LegacyWidgetEditHandler
						isSelected={ isSelected }
						isVisible={ ! isPreview }
						id={ widgetId }
						idBase={ attributes.idBase || widgetId }
						number={ attributes.number }
						prerenderedEditForm={ prerenderedEditForm }
						widgetName={ get( widgetObject, [ 'name' ] ) }
						widgetClass={ attributes.widgetClass }
						instance={ attributes.instance }
						onFormMount={ ( formData ) => {
							// Function-based widgets don't come with an object of settings, only
							// with a pre-rendered HTML form. Extracting settings from that HTML
							// before this stage is not trivial (think embedded <script>). An alternative
							// proposed here serializes the form back into widget settings immediately after
							// it's mounted.
							if ( ! attributes.widgetClass ) {
								this.props.setAttributes( {
									instance: formData,
								} );
							}
						} }
						onInstanceChange={ ( newInstance, newHasEditForm ) => {
							if ( newInstance ) {
								this.props.setAttributes( {
									instance: newInstance,
								} );
							}
							if ( newHasEditForm !== this.hasEditForm ) {
								this.setState( {
									hasEditForm: newHasEditForm,
								} );
							}
						} }
					/>
				) }
				{ ( isPreview || ! hasEditForm ) && this.renderWidgetPreview() }
			</>
		);
	}

	changeWidget() {
		this.switchToEdit();
		this.props.setAttributes( {
			instance: {},
			id: undefined,
			widgetClass: undefined,
		} );
		this.setState( {
			hasEditForm: true,
		} );
	}

	switchToEdit() {
		this.setState( { isPreview: false } );
	}

	switchToPreview() {
		this.setState( { isPreview: true } );
	}

	renderWidgetPreview() {
		const { widgetId, attributes } = this.props;
		return (
			<ServerSideRender
				className="wp-block-legacy-widget__preview"
				block="core/legacy-widget"
				attributes={ {
					widgetId,
					...omit( attributes, 'id' ),
				} }
			/>
		);
	}
}

export default withSelect( ( select, { clientId } ) => {
	const widgetId = select( 'core/edit-widgets' ).getWidgetIdForClientId(
		clientId
	);
	const widget = select( 'core/edit-widgets' ).getWidget( widgetId );
	const editorSettings = select( 'core/block-editor' ).getSettings();
	const {
		availableLegacyWidgets,
		hasPermissionsToManageWidgets,
	} = editorSettings;
	return {
		hasPermissionsToManageWidgets,
		availableLegacyWidgets,
		widgetId,
		prerenderedEditForm: widget ? widget.rendered_form : '',
	};
} )(
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			setWidgetId( id ) {
				dispatch( 'core/edit-widgets' ).setWidgetIdForClientId(
					clientId,
					id
				);
			},
		};
	} )( LegacyWidgetEdit )
);
