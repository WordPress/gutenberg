/**
 * External dependencies
 */
import { get, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
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

function LegacyWidgetEdit( {
	attributes,
	availableLegacyWidgets,
	hasPermissionsToManageWidgets,
	prerenderedEditForm,
	setAttributes,
	widgetId,
	WPWidget,
	widgetAreaId,
} ) {
	const [ hasEditForm, setHasEditForm ] = useState( true );
	const [ isPreview, setIsPreview ] = useState( false );
	const shouldHidePreview = ! isPreview && hasEditForm;

	function changeWidget() {
		switchToEdit();

		setAttributes( {
			instance: {},
			id: undefined,
			widgetClass: undefined,
		} );
		setHasEditForm( true );
	}

	function switchToEdit() {
		setIsPreview( false );
	}

	function switchToPreview() {
		setIsPreview( true );
	}

	if ( ! WPWidget ) {
		return (
			<LegacyWidgetPlaceholder
				availableLegacyWidgets={ availableLegacyWidgets }
				hasPermissionsToManageWidgets={ hasPermissionsToManageWidgets }
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
				<WidgetPreview
					className="wp-block-legacy-widget__preview"
					widgetAreaId={ widgetAreaId }
					attributes={ omit( attributes, 'widgetId' ) }
				/>
			</>
		);
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ WPWidget && ! WPWidget.isHidden && (
						<Button
							onClick={ changeWidget }
							label={ __( 'Change widget' ) }
							icon={ update }
						/>
					) }
					{ hasEditForm && (
						<>
							<Button
								className="components-tab-button"
								isPressed={ ! isPreview }
								onClick={ switchToEdit }
							>
								<span>{ __( 'Edit' ) }</span>
							</Button>
							<Button
								className="components-tab-button"
								isPressed={ isPreview }
								onClick={ switchToPreview }
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
							setAttributes( {
								instance: formData,
							} );
						}
					} }
					onInstanceChange={ ( newInstance, newHasEditForm ) => {
						if ( newInstance ) {
							setAttributes( {
								instance: newInstance,
							} );
						}
						setHasEditForm( newHasEditForm );
					} }
				/>
			) }
			{ WPWidget?.isReferenceWidget ? (
				<p hidden={ shouldHidePreview }>
					{ __( 'Reference widgets cannot be previewed.' ) }
				</p>
			) : (
				<WidgetPreview
					hidden={ shouldHidePreview }
					className="wp-block-legacy-widget__preview"
					widgetAreaId={ widgetAreaId }
					attributes={ omit( attributes, 'widgetId' ) }
				/>
			) }
		</>
	);
}

export default withSelect( ( select, { clientId, attributes } ) => {
	const { widgetClass, referenceWidgetName } = attributes;
	let widgetId = select( 'core/edit-widgets' ).getWidgetIdForClientId(
		clientId
	);
	const widget = select( 'core/edit-widgets' ).getWidget( widgetId );
	const widgetArea = select( 'core/edit-widgets' ).getWidgetAreaForClientId(
		clientId
	);
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
} )( LegacyWidgetEdit );
