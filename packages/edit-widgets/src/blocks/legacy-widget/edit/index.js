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
import { withSelect } from '@wordpress/data';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { update } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import LegacyWidgetEditHandler from './handler';
import LegacyWidgetPlaceholder from './placeholder';
import WidgetPreview from './widget-preview';

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
			widgetId,
			WPWidget,
		} = this.props;
		const { isPreview, hasEditForm } = this.state;
		if ( ! WPWidget ) {
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
							setAttributes( {
								instance: {},
								idBase,
								referenceWidgetName: newWidget,
								widgetClass: undefined,
							} );
						} else {
							setAttributes( {
								instance: {},
								idBase,
								referenceWidgetName: undefined,
								widgetClass: newWidget,
							} );
						}
					} }
				/>
			);
		}

		const inspectorControls = WPWidget ? (
			<InspectorControls>
				<PanelBody title={ WPWidget.name }>
					{ WPWidget.description }
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
						{ WPWidget && ! WPWidget.isHidden && (
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
						widgetName={ get( WPWidget, [ 'name' ] ) }
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
				{ ( isPreview || ! hasEditForm ) &&
					( WPWidget?.isReferenceWidget
						? this.renderWidgetPreviewUnavailable()
						: this.renderWidgetPreview() ) }
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
		const { attributes, widgetAreaId } = this.props;
		return (
			<WidgetPreview
				className="wp-block-legacy-widget__preview"
				widgetAreaId={ widgetAreaId }
				attributes={ omit( attributes, 'widgetId' ) }
			/>
		);
	}

	renderWidgetPreviewUnavailable() {
		return <p>{ __( 'Reference widgets cannot be previewed.' ) }</p>;
	}
}

export default withSelect(
	(
		select,
		{ clientId, attributes: { widgetClass, referenceWidgetName } }
	) => {
		let widgetId = select( 'core/edit-widgets' ).getWidgetIdForClientId(
			clientId
		);
		const widget = select( 'core/edit-widgets' ).getWidget( widgetId );
		const widgetArea = select(
			'core/edit-widgets'
		).getWidgetAreaForClientId( clientId );
		const editorSettings = select( 'core/block-editor' ).getSettings();
		const {
			availableLegacyWidgets,
			hasPermissionsToManageWidgets,
		} = editorSettings;

		let WPWidget;
		if ( widgetId && availableLegacyWidgets[ widgetId ] ) {
			WPWidget = availableLegacyWidgets[ widgetId ];
		} else if ( widgetClass && availableLegacyWidgets[ widgetClass ] ) {
			WPWidget = availableLegacyWidgets[ widgetClass ];
		} else if ( referenceWidgetName ) {
			WPWidget = availableLegacyWidgets[ referenceWidgetName ];
			widgetId = referenceWidgetName;
		}

		return {
			hasPermissionsToManageWidgets,
			availableLegacyWidgets,
			widgetId,
			widgetAreaId: widgetArea?.id,
			WPWidget,
			prerenderedEditForm: widget ? widget.rendered_form : '',
		};
	}
)( LegacyWidgetEdit );
