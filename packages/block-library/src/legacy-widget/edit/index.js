/**
 * External dependencies
 */
import {
	map,
	pickBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	Button,
	IconButton,
	PanelBody,
	Placeholder,
	SelectControl,
	Toolbar,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
} from '@wordpress/block-editor';
import { ServerSideRender } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import LegacyWidgetEditHandler from './handler';

class LegacyWidgetEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
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
			setAttributes,
		} = this.props;
		const visibleLegacyWidgets = pickBy(
			availableLegacyWidgets,
			( { isHidden } ) => ! isHidden
		);
		const { isPreview } = this.state;
		const { identifier, isCallbackWidget } = attributes;
		const widgetObject = identifier && availableLegacyWidgets[ identifier ];
		if ( ! widgetObject ) {
			let placeholderContent;

			if ( ! hasPermissionsToManageWidgets ) {
				placeholderContent = __( 'You don\'t have permissions to use widgets on this site.' );
			} else if ( visibleLegacyWidgets.length === 0 ) {
				placeholderContent = __( 'There are no widgets available.' );
			} else {
				placeholderContent = (
					<SelectControl
						label={ __( 'Select a legacy widget to display:' ) }
						value={ identifier || 'none' }
						onChange={ ( value ) => setAttributes( {
							instance: {},
							identifier: value,
							isCallbackWidget: availableLegacyWidgets[ value ].isCallbackWidget,
						} ) }
						options={ [ { value: 'none', label: 'Select widget' } ].concat(
							map( visibleLegacyWidgets, ( widget, key ) => {
								return {
									value: key,
									label: widget.name,
								};
							} )
						) }
					/>
				);
			}

			return (
				<Placeholder
					icon={ <BlockIcon icon="admin-customizer" /> }
					label={ __( 'Legacy Widget' ) }
				>
					{ placeholderContent }
				</Placeholder>
			);
		}

		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ widgetObject.name }>
					{ widgetObject.description }
				</PanelBody>
			</InspectorControls>
		);
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
						<IconButton
							onClick={ this.changeWidget }
							label={ __( 'Change widget' ) }
							icon="update"
						>
						</IconButton>
						{ ! isCallbackWidget && (
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
				{ ! isCallbackWidget && (
					<LegacyWidgetEditHandler
						isVisible={ ! isPreview }
						identifier={ attributes.identifier }
						instance={ attributes.instance }
						onInstanceChange={
							( newInstance ) => {
								this.props.setAttributes( {
									instance: newInstance,
								} );
							}
						}
					/>
				) }
				{ ( isPreview || isCallbackWidget ) && this.renderWidgetPreview() }
			</>
		);
	}

	changeWidget() {
		this.switchToEdit();
		this.props.setAttributes( {
			instance: {},
			identifier: undefined,
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
