( function( wp ) {
	var _blocks, _controls;

	_blocks = {};
	_controls = {};

	var _elementMap = {};

	wp.blocks = {
		registerBlock: function( settings ) {
			// Note, elements should probably only be registered by core.
			// Maybe for each block, we should offer to extend the settings (add buttons).

			var namespace = settings.namespace;
			var id = namespace + ':' + settings.name;

			_blocks[ id ] = settings;
			_blocks[ id ]._id = id;

			if ( settings.elements ) {
				settings.elements.forEach( function( element ) {
					_elementMap[ element ] = id;
				} );
			}
		},
		getType: function( name ) {
			var settings = [];
			var key;

			for ( key in _blocks ) {
				if ( _blocks[ key ].type === name ) {
					settings.push( _blocks[ key ] );
				}
			}

			return settings;
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

			if ( ! id || ! this.getBlockSettings( id ) ) {
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
		getParentBlock: function( node ) {
			var editor = window.tinyMCE.activeEditor;
			var rootNode = editor.getBody();

			if ( node === rootNode || ! editor.getBody().contains( node ) ) {
				return null;
			}

			while ( node.parentNode !== rootNode ) {
				node = node.parentNode;
			}

			return node;
		},
		getSelectedBlocks: function() {
			var editor = window.tinyMCE.activeEditor;
			var selection = window.getSelection();
			var startNode = editor.selection.getStart();
			var endNode = editor.selection.getEnd();
			var rootNode = editor.getBody();
			var blocks = [];

			if ( ! startNode || ! editor.getBody().contains( startNode ) ) {
				return [ rootNode.firstChild ];
			}

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
		},
		selectBlock: function( block, _bookmark ) {
			var editor = window.tinyMCE.activeEditor;
			var brs = block.getElementsByTagName( 'BR' );

			// Has placeholder for text.
			if ( brs.length ) {
				editor.selection.setCursorLocation( brs[0].parentNode, 0 );
			} else if ( _bookmark ) {
				editor.selection.moveToBookmark( _bookmark );
				editor.focus();
			} else {
				editor.selection.select( block );
			}

			editor.nodeChanged();
		},
		extendBlock: function( settings ) {
			var extendId = settings.extends;
			var id = settings.namespace + ':' + settings.name;

			if ( _blocks[ extendId ] ) {
				_blocks[ extendId ].controls.push( '|' );

				_blocks[ extendId ].controls.push( {
					icon: settings.icon,
					text: '1',
					onClick: function( block ) {
						block.removeAttribute( 'data-wp-block-type' );
					},
					isActive: function( block ) {
						return ! block.getAttribute( 'data-wp-block-type' );
					}
				} );

				_blocks[ extendId ].controls.push( {
					icon: settings.icon,
					text: '2',
					onClick: function( block ) {
						block.setAttribute( 'data-wp-block-type', id );
					},
					isActive: function( block ) {
						return block.getAttribute( 'data-wp-block-type' ) === id;
					}
				} );

				_elementMap[ id ] = extendId;
			}
		}
	};
} )( window.wp = window.wp || {} );
