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

		},
		getSelectedBlock: function( editor ) {
			var editor = window.tinyMCE.activeEditor;
			var node = editor.selection.getNode();
			var rootNode = editor.getBody();

			if ( node === rootNode ) {
				return rootNode.firstChild;
			}

			while ( node.parentNode ) {
				if ( node.parentNode === rootNode ) {
					return node;
				}

				node = node.parentNode;
			}
		}
	};
} )( window.wp = window.wp || {} );
