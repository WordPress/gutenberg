
window._wpCustomizeNavMenusSettings = {
	'nonce': 'yo',
	'phpIntMax': '2147483647',
	'settingTransport': 'postMessage',
	'allMenus': [{
		'term_id': '2',
		'name': 'Social Menu',
		'slug': 'social-menu',
		'term_group': '0',
		'term_taxonomy_id': '2',
		'taxonomy': 'nav_menu',
		'description': '',
		'parent': '0',
		'count': '0'
	}, {
		'term_id': '3',
		'name': 'Primary Menu',
		'slug': 'primary-menu',
		'term_group': '0',
		'term_taxonomy_id': '3',
		'taxonomy': 'nav_menu',
		'description': '',
		'parent': '0',
		'count': '0'
	}],
	'defaultSettingValues': {
		'nav_menu': {
			'name': '',
			'description': '',
			'parent': 0,
			'auto_add': false
		},
		'nav_menu_item': {
			'object_id': 0,
			'object': '',
			'menu_item_parent': 0,
			'position': 0,
			'type': 'custom',
			'title': '',
			'url': '',
			'target': '',
			'attr_title': '',
			'description': '',
			'classes': '',
			'xfn': '',
			'status': 'publish',
			'original_title': '',
			'nav_menu_term_id': 0
		}
	},
	'itemTypes': [
		{
			'title': 'Post',
			'type': 'post_type',
			'object': 'post'
		},
		{
			'title': 'Page',
			'type': 'post_type',
			'object': 'page'
		},
		{
			'title': 'Category',
			'type': 'taxonomy',
			'object': 'category'
		},
		{
			'title': 'Tag',
			'type': 'taxonomy',
			'object': 'post_tag'
		},
		{
			'title': 'Format',
			'type': 'taxonomy',
			'object': 'post_format'
		}
	],
	'l10n': {
		'custom_label': 'Custom Link',
		'customizingMenus': 'Customizing &#9656; Menus',
		'invalidTitleTpl': '%s (Invalid)',
		'itemAdded': 'Menu item added',
		'itemDeleted': 'Menu item deleted',
		'itemsFound': 'Number of items found: %d',
		'itemsFoundMore': 'Additional items found: %d',
		'itemsLoadingMore': 'Loading more results... please wait.',
		'menuAdded': 'Menu created',
		'menuDeleted': 'Menu deleted',
		'menuLocation': '(Currently set to: %s)',
		'menuNameLabel': 'Menu Name',
		'movedDown': 'Menu item moved down',
		'movedLeft': 'Menu item moved out of submenu',
		'movedRight': 'Menu item is now a sub-item',
		'movedUp': 'Menu item moved up',
		'pendingTitleTpl': '%s (Pending)',
		'postTypeLabel': 'Post Type',
		'reorderLabelOff': 'Close reorder mode',
		'reorderLabelOn': 'Reorder menu items',
		'reorderModeOff': 'Reorder mode closed',
		'reorderModeOn': 'Reorder mode enabled',
		'taxonomyTermLabel': 'Taxonomy',
		'unnamed': '(unnamed)',
		'untitled': '(no label)'
	},
	'locationSlugMappedToName': {
		'main-footer': 'Main Footer',
		'main-header': 'Main Header'
	}
};
window._wpCustomizeSettings.panels.nav_menus = {
	'id': 'nav_menus',
	'description': '<p>This panel is used for managing navigation menus for content you have already published on your site. You can create menus and add items for existing content such as pages, posts, categories, tags, formats, or custom links.</p><p>Menus can be displayed in locations defined by your theme or in <a href="javascript:wp.customize.panel( "widgets" ).focus();">widget areas</a> by adding a &#8220;Custom Menu&#8221; widget.</p>',
	'priority': 100,
	'type': 'nav_menus',
	'title': 'Menus',
	'content': '',
	'active': true,
	'instanceNumber': 2
};

