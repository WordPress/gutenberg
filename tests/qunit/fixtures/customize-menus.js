window._wpCustomizeNavMenusSettings = {
	'nonce': 'yo',
	'phpIntMax': '2147483647',
	'menuItemTransport': 'postMessage',
	'allMenus': [{
		'term_id': '2',
		'name': 'Awesome menu',
		'slug': 'awesome-menu',
		'term_group': '0',
		'term_taxonomy_id': '2',
		'taxonomy': 'nav_menu',
		'description': '',
		'parent': '0',
		'count': '0'
	}, {
		'term_id': '3',
		'name': 'Cool Menu',
		'slug': 'cool-menu',
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
	'itemTypes': {
		'postTypes': {
			'page': {
				'label': 'Page'
			},
			'post': {
				'label': 'Post'
			}
		},
		'taxonomies': {
			'post_tag': {
				'label': 'Tag'
			},
			'post_format': {
				'label': 'Format'
			},
			'category': {
				'label': 'Category'
			}
		}
	},
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

