window._wpCustomizeWidgetsSettings = {
	'nonce': '12cc9d3284',
	'registeredSidebars': [{
		'name': 'Widget Area',
		'id': 'sidebar-1',
		'description': 'Add widgets here to appear in your sidebar.',
		'class': '',
		'before_widget': '<aside id="%1$s" class="widget %2$s">',
		'after_widget': '</aside>',
		'before_title': '<h2 class="widget-title">',
		'after_title': '</h2>'
	}],
	'registeredWidgets': {
		'search-2': {
			'name': 'Search',
			'id': 'search-2',
			'params': [
				{
					'number': 2
				}
			],
			'classname': 'widget_search',
			'description': 'A search form for your site.'
		}
	},
	'availableWidgets': [
		{
			'name': 'Search',
			'id': 'search-2',
			'params': [
				{
					'number': 2
				}
			],
			'classname': 'widget_search',
			'description': 'A search form for your site.',
			'temp_id': 'search-__i__',
			'is_multi': true,
			'multi_number': 3,
			'is_disabled': false,
			'id_base': 'search',
			'transport': 'refresh',
			'width': 250,
			'height': 200,
			'is_wide': false
		}
	],
	'l10n': {
		'error': 'An error has occurred. Please reload the page and try again.',
		'navigatePreview': 'You can navigate to other pages on your site while using the Customizer to view and edit the widgets displayed on those pages.',
		'noAreasShown': 'Your theme has 3 widget areas, but this particular page doesn\u2019t display them.',
		'noWidgetsFound': 'No widgets found.',
		'removeBtnLabel': 'Remove',
		'removeBtnTooltip': 'Trash widget by moving it to the inactive widgets sidebar.',
		'reorderLabelOn': 'Reorder widgets',
		'reorderModeOff': 'Reorder mode closed',
		'reorderModeOn': 'Reorder mode enabled',
		'saveBtnLabel': 'Apply',
		'saveBtnTooltip': 'Save and preview changes before publishing them.',
		'someAreasShown': {
			'1': 'Your theme has 1 other widget area, but this particular page doesn\u2019t display it.',
			'2': 'Your theme has 2 other widget areas, but this particular page doesn\u2019t display them.'
		},
		'widgetMovedDown': 'Widget moved down',
		'widgetMovedUp': 'Widget moved up',
		'widgetsFound': 'Number of widgets found: %d'
	},
	'tpl': {
		'widgetReorderNav': '<div class="widget-reorder-nav"><span class="move-widget" tabindex="0">Move to another area&hellip;</span><span class="move-widget-down" tabindex="0">Move down</span><span class="move-widget-up" tabindex="0">Move up</span></div>',
		'moveWidgetArea': '<div class="move-widget-area"> <p class="description">Select an area to move this widget into:</p> <ul class="widget-area-select"> <% _.each( sidebars, function ( sidebar ){ %> <li class="" data-id="<%- sidebar.id %>" title="<%- sidebar.description %>" tabindex="0"><%- sidebar.name %></li> <% }); %> </ul> <div class="move-widget-actions"> <button class="move-widget-btn button" type="button">Move</button> </div> </div>'
	}
};

window._wpCustomizeSettings.panels.widgets = {
	'id': 'widgets',
	'description': 'Widgets are independent sections of content that can be placed into widgetized areas provided by your theme (commonly called sidebars).',
	'priority': 110,
	'type': 'widgets',
	'title': 'Widgets',
	'content': '',
	'active': true,
	'instanceNumber': 1
};

window._wpCustomizeSettings.sections['sidebar-widgets-sidebar-1'] = {
	'id': 'sidebar-widgets-sidebar-1',
	'description': 'Add widgets here to appear in your sidebar.',
	'priority': 0,
	'panel': 'widgets',
	'type': 'sidebar',
	'title': 'Widget Area',
	'content': '',
	'active': false,
	'instanceNumber': 1,
	'customizeAction': 'Customizing &#9656; Widgets',
	'sidebarId': 'sidebar-1'
};

