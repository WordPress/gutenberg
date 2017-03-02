( function( wp ) {
	var _settings = {};

	wp.blocks = {
		registerBlock: function( settings ) {
			// Note, elements should probably only be registered by core.
			// Maybe for each block, we should offer to extend the settings (add buttons).

			if ( settings.elements ) {
				settings.elements.forEach( function( element ) {
					_settings[ 'element:' + element ] = settings;
					_settings[ 'element:' + element ]._id = 'element:' + element;
				} );
			} else if ( settings.namespace && settings.name ) {
				_settings[ settings.namespace + ':' + settings.name ] = settings;
				_settings[ settings.namespace + ':' + settings.name ]._id = settings.namespace + ':' + settings.name;
			}
		},
		getBlockSettings: function( id ) {
			return _settings[ id ];
		},
		getBlockSettingsByElement: function( element ) {
			var blockType = element.getAttribute( 'data-wp-block-type' );
			var nodeName = element.nodeName.toLowerCase();

			return this.getSettings( blockType || 'element:' + nodeName );
		},
		getBlocks: function() {
			return _settings;
		}
	};
} )( window.wp = window.wp || {} );
