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

		this.locked = false;
		this.widgetsCache = new WeakMap();
		this.subscribers = new Set();

		this.history = [
			this._getWidgetIds().map( ( widgetId ) =>
				this.getWidget( widgetId )
			),
		];
		this.historyIndex = 0;

		this._handleSettingChange = this._handleSettingChange.bind( this );
		this._handleAllSettingsChange = this._handleAllSettingsChange.bind(
			this
		);
		this.canUndo = this.canUndo.bind( this );
		this.canRedo = this.canRedo.bind( this );
		this.undo = this.undo.bind( this );
		this.redo = this.redo.bind( this );
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

	getWidgets() {
		return this.history[ this.historyIndex ];
	}

	_emit( ...args ) {
		for ( const callback of this.subscribers ) {
			callback( ...args );
		}
	}

	_getWidgetIds() {
		return this.setting.get();
	}

	_pushHistory() {
		this.history = [
			...this.history.slice( 0, this.historyIndex + 1 ),
			this._getWidgetIds().map( ( widgetId ) =>
				this.getWidget( widgetId )
			),
		];
		this.historyIndex += 1;
	}

	_handleSettingChange() {
		if ( this.locked ) {
			return;
		}

		const prevWidgets = this.getWidgets();

		this._pushHistory();

		this._emit( prevWidgets, this.getWidgets() );
	}

	_handleAllSettingsChange( setting ) {
		if ( this.locked ) {
			return;
		}

		if ( ! setting.id.startsWith( 'widget_' ) ) {
			return;
		}

		const widgetId = settingIdToWidgetId( setting.id );
		if ( ! this.setting.get().includes( widgetId ) ) {
			return;
		}

		const prevWidgets = this.getWidgets();

		this._pushHistory();

		this._emit( prevWidgets, this.getWidgets() );
	}

	_createWidget( widget ) {
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
		setting.set( widget.instance );

		const widgetId = settingIdToWidgetId( settingId );

		return widgetId;
	}

	_updateWidget( widget ) {
		const prevWidget = this.getWidget( widget.id );

		// Bail out update.
		if ( prevWidget === widget ) {
			return widget.id;
		}

		const settingId = widgetIdToSettingId( widget.id );
		this.allSettings( settingId ).set( widget.instance );
		// TODO: what about the other stuff?

		return widget.id;
	}

	getWidget( widgetId ) {
		if ( ! widgetId ) {
			return null;
		}

		const { idBase, number } = parseWidgetId( widgetId );
		const settingId = widgetIdToSettingId( widgetId );
		const setting = this.allSettings( settingId );

		if ( ! setting ) {
			return null;
		}

		const instance = setting.get();

		if ( this.widgetsCache.has( instance ) ) {
			return this.widgetsCache.get( instance );
		}

		const widget = {
			id: widgetId,
			idBase,
			number,
			instance,
		};

		this.widgetsCache.set( instance, widget );

		return widget;
	}

	_updateWidgets( nextWidgets ) {
		this.locked = true;

		const addedWidgetIds = [];

		const nextWidgetIds = nextWidgets.map( ( nextWidget ) => {
			if ( nextWidget.id && this.getWidget( nextWidget.id ) ) {
				addedWidgetIds.push( null );

				return this._updateWidget( nextWidget );
			}

			const widgetId = this._createWidget( nextWidget );

			addedWidgetIds.push( widgetId );

			return widgetId;
		} );

		// TODO: We should in theory also handle delete widgets here too.

		this.setting.set( nextWidgetIds );

		this.locked = false;

		return addedWidgetIds;
	}

	setWidgets( nextWidgets ) {
		const addedWidgetIds = this._updateWidgets( nextWidgets );

		this._pushHistory();

		return addedWidgetIds;
	}

	/**
	 * Undo/Redo related features
	 */
	canUndo() {
		return this.historyIndex > 0;
	}

	canRedo() {
		return this.historyIndex < this.history.length - 1;
	}

	_seek( historyIndex ) {
		const currentWidgets = this.getWidgets();

		this.historyIndex = historyIndex;

		const widgets = this.history[ this.historyIndex ];

		this._updateWidgets( widgets );

		this._emit( currentWidgets, this.getWidgets() );
	}

	undo() {
		if ( ! this.canUndo() ) {
			return;
		}

		this._seek( this.historyIndex - 1 );
	}

	redo() {
		if ( ! this.canRedo() ) {
			return;
		}

		this._seek( this.historyIndex + 1 );
	}
}