window._wpCustomizeSettings.settings['widget_search[2]'] = {
	'value': {
		'encoded_serialized_instance': 'YToxOntzOjU6InRpdGxlIjtzOjY6IkJ1c2NhciI7fQ==',
		'title': 'Buscar',
		'is_widget_customizer_js_value': true,
		'instance_hash_key': '45f0a7f15e50bd3be86b141e2a8b3aaf'
	},
	'transport': 'refresh',
	'dirty': false
};
window._wpCustomizeSettings.settings['sidebars_widgets[sidebar-1]'] = {
	'value': [ 'search-2' ],
	'transport': 'refresh',
	'dirty': false
};

window._wpCustomizeSettings.controls['widget_search[2]'] = {
	'settings': {
		'default': 'widget_search[2]'
	},
	'type': 'widget_form',
	'priority': 0,
	'active': false,
	'section': 'sidebar-widgets-sidebar-1',
	'content': '<li id="customize-control-widget_search-2" class="customize-control customize-control-widget_form"> <\/li>',
	'label': 'Search',
	'description': '',
	'instanceNumber': 2,
	'widget_id': 'search-2',
	'widget_id_base': 'search',
	'sidebar_id': 'sidebar-1',
	'width': 250,
	'height': 200,
	'is_wide': false,
	'widget_control': '<div id="widget-15_search-2" class="widget"> <div class="widget-top"> <div class="widget-title-action"> <a class="widget-action hide-if-no-js" href="#available-widgets"><\/a> <a class="widget-control-edit hide-if-js" href="\/wp-admin\/customize.php?editwidget=search-2&#038;key=-1"> <span class="edit">Edit<\/span> <span class="add">Add<\/span> <span class="screen-reader-text">Search<\/span> <\/a> <\/div> <div class="widget-title"><h4>Search<span class="in-widget-title"><\/span><\/h4><\/div> <\/div> <div class="widget-inside"> <div class="form"> <div class="widget-content"><\/div><!-- .widget-content --> <input type="hidden" name="widget-id" class="widget-id" value="search-2" \/> <input type="hidden" name="id_base" class="id_base" value="search" \/> <input type="hidden" name="widget-width" class="widget-width" value="250" \/> <input type="hidden" name="widget-height" class="widget-height" value="200" \/> <input type="hidden" name="widget_number" class="widget_number" value="2" \/> <input type="hidden" name="multi_number" class="multi_number" value="" \/> <input type="hidden" name="add_new" class="add_new" value="" \/> <div class="widget-control-actions"> <div class="alignleft"> <a class="widget-control-remove" href="#remove">Delete<\/a> |   <a class="widget-control-close" href="#close">Close<\/a> <\/div> <div class="alignright"> <input type="submit" name="savewidget" id="widget-search-2-savewidget" class="button button-primary widget-control-save right" value="Save"  \/> <span class="spinner"><\/span> <\/div> <br class="clear" \/> <\/div> <\/div><!-- .form --> <\/div> <div class="widget-description"> A search form for your site.  <\/div> <\/div>',
	'widget_content': '<p><label for="widget-search-2-title">Title: <input class="widefat" id="widget-search-2-title" name="widget-search[2][title]" type="text" value="Buscar" \/><\/label><\/p>'
};
window._wpCustomizeSettings.controls['sidebars_widgets[sidebar-1]'] = {
	'settings': {
		'default': 'sidebars_widgets[sidebar-1]'
	},
	'type': 'sidebar_widgets',
	'priority': 99,
	'active': true,
	'section': 'sidebar-widgets-sidebar-1',
	'content': '<li id="customize-control-sidebars_widgets-sidebar-1" class="customize-control customize-control-sidebar_widgets"> <span class="button add-new-widget" tabindex="0">    Add a Widget  <\/span> <span class="reorder-toggle" tabindex="0"> <span class="reorder">Reorder<\/span> <span class="reorder-done">Done<\/span> <\/span> <\/li>',
	'label': '',
	'description': '',
	'instanceNumber': 1,
	'sidebar_id': 'sidebar-1'
};
