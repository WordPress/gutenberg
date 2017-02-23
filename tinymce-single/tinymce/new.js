( function( tinymce ) {
	tinymce.PluginManager.add( 'new', function( editor ) {
		var DOM = tinymce.DOM;

		editor.addButton( 'add', {
			icon: 'gridicons-add-outline',
			tooltip: 'Add Block'
		} );

		editor.on('focus', function () {
			if (editor.wp && editor.wp._createToolbar) {
				var element
				var toolbarCaret = editor.wp._createToolbar( [ 'add' ] )

				toolbarCaret.$el.addClass('block-toolbar')

				toolbarCaret.reposition = function () {
					if (!element) return

					var toolbar = this.getEl()
					var toolbarRect = toolbar.getBoundingClientRect()
					var elementRect = element.getBoundingClientRect()

					var contentRect = editor.getBody().getBoundingClientRect();

					DOM.setStyles(toolbar, {
						position: 'absolute',
						left: contentRect.left + 50 + 'px',
						top: elementRect.top + window.pageYOffset + 'px'
						// top: elementRect.top + window.pageYOffset + elementRect.height / 2 - toolbarRect.height / 2 + 'px'
					})

					this.show()
				}

				editor.on('blur', function () {
				  toolbarCaret.hide()
				})

				editor.on('wptoolbar', function (event) {
					element = event.element
					range = event.range

					// No collapsed selection.
					if (range.collapsed) {
					  if ( event.empty ) {
					    event.toolbar = toolbarCaret
					  }

					  return
					}
				} );
			}
		} );
	} );
} )( window.tinymce );
