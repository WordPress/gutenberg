/**
 * Internal dependencies
 */
import { settingIdToWidgetId } from '../../utils';

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

/**
 * This is a custom debounce function to call different callbacks depending on
 * whether it's the _leading_ call or not.
 *
 * @param {Function} leading  The callback that gets called first.
 * @param {Function} callback The callback that gets called after the first time.
 * @param {number}   timeout  The debounced time in milliseconds.
 * @return {Function} The debounced function.
 */
function debounce( leading, callback, timeout ) {
	let isLeading = false;
	let timerID;

	function debounced( ...args ) {
		const result = ( isLeading ? callback : leading ).apply( this, args );

		isLeading = true;

		clearTimeout( timerID );

		timerID = setTimeout( () => {
			isLeading = false;
		}, timeout );

		return result;
	}

	debounced.cancel = () => {
		isLeading = false;
		clearTimeout( timerID );
	};

	return debounced;
}

export default class SidebarAdapter {
	constructor( setting, api ) {
		this.setting = setting;
		this.api = api;

		this.locked = false;
		this.widgetsCache = new WeakMap();
		this.subscribers = new Set();

		this.history = [
			this._getWidgetIds().map( ( widgetId ) =>
				this.getWidget( widgetId )
			),
		];
		this.historyIndex = 0;
		this.historySubscribers = new Set();
		// Debounce the input for 1 second.
		this._debounceSetHistory = debounce(
			this._pushHistory,
			this._replaceHistory,
			1000
		);

		this.setting.bind( this._handleSettingChange.bind( this ) );
		this.api.bind( 'change', this._handleAllSettingsChange.bind( this ) );

		this.undo = this.undo.bind( this );
		this.redo = this.redo.bind( this );
		this.save = this.save.bind( this );
	}

	subscribe( callback ) {
		this.subscribers.add( callback );

		return () => {
			this.subscribers.delete( callback );
		};
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

		this.historySubscribers.forEach( ( listener ) => listener() );
	}

	_replaceHistory() {
		this.history[
			this.historyIndex
		] = this._getWidgetIds().map( ( widgetId ) =>
			this.getWidget( widgetId )
		);
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
		const setting = this.api.create(
			settingId,
			settingId,
			'',
			settingArgs
		);
		setting.set( widget.instance );

		const widgetId = settingIdToWidgetId( settingId );

		return widgetId;
	}

	_removeWidget( widget ) {
		const settingId = widgetIdToSettingId( widget.id );
		const setting = this.api( settingId );

		if ( setting ) {
			const instance = setting.get();
			this.widgetsCache.delete( instance );
		}

		this.api.remove( settingId );
	}

	_updateWidget( widget ) {
		const prevWidget = this.getWidget( widget.id );

		// Bail out update if nothing changed.
		if ( prevWidget === widget ) {
			return widget.id;
		}

		// Update existing setting if only the widget's instance changed.
		if (
			prevWidget.idBase &&
			widget.idBase &&
			prevWidget.idBase === widget.idBase
		) {
			const settingId = widgetIdToSettingId( widget.id );
			this.api( settingId ).set( widget.instance );
			return widget.id;
		}

		// Otherwise delete and re-create.
		this._removeWidget( widget );
		return this._createWidget( widget );
	}

	getWidget( widgetId ) {
		if ( ! widgetId ) {
			return null;
		}

		const { idBase, number } = parseWidgetId( widgetId );
		const settingId = widgetIdToSettingId( widgetId );
		const setting = this.api( settingId );

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

		const deletedWidgets = this.getWidgets().filter(
			( widget ) => ! nextWidgetIds.includes( widget.id )
		);
		deletedWidgets.forEach( ( widget ) => this._removeWidget( widget ) );

		this.setting.set( nextWidgetIds );

		this.locked = false;

		return addedWidgetIds;
	}

	setWidgets( nextWidgets ) {
		const addedWidgetIds = this._updateWidgets( nextWidgets );

		this._debounceSetHistory();

		return addedWidgetIds;
	}

	/**
	 * Undo/Redo related features
	 */
	hasUndo() {
		return this.historyIndex > 0;
	}

	hasRedo() {
		return this.historyIndex < this.history.length - 1;
	}

	_seek( historyIndex ) {
		const currentWidgets = this.getWidgets();

		this.historyIndex = historyIndex;

		const widgets = this.history[ this.historyIndex ];

		this._updateWidgets( widgets );

		this._emit( currentWidgets, this.getWidgets() );

		this.historySubscribers.forEach( ( listener ) => listener() );
		this._debounceSetHistory.cancel();
	}

	undo() {
		if ( ! this.hasUndo() ) {
			return;
		}

		this._seek( this.historyIndex - 1 );
	}

	redo() {
		if ( ! this.hasRedo() ) {
			return;
		}

		this._seek( this.historyIndex + 1 );
	}

	subscribeHistory( listener ) {
		this.historySubscribers.add( listener );

		return () => {
			this.historySubscribers.delete( listener );
		};
	}

	save() {
		this.api.previewer.save();
	}
}
