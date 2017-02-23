( function( tinymce ) {
	tinymce.PluginManager.add( 'formatting', function( editor ) {
		var each = tinymce.each
		var DOM = tinymce.DOM

		editor.on( 'preinit', function() {
			// Adjust icon of TinyMCE core buttons.
			editor.buttons.bold.icon = 'gridicons-bold';
			editor.buttons.italic.icon = 'gridicons-italic';
			editor.buttons.strikethrough.icon = 'gridicons-strikethrough';
			editor.buttons.link.icon = 'gridicons-link';
    } );

		editor.on('focus', function () {
			if (editor.wp && editor.wp._createToolbar) {
				var element
				var toolbarInline = editor.wp._createToolbar( [ 'bold', 'italic', 'strikethrough', 'link' ] )
				var toolbarMulti = editor.wp._createToolbar( [ 'alignleft', 'aligncenter', 'alignright', 'blockquote', 'bullist', 'removeblock' ] )

				toolbarMulti.reposition = function () {
					if (!element) return

					var toolbar = this.getEl()
					var toolbarRect = toolbar.getBoundingClientRect()
					var elementRect = element.getBoundingClientRect()

					var contentRect = document.getElementById( 'content' ).getBoundingClientRect();

					DOM.setStyles(toolbar, {
						position: 'absolute',
						left: elementRect.left + 'px',
						top: elementRect.top + window.pageYOffset - toolbarRect.height - 8 + 'px'
					})

					this.show()
				}

				editor.on('wptoolbar', function (event) {
					element = event.element
					range = event.range

					var content = editor.selection.getContent()
					var parent = editor.dom.getParent(range.startContainer, '*[data-mce-selected="block"]')

					// No collapsed selection.
					if (range.collapsed) {
						return
					}

					// No non editable elements.
					if (
						element.getAttribute('contenteditable') === 'false' ||
						element.getAttribute('data-mce-bogus') === 'all'
					) {
						return
					}

					// No images.
					if (element.nodeName === 'IMG') {
						return
					}

					// No horizontal rules.
					if (element.nodeName === 'HR') {
						return
					}

					// No links.
					if (element.nodeName === 'A') {
						return
					}

					// No empty selection.
					if (!content.replace(/<[^>]+>/g, '').replace(/(?:\s|&nbsp;)/g, '')) {
						return
					}

					// Block where the selection starts.
					var $start = editor.$( editor.dom.getParent( range.startContainer, editor.dom.isBlock ) );
					// Block where the selection ends.
					var $end = editor.$( editor.dom.getParent( range.endContainer, editor.dom.isBlock ) );

					// Selection end only has the start of a new block.
					if ( $end[0] === range.endContainer && range.endOffset === 0 ) {
						$end = $end.prev();
					}

					// Start and end blocks are not the same.
					if ( $start[0] !== $end[0] ) {
						event.toolbar = toolbarMulti
						event.selection = range
					} else if ( ! parent  ) {
						event.toolbar = toolbarInline
						event.selection = range
					}

					// Click inside selection does not trigger nodechange.
					editor.once( 'click', function ( event ) {
						window.setTimeout( function() {
							editor.$('*[data-mce-selected="block"]').removeAttr('data-mce-selected');
							editor.nodeChanged();
						} );
					} );
				})
			}
		})
	} );
} )( window.tinymce );
