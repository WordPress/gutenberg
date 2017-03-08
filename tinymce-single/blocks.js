( function( wp ) {
	var _blocks, _controls;

	_blocks = {};
	_controls = {};

	var _elementMap = {};

	wp.blocks = {
		registerBlock: function( settings ) {
			// Note, elements should probably only be registered by core.
			// Maybe for each block, we should offer to extend the settings (add buttons).

			var namespace = settings.namespace || 'elements';
			var id = namespace + ':' + settings.name;

			_blocks[ id ] = settings;
			_blocks[ id ]._id = id;

			if ( settings.elements ) {
				settings.elements.forEach( function( element ) {
					_elementMap[ element ] = id;
				} );
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
			var id = element.getAttribute( 'data-wp-block-type' );

			if ( ! id ) {
				id = _elementMap[ element.nodeName.toLowerCase() ];
			}

			return this.getBlockSettings( id );
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
