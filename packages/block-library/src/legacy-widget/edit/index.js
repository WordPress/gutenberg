/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	Button,
	IconButton,
	PanelBody,
	Toolbar,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

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
			setAttributes,
		} = this.props;
		const { isPreview, hasEditForm } = this.state;
		const { widgetId, widgetClass } = attributes;
		const widgetObject =
			( widgetId && availableLegacyWidgets[ widgetId ] ) ||
			( widgetClass && availableLegacyWidgets[ widgetClass ] );
		if ( ! widgetId && ! widgetClass ) {
			return (
				<LegacyWidgetPlaceholder
					availableLegacyWidgets={ availableLegacyWidgets }
					currentWidget={ widgetId }
					hasPermissionsToManageWidgets={ hasPermissionsToManageWidgets }
					onChangeWidget={ ( newWidget ) => {
						const { isReferenceWidget } = availableLegacyWidgets[ newWidget ];
						setAttributes( {
							instance: {},
							widgetId: isReferenceWidget ? newWidget : undefined,
							widgetClass: isReferenceWidget ? undefined : newWidget,
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
					<Toolbar>
						{ ( widgetObject && ! widgetObject.isHidden ) && (
							<IconButton
								onClick={ this.changeWidget }
								label={ __( 'Change widget' ) }
								icon="update"
							/>
						) }
						{ hasEditForm && (
							<>
								<Button
									className={ `components-tab-button ${ ! isPreview ? 'is-active' : '' }` }
									onClick={ this.switchToEdit }
								>
									<span>{ __( 'Edit' ) }</span>
								</Button>
								<Button
									className={ `components-tab-button ${ isPreview ? 'is-active' : '' }` }
									onClick={ this.switchToPreview }
								>
									<span>{ __( 'Preview' ) }</span>
								</Button>
							</>
						) }
					</Toolbar>
				</BlockControls>
				{ inspectorControls }
				{ hasEditForm && (
					<LegacyWidgetEditHandler
						isSelected={ isSelected }
						isVisible={ ! isPreview }
						widgetId={ attributes.widgetId }
						idBase={ attributes.idBase || attributes.widgetId }
						widgetNumber={ attributes.widgetNumber }
						widgetName={ get( widgetObject, [ 'name' ] ) }
						widgetClass={ attributes.widgetClass }
						instance={ attributes.instance }
						onInstanceChange={
							( newInstance, newHasEditForm ) => {
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
							}
						}
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
			widgetId: undefined,
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
		const { attributes } = this.props;
		return (
			<ServerSideRender
				className="wp-block-legacy-widget__preview"
				block="core/legacy-widget"
				attributes={ attributes }
			/>
		);
	}
}

export default withSelect( ( select ) => {
	const editorSettings = select( 'core/block-editor' ).getSettings();
	const {
		availableLegacyWidgets,
		hasPermissionsToManageWidgets,
	} = editorSettings;
	return {
		hasPermissionsToManageWidgets,
		availableLegacyWidgets,
	};
} )( LegacyWidgetEdit );
