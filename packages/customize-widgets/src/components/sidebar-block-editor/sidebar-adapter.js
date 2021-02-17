/**
 * External dependencies
 */
import { difference, isEqual, without } from 'lodash';

const { wp } = window;

function parseWidgetId( widgetId ) {
	const matches = widgetId.match( /^(.+)-(\d+)$/ );
	if ( matches ) {
		return {
			idBase: matches[ 1 ],
			number: parseInt( matches[ 2 ], 10 ),
		};
	}

	// Likely an old single widget.
	return { idBase: widgetId };
}

function widgetIdToSettingId( widgetId ) {
	const { idBase, number } = parseWidgetId( widgetId );
	if ( number ) {
		return `widget_${ idBase }[${ number }]`;
	}

	return `widget_${ idBase }`;
}

function parseSettingId( settingId ) {
	const matches = settingId.match( /^widget_(.+)(?:\[(\d+)\])$/ );
	if ( matches ) {
		return {
			idBase: matches[ 1 ],
			number: parseInt( matches[ 2 ], 10 ),
		};
	}

	return { idBase: settingId };
}

function settingIdToWidgetId( settingId ) {
	const { idBase, number } = parseSettingId( settingId );
	if ( number ) {
		return `${ idBase }-${ number }`;
	}

	return idBase;
}

export default class SidebarAdapter {
	constructor( setting, allSettings ) {
		this.setting = setting;
		this.allSettings = allSettings;

		this.subscribers = new Set();

		this._handleSettingChange = this._handleSettingChange.bind( this );
		this._handleAllSettingsChange = this._handleAllSettingsChange.bind(
			this
		);
	}

	subscribe( callback ) {
		if ( ! this.subscribers.size ) {
			this.setting.bind( this._handleSettingChange );
			this.allSettings.bind( 'change', this._handleAllSettingsChange );
		}

		this.subscribers.add( callback );
	}

	unsubscribe( callback ) {
		this.subscribers.delete( callback );

		if ( ! this.subscribers.size ) {
			this.setting.unbind( this._handleSettingChange );
			this.allSettings.unbind( 'change', this._handleAllSettingsChange );
		}
	}

	trigger( event ) {
		for ( const callback of this.subscribers ) {
			callback( event );
		}
	}

	_handleSettingChange( newWidgetIds, oldWidgetIds ) {
		const addedWidgetIds = difference( newWidgetIds, oldWidgetIds );
		const removedWidgetIds = difference( oldWidgetIds, newWidgetIds );

		for ( const widgetId of addedWidgetIds ) {
			this.trigger( { type: 'widgetAdded', widgetId } );
		}

		for ( const widgetId of addedWidgetIds ) {
			this.trigger( { type: 'widgetRemoved', widgetId } );
		}

		if ( ! isEqual( addedWidgetIds, removedWidgetIds ) ) {
			this.trigger( { type: 'widgetsReordered', newWidgetIds } );
		}
	}

	_handleAllSettingsChange( setting ) {
		if ( ! setting.id.startsWith( 'widget_' ) ) {
			return;
		}

		const widgetId = settingIdToWidgetId( setting.id );
		if ( ! this.setting.get().includes( widgetId ) ) {
			return;
		}

		this.trigger( { type: 'widgetChanged', widgetId } );
	}

	getWidgetIds() {
		return this.setting.get();
	}

	setWidgetIds( widgetIds ) {
		this.setting.set( widgetIds );
	}

	getWidget( widgetId ) {
		const { idBase, number } = parseWidgetId( widgetId );
		const settingId = widgetIdToSettingId( widgetId );
		const instance = this.allSettings( settingId ).get();
		return {
			id: widgetId,
			idBase,
			number,
			instance,
		};
	}

	addWidget( widget ) {
		const widgetModel = wp.customize.Widgets.availableWidgets.findWhere( {
			id_base: widget.idBase,
		} );

		let number = widget.number;
		if ( widgetModel.get( 'is_multi' ) && ! number ) {
			widgetModel.set(
				'multi_number',
				widgetModel.get( 'multi_number' ) + 1
			);
			number = widgetModel.get( 'multi_number' );
		}

		const settingId = number
			? `widget_${ widget.idBase }[${ number }]`
			: `widget_${ widget.idBase }`;

		const settingArgs = {
			transport: wp.customize.Widgets.data.selectiveRefreshableWidgets[
				widgetModel.get( 'id_base' )
			]
				? 'postMessage'
				: 'refresh',
			previewer: this.setting.previewer,
		};
		const setting = this.allSettings.create(
			settingId,
			settingId,
			'',
			settingArgs
		);
		setting.set( {} );

		const widgetIds = this.setting.get();
		const widgetId = settingIdToWidgetId( settingId );
		this.setting.set( [ ...widgetIds, widgetId ] );

		return widgetId;
	}

	updateWidget( widget ) {
		const settingId = widgetIdToSettingId( widget.id );
		this.allSettings( settingId ).set( widget.instance );
		// TODO: what about the other stuff?
	}

	removeWidget( widgetId ) {
		const widgetIds = this.setting.get();
		this.setting.set( without( widgetIds, widgetId ) );
	}
}
