( function( tinymce ) {
	tinymce.PluginManager.add( 'block', function( editor ) {
		function focusToolbar( toolbar ) {
			var node = toolbar.find( 'toolbar' )[0];
			node && node.focus( true );
		}

		editor.on( 'preinit', function() {
			var DOM = tinymce.DOM;
			var element;
			var blockToolbar;
			var blockToolbars = {};
			var blockSelection = false;

			tinymce.each( '123456'.split(''), function( level ) {
				editor.addCommand( 'heading' + level, function() {
					editor.formatter.apply( 'h' + level );
					editor.nodeChanged();
				} );

				editor.addButton( 'heading' + level, {
					text: level,
					cmd: 'heading' + level,
					onpostrender: function() {
						var button = this;

						editor.on( 'nodechange', function( event ) {
							button.active( element.nodeName === 'H' + level );
						} );
					}
				} );
			} );

			editor.addButton( 'heading', {
				icon: 'gridicons-heading',
				cmd: 'heading1'
			} );

			editor.addCommand( 'removeheading', function() {
				editor.formatter.apply( 'p' );
				editor.nodeChanged();
			});

			editor.addButton( 'removeheading', {
				icon: 'gridicons-posts',
				cmd: 'removeheading'
			} );

			editor.addCommand( 'preformatted', function() {
				editor.formatter.apply( 'pre' );
				editor.nodeChanged();
			} );

			editor.addButton( 'preformatted', {
				icon: 'gridicons-code',
				cmd: 'preformatted'
			} );

			editor.addCommand( 'removepreformatted', function() {
				editor.formatter.remove( 'pre' );
				editor.nodeChanged();
			});

			editor.addButton( 'removepreformatted', {
				icon: 'gridicons-posts',
				cmd: 'removepreformatted'
			} );

			editor.addButton( 'syntax', {
				text: 'syntax',
				onclick: function() {}
			} );

			editor.addCommand( 'removeblockquote', function() {
				editor.formatter.remove( 'blockquote' );
				editor.nodeChanged();
			});

			editor.addButton( 'removeblockquote', {
				icon: 'gridicons-posts',
				cmd: 'removeblockquote'
			} );

			editor.addCommand( 'alignleft', function() {
				editor.formatter.remove( 'alignleft' );
				editor.formatter.remove( 'aligncenter' );
				editor.formatter.remove( 'alignright' );

				editor.nodeChanged();
			});

			editor.addButton( 'alignleft', {
				icon: 'gridicons-align-left',
				cmd: 'alignleft',
				onpostrender: function() {
					var button = this;

					editor.on( 'nodechange', function( event ) {
						button.active( ! editor.formatter.matchNode( element, 'aligncenter' ) &&
							! editor.formatter.matchNode( element, 'alignright' ) );
					} );
				}
			} );

			// Adjust icon of TinyMCE core buttons.
			editor.buttons.aligncenter.icon = 'gridicons-align-center';
			editor.buttons.alignright.icon = 'gridicons-align-right';
			editor.buttons.blockquote.icon = 'gridicons-quote';
			editor.buttons.bullist.icon = 'gridicons-list-unordered';
			editor.buttons.numlist.icon = 'gridicons-list-ordered';

			editor.addCommand( 'removelist', function() {
				editor.selection.select( element );

				if ( element.nodeName === 'UL' ) {
					editor.execCommand( 'InsertUnorderedList' );
				} else if ( element.nodeName === 'OL' ) {
					editor.execCommand( 'InsertOrderedList' );
				}

				editor.nodeChanged();
			});

			editor.addButton( 'removelist', {
				icon: 'gridicons-posts',
				cmd: 'removelist'
			} );

			tinymce.each( [ 'left', 'center', 'right' ], function( position ) {
				editor.addCommand( 'imgalign' + position, function() {
					tinymce.each( [ 'left', 'center', 'right' ], function( position ) {
						editor.formatter.remove( 'align' + position, element );
					} );

					editor.formatter.apply( 'align' + position, element );

					editor.nodeChanged();
				} );

				editor.addButton( 'imgalign' + position, {
					icon: 'gridicons-align-image-' + position,
					cmd: 'imgalign' + position,
					onPostRender: function() {
						var button = this;

						editor.on( 'nodechange', function( event ) {
							element = event.parents[ event.parents.length - 1 ];

							button.active( editor.$( element ).hasClass( 'align' + position ) );
						} );
					}
				} );
			} );

			editor.addCommand( 'addfigcaption', function() {
				if ( ! editor.$( element ).find( 'figcaption' ).length ) {
					var figcaption = editor.$( '<figcaption><br></figcaption>' );

					editor.undoManager.transact( function() {
						editor.$( element ).append( figcaption );
						editor.selection.setCursorLocation( figcaption[0], 0 );
					} );
				}
			} );

			editor.addCommand( 'removefigcaption', function() {
				var figcaption = editor.$( element ).find( 'figcaption' );

				if ( figcaption.length ) {
					editor.undoManager.transact( function() {
						figcaption.remove();
					} );
				}
			} );

			editor.addCommand( 'togglefigcaption', function() {
				if ( editor.$( element ).find( 'figcaption' ).length ) {
					editor.execCommand( 'removefigcaption' );
				} else {
					editor.execCommand( 'addfigcaption' );
				}
			} );

			editor.addButton( 'togglefigcaption', {
				icon: 'gridicons-caption',
				cmd: 'togglefigcaption',
				onPostRender: function() {
					var button = this;

					editor.on( 'nodechange', function( event ) {
						element = event.parents[ event.parents.length - 1 ];

						button.active( editor.$( element ).find( 'figcaption' ).length > 0 );
					} );
				}
			} );

			editor.addCommand( 'selectblock', function() {
				editor.$( element ).attr( 'data-mce-selected', 'block' );
				editor.nodeChanged();

				editor.once('click keydown', function ( event ) {
					if ( tinymce.util.VK.modifierPressed( event ) ) {
						return;
					}

					editor.$('*[data-mce-selected="block"]').removeAttr('data-mce-selected');
					editor.nodeChanged();
				} );
			} );

			// editor.addCommand( 'moveblock', function() {
			// 	blockSelection = false;

			// } );

			editor.addButton( 'moveblock', {
				icon: 'gridicons-reblog',
				onclick: function() {
					editor.$( element ).attr( 'data-mce-selected', 'move' );
					editor.$( editor.getBody() ).addClass( 'is-moving-block' );
					editor.nodeChanged();
				}
			} );

			editor.addButton( 'block', {
				icon: 'gridicons-posts',
				tooltip: 'Add Block',
				cmd: 'selectblock',
				onPostRender: function() {
					var button = this;

					editor.on( 'nodechange', function( event ) {
						element = event.parents[ event.parents.length - 1 ];

						tinymce.each( editor.settings.blocks, function( block, key ) {
							if ( block.match( element ) ) {
								button.icon( block.icon || '' );
								button.text( block.text || '' );
							}
						} );
					} );
				}
			});

			editor.addCommand( 'removeblock', function() {
				var $blocks = editor.$( '*[data-mce-selected="block"]' ).add( element );
				var p = editor.$( '<p><br></p>' );

				editor.undoManager.transact( function() {
					$blocks.first().before( p );
					editor.selection.setCursorLocation( p[0], 0 );
					$blocks.remove();
				} );

				setTimeout( function() {
					editor.$( p ).attr( 'data-mce-selected', null );
				} );
			} );

			editor.addButton( 'removeblock', {
				icon: 'gridicons-trash',
				cmd: 'removeblock'
			} );

			editor.addCommand( 'up', function() {
				$blocks = editor.$( '*[data-mce-selected="block"]' ).add( element );
				rect = element.getBoundingClientRect();
				$prev = $blocks.first().prev();

				if ( $prev.length ) {
					$blocks.last().after( $prev );
					editor.nodeChanged();
					window.scrollBy( 0, - rect.top + element.getBoundingClientRect().top );
				}
			} );

			editor.addCommand( 'down', function() {
				$blocks = editor.$( '*[data-mce-selected="block"]' ).add( element );
				rect = element.getBoundingClientRect();
				$next = $blocks.last().next();

				if ( $next.length ) {
					$blocks.first().before( $next );
					editor.nodeChanged();
					window.scrollBy( 0, - rect.top + element.getBoundingClientRect().top );
				}
			} );

			editor.addButton( 'up', {
				icon: 'gridicons-chevron-up',
				tooltip: 'Up',
				cmd: 'up',
				classes: 'widget btn move-up'
			} );

			editor.addButton( 'down', {
				icon: 'gridicons-chevron-down',
				tooltip: 'Down',
				cmd: 'down',
				classes: 'widget btn move-down'
			} );

			blockToolbar = editor.wp._createToolbar( [ 'up', 'block', 'down' ] )

			blockToolbar.$el.addClass('block-toolbar')

			blockToolbar.reposition = function () {
				if (!element) return

				var toolbar = this.getEl()
				var toolbarRect = toolbar.getBoundingClientRect()
				var elementRect = element.getBoundingClientRect()

				var contentRect = editor.getBody().getBoundingClientRect();

				DOM.setStyles(toolbar, {
					position: 'absolute',
					left: contentRect.left + 50 + 'px',
					top: elementRect.top + window.pageYOffset + 'px'
				} );

			  this.show()
			}

			editor.on('blur', function () {
				blockToolbar.hide()
			} );

			editor.on( 'nodechange', function( event ) {
				var empty = (
					editor.dom.isEmpty( event.element ) &&
					( event.element.nodeName === 'P' || (
						event.element.nodeName === 'BR' &&
						event.element.parentNode.nodeName === 'P'
					) )
				);

				element = event.parents[ event.parents.length - 1 ];

				if ( ! empty && editor.dom.isBlock( element ) ) {
					blockToolbar.reposition();
				} else {
					blockToolbar.hide();
				}

				if ( element.nodeName === 'FIGURE' ) {
					editor.$( element ).attr( 'data-mce-selected', 'block' );

					editor.once('click keydown', function ( event ) {
						if ( tinymce.util.VK.modifierPressed( event ) ) {
							return;
						}

						editor.$('*[data-mce-selected="block"]').removeAttr('data-mce-selected');
						editor.nodeChanged();
					} );
				}

				var range = editor.selection.getRng()

				var $start = editor.$( editor.dom.getParent( range.startContainer, function( element ) {
					return element.parentNode === editor.getBody();
				} ) );

				var $end = editor.$( editor.dom.getParent( range.endContainer, function( element ) {
					return element.parentNode === editor.getBody();
				} ) );

				// Selection only has the start of a new block.
				if ( $end[0] === range.endContainer && range.endOffset === 0 ) {
					$end = $end.prev();
				}

				if ( ! empty && $start[0] !== $end[0] ) {
					// $start.add( $start.nextUntil( $end ) ).add( $end ).attr( 'data-mce-selected', 'block' );

					// editor.once('click keydown', function ( event ) {
					// 	if ( tinymce.util.VK.modifierPressed( event ) ) {
					// 		return;
					// 	}

					// 	editor.$('*[data-mce-selected="block"]').removeAttr('data-mce-selected');
					// 	editor.nodeChanged();
					// } );

					return;
				}

				if ( ! empty && editor.$( element ).attr( 'data-mce-selected' ) === 'block' ) {
					blockSelection = true;

					tinymce.each( editor.settings.blocks, function( block, key ) {
						if ( block.match( element ) ) {
							blockToolbars[ key ].reposition();

							if ( element.nodeName !== 'FIGURE' ) {
								focusToolbar( blockToolbars[ key ] );
							}
						} else {
							blockToolbars[ key ].hide();
						}
					} );
				} else {
					blockSelection = false;

					tinymce.each( editor.settings.blocks, function( block, key ) {
						blockToolbars[ key ].hide();
					} );
				}
			} )

			tinymce.each( editor.settings.blocks, function( block, key ) {
				blockToolbars[ key ] = editor.wp._createToolbar( block.buttons );
				blockToolbars[ key ].reposition = function () {
					if (!element) return

					var toolbar = this.getEl()
					var toolbarRect = toolbar.getBoundingClientRect()
					var elementRect = element.getBoundingClientRect()

					var contentRect = editor.getBody().getBoundingClientRect();

					DOM.setStyles(toolbar, {
						position: 'absolute',
						left: elementRect.left + 'px',
						top: elementRect.top + window.pageYOffset - toolbarRect.height - 8 + 'px'
					})

					this.show()
				}

				blockToolbars[ key ].on( 'keydown', function( event ) {
					if ( event.keyCode === 27 ) {
						editor.$('*[data-mce-selected="block"]').removeAttr('data-mce-selected');
						editor.nodeChanged();
						editor.focus();
					}

					// if ( event.keyCode === tinymce.util.VK.DOWN ) {
					// 	editor.execCommand( 'down' );
					// 	event.preventDefault();
					// 	event.stopImmediatePropagation();
					// }

					// if ( event.keyCode === tinymce.util.VK.UP ) {
					// 	editor.execCommand( 'up' );
					// 	event.preventDefaultntDefault();
					// 	event.stopImmediatePropagation();
					// }
				}, true );
			} );

			editor.on( 'beforeexeccommand', function( event ) {
				var block = blockSelection;

				editor.once( 'nodechange', function( event ) {
					setTimeout( function() {
						if ( block ) {
							editor.$('*[data-mce-selected="block"]').removeAttr('data-mce-selected');
							editor.$( element ).attr( 'data-mce-selected', 'block' );
							editor.nodeChanged();
						}
					} );
				}, true );
			} );

			var prevEmpty;

			// Throttle?
			editor.on( 'keyup', function() {
				var empty = editor.dom.isEmpty( element );

				if ( ( empty && ! prevEmpty ) || ( ! empty && prevEmpty ) ) {
					editor.nodeChanged()
				}

				prevEmpty = empty;
			} );

			editor.on( 'keydown', function( event ) {
				if ( editor.$( element ).attr( 'data-mce-selected' ) === 'block' ) {
					if ( event.keyCode === tinymce.util.VK.DOWN ) {
						editor.execCommand( 'down' );
						event.preventDefault();
					}

					if ( event.keyCode === tinymce.util.VK.UP ) {
						editor.execCommand( 'up' );
						event.preventDefault();
					}
				}
			} );

			var metaCount = 0;

			editor.on( 'keydown', function( event ) {
				var keyCode = event.keyCode;
				var VK = tinymce.util.VK;

				if ( element.nodeName === 'FIGURE' ) {
					if ( keyCode === VK.ENTER ) {
						editor.execCommand( 'addfigcaption' );
						event.preventDefault();
					}

					if ( keyCode === VK.BACKSPACE ) {
						var caretEl = editor.selection.getNode();

						if ( caretEl.nodeName !== 'FIGCAPTION' ) {
							editor.execCommand( 'removeblock' );
							event.preventDefault();
						} else {
							var range = editor.selection.getRng();

							if ( range.collapsed && range.startOffset === 0 ) {
								editor.execCommand( 'removefigcaption' );
								event.preventDefault();
							}
						}
					}

					if ( keyCode === VK.LEFT ) {
						var range = editor.selection.getRng();

						if ( keyCode === VK.LEFT && range.startOffset === 0 ) {
							event.preventDefault();
						}
					}
				}

				if ( VK.metaKeyPressed( event ) ) {
					metaCount ++;
				} else {
					metaCount = 0;
				}

				if ( keyCode === 27 ) {
					editor.$('*[data-mce-selected="block"]').removeAttr('data-mce-selected');
					editor.nodeChanged();
				}
			}, true );

			editor.on( 'keyup', function( event ) {
				if ( metaCount === 1 ) {
					editor.execCommand( 'selectblock' );
				}

				metaCount = 0;
			} );

			editor.on( 'dragstart', function( event ) {
				if ( element.nodeName === 'FIGURE' ) {
					event.preventDefault();
				}
			} );
		} );

		editor.on( 'init', function() {
			editor.focus();
		} );
	} );
} )( window.tinymce );