// Nav Menu Locations
window._wpCustomizeSettings.sections.menu_locations = {
	'id': 'menu_locations',
	'description': '<p>Your theme contains 1 menu location. Select which menu you would like to use.<\/p><p>You can also place menus in widget areas with the Custom Menu widget.<\/p>',
	'priority': 5,
	'panel': 'nav_menus',
	'type': 'default',
	'title': 'Menu Locations',
	'content': '',
	'active': true,
	'instanceNumber': 13,
	'customizeAction': 'Customizing &#9656; Menus'
};
window._wpCustomizeSettings.settings['nav_menu_locations[social]'] = {
	'value': 2,
	'transport': 'postMessage',
	'dirty': false
};
window._wpCustomizeSettings.controls['nav_menu_locations[social]'] = {
	'settings': { 'default': 'nav_menu_locations[social]' },
	'type': 'nav_menu_location',
	'priority': 10,
	'active': true,
	'section': 'menu_locations',
	'content': '<li id="customize-control-nav_menu_locations-social" class="customize-control customize-control-nav_menu_location"> <label> <span class="customize-control-title">Social Links Menu</span> <select data-customize-setting-link="nav_menu_locations[social]"> <option value="0">&mdash; Select &mdash;</option><option value="59">Prim</option><option value="60" selected="selected">Social</option><option value="61">test11</option><option value="62">test222</option><option value="63">test333</option> </select> </label> </li>',
	'label': 'Social Links Menu',
	'description': '',
	'instanceNumber': 40,
	'locationId': 'social'
};
window._wpCustomizeSettings.settings['nav_menu_locations[primary]'] = {
	'value': 3,
	'transport': 'postMessage',
	'dirty': false
};
window._wpCustomizeSettings.controls['nav_menu_locations[primary]'] = {
	'active': true,
	'content': '<li id="customize-control-nav_menu_locations-primary" class="customize-control customize-control-nav_menu_location"> <label> <span class="customize-control-title">Primary Menu</span> <select data-customize-setting-link="nav_menu_locations[primary]"> <option value="0">&mdash; Select &mdash;</option><option value="59" selected="selected">Prim</option><option value="60">Social</option><option value="61">test11</option><option value="62">test222</option><option value="63">test333</option> </select> </label> </li>',
	'description': '',
	'instanceNumber': 39,
	'label': 'Primary Menu',
	'locationId': 'primary',
	'priority': 10,
	'section': 'menu_locations',
	'settings': {
		'default': 'nav_menu_locations[primary]'
	},
	'type': 'nav_menu_location'
};

// Nav Menus
window._wpCustomizeSettings.sections['nav_menu[3]'] = {
	'id': 'nav_menu[3]',
	'description': '',
	'priority': 10,
	'panel': 'nav_menus',
	'type': 'nav_menu',
	'title': 'Primary Menu',
	'content': '',
	'active': true,
	'instanceNumber': 15,
	'customizeAction': 'Customizing &#9656; Menus',
	'menu_id': 3
};
window._wpCustomizeSettings.settings['nav_menu[3]'] = {
	'value': {
		'name': 'Primary menu',
		'description': '',
		'parent': 0,
		'auto_add': false
	},
	'transport': 'postMessage',
	'dirty': false
};

window._wpCustomizeSettings.sections['nav_menu[2]'] = {
	'id': 'nav_menu[2]',
	'description': '',
	'priority': 10,
	'panel': 'nav_menus',
	'type': 'nav_menu',
	'title': 'Social menu',
	'content': '',
	'active': true,
	'instanceNumber': 14,
	'customizeAction': 'Customizing &#9656; Menus',
	'menu_id': 2
};
window._wpCustomizeSettings.settings['nav_menu[2]'] = {
	'value': {
		'name': 'Social menu',
		'description': '',
		'parent': 0,
		'auto_add': false
	},
	'transport': 'postMessage',
	'dirty': false
};

// Menu items
window._wpCustomizeSettings.settings['nav_menu_item[2000]'] = {
	'dirty': false,
	'transport': 'postMessage',
	'value': {
		'attr_title': '',
		'classes': [
			''
		],
		'description': '',
		'menu_item_parent': 0,
		'nav_menu_term_id': 3,
		'object': 'page',
		'object_id': 2,
		'original_title': 'Sample Page',
		'position': 1,
		'status': 'publish',
		'target': '',
		'title': 'Sample Page',
		'type': 'post_type',
		'type_label': 'Page',
		'url': 'http://src.wordpress-develop.dev/sample-page/',
		'xfn': ''
	}
};
window._wpCustomizeSettings.controls['nav_menu_item[2000]'] = {
	'active': true,
	'attr_title': '',
	'classes': '',
	'content': '<li id="customize-control-nav_menu_item-2000" class="customize-control customize-control-nav_menu_item"> </li>',
	'depth': 0,
	'description': '',
	'el_classes': 'menu-item menu-item-depth-0 menu-item-page menu-item-edit-inactive',
	'instanceNumber': 42,
	'item_type': 'post_type',
	'item_type_label': 'Page',
	'label': 'Sample Page',
	'menu_item_id': 2000,
	'original_title': 'Sample Page',
	'parent': 0,
	'priority': 1,
	'section': 'nav_menu[3]',
	'settings': {
		'default': 'nav_menu_item[2000]'
	},
	'target': '',
	'title': 'Sample Page',
	'type': 'nav_menu_item',
	'url': 'http://src.wordpress-develop.dev/sample-page/',
	'xfn': ''
};

