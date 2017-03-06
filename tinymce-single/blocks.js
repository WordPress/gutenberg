( function( wp ) {
	var _blocks, _controls;

	_blocks = {};
	_controls = {};

	wp.blocks = {
		registerBlock: function( settings ) {
			// Note, elements should probably only be registered by core.
			// Maybe for each block, we should offer to extend the settings (add buttons).

			if ( settings.elements ) {
				settings.elements.forEach( function( element ) {
					_blocks[ 'element:' + element ] = settings;
					_blocks[ 'element:' + element ]._id = 'element:' + element;
				} );
			} else if ( settings.namespace && settings.name ) {
				_blocks[ settings.namespace + ':' + settings.name ] = settings;
				_blocks[ settings.namespace + ':' + settings.name ]._id = settings.namespace + ':' + settings.name;
			}
		},
		registerControl: function( name, settings ) {
			_controls[ name ] = settings;
		},
		getBlockSettings: function( name ) {
			return _blocks[ name ];
		},
		getControlSettings: function( name ) {
			return _controls[ name ];
		},
		getBlockSettingsByElement: function( element ) {
			var blockType = element.getAttribute( 'data-wp-block-type' );
			var nodeName = element.nodeName.toLowerCase();

			return this.getBlockSettings( blockType || 'element:' + nodeName );
		},
		getBlocks: function() {
			return _blocks;
		},
		getControls: function() {
			return _controls;
		},
		getSelectedBlocks: function() {
			var editor = window.tinyMCE.activeEditor;
			var selection = window.getSelection();
			var startNode = editor.selection.getStart();
			var endNode = editor.selection.getEnd();
			var rootNode = editor.getBody();
			var blocks = [];

			while ( startNode.parentNode !== rootNode ) {
				startNode = startNode.parentNode;
			}

			while ( endNode.parentNode !== rootNode ) {
				endNode = endNode.parentNode;
			}

			if ( startNode.compareDocumentPosition( endNode ) & Node.DOCUMENT_POSITION_FOLLOWING ) {
				while ( startNode ) {
					blocks.push( startNode );

					if ( startNode === endNode ) {
						break;
					}

					startNode = startNode.nextSibling;
				}
			} else {
				blocks.push( startNode );
			}

			// Handle tripple click selection.
			if ( ! selection.isCollapsed && selection.focusOffset === 0 && selection.focusNode === endNode ) {
				blocks.pop();
			}

			return blocks;
		},
		getSelectedBlock: function() {
			return wp.blocks.getSelectedBlocks()[0];
		}
	};
} )( window.wp = window.wp || {} );