window._wpCustomizeSettings.settings['nav_menu_item[2001]'] = {
	'dirty': false,
	'transport': 'postMessage',
	'value': {
		'attr_title': '',
		'classes': [
			''
		],
		'description': '',
		'menu_item_parent': 0,
		'nav_menu_term_id': 3,
		'object': 'custom',
		'object_id': 2001,
		'original_title': '',
		'position': 2,
		'status': 'publish',
		'target': '',
		'title': 'Example',
		'type': 'custom',
		'type_label': 'Custom Link',
		'url': 'http://example.com/',
		'xfn': ''
	}
};
window._wpCustomizeSettings.controls['nav_menu_item[2001]'] = {
	'active': true,
	'attr_title': '',
	'classes': '',
	'content': '<li id="customize-control-nav_menu_item-2001" class="customize-control customize-control-nav_menu_item"> </li>',
	'depth': 0,
	'description': '',
	'el_classes': 'menu-item menu-item-depth-0 menu-item-custom menu-item-edit-inactive',
	'instanceNumber': 46,
	'item_type': 'custom',
	'item_type_label': 'Custom Link',
	'label': 'Example',
	'menu_item_id': 2001,
	'original_title': '',
	'parent': 0,
	'priority': 2,
	'section': 'nav_menu[3]',
	'settings': {
		'default': 'nav_menu_item[2001]'
	},
	'target': '',
	'title': 'Example',
	'type': 'nav_menu_item',
	'url': 'http://example.com/',
	'xfn': ''
};

window._wpCustomizeSettings.settings['nav_menu_item[2002]'] = {
	'dirty': false,
	'transport': 'postMessage',
	'value': {
		'attr_title': '',
		'classes': '',
		'description': '',
		'menu_item_parent': 2001,
		'nav_menu_term_id': 3,
		'object': '',
		'object_id': 0,
		'original_title': 'Sub-Example',
		'position': 3,
		'status': 'publish',
		'target': '',
		'title': 'Example',
		'type': 'custom',
		'type_label': 'Custom Link',
		'url': 'http://sub.example.com/',
		'xfn': ''
	}
};
window._wpCustomizeSettings.controls['nav_menu_item[2002]'] = {
	'active': true,
	'attr_title': '',
	'classes': '',
	'content': '<li id="customize-control-nav_menu_item-2002" class="customize-control customize-control-nav_menu_item"> </li>',
	'depth': 0,
	'description': '',
	'el_classes': 'menu-item menu-item-depth-0 menu-item-custom menu-item-edit-inactive',
	'instanceNumber': 46,
	'item_type': 'custom',
	'item_type_label': 'Custom Link',
	'label': 'Sub-Example',
	'menu_item_id': 2001,
	'original_title': '',
	'parent': 2001,
	'priority': 3,
	'section': 'nav_menu[3]',
	'settings': {
		'default': 'nav_menu_item[2002]'
	},
	'target': '',
	'title': 'Sub-Example',
	'type': 'nav_menu_item',
	'url': 'http://sub.example.com/',
	'xfn': ''
};

// Meta controls
window._wpCustomizeSettings.sections.add_menu = {
	'id': 'add_menu',
	'description': '',
	'priority': 999,
	'panel': 'nav_menus',
	'type': 'new_menu',
	'title': 'Add a Menu',
	'content': '<li id="accordion-section-add_menu" class="accordion-section-new-menu">\n\t\t\t<button type="button" class="button add-new-menu-item add-menu-toggle" aria-expanded="false">\n\t\t\t\tAdd a Menu\t\t\t<\/button>\n\t\t\t<ul class="new-menu-section-content"><\/ul>\n\t\t<\/li>',
	'active': true,
	'instanceNumber': 16,
	'customizeAction': 'Customizing &#9656; Menus'
};
window._wpCustomizeSettings.controls.new_menu_name = {
	'settings': { 'default': 'new_menu_name' },
	'type': 'text',
	'priority': 10,
	'active': true,
	'section': 'add_menu',
	'content': '<li id="customize-control-new_menu_name" class="customize-control customize-control-text"> <label> <input type="text" class="menu-name-field" placeholder="New menu name"  value="" data-customize-setting-link="new_menu_name" /> </label> </li>',
	'label': '',
	'description': '',
	'instanceNumber': 46
};

// From nav-menu.js
window.wpNavMenu = {
	'options': {
		'menuItemDepthPerLevel': 30,
		'globalMaxDepth': 11,
		'sortableItems': '> *',
		'targetTolerance': 0
	},
	'menusChanged': false,
	'isRTL': false,
	'negateIfRTL': 1
};
