( function( tinymce, wp ) {
	tinymce.PluginManager.add( 'block', function( editor ) {

		// Set focussed block. Global variable for now. Top-level node for now.

		editor.on( 'nodechange', function( event ) {
			window.element = event.parents[ event.parents.length - 1 ];
		} );

		// Global buttons.

		tinymce.each( [ 'left', 'center', 'right' ], function( position ) {
			editor.addCommand( 'text-align-' + position, function() {
				tinymce.each( [ 'left', 'center', 'right' ], function( position ) {
					editor.$( element ).removeClass( 'text-align-' + position );
				} );

				if ( position !== 'left' ) {
					editor.$( element ).addClass( 'text-align-' + position );
					editor.nodeChanged();
				}
			} );

			editor.addButton( 'text-align-' + position, {
				icon: 'gridicons-align-' + position,
				cmd: 'text-align-' + position,
				onPostRender: function() {
					var button = this;

					editor.on( 'nodechange', function( event ) {
						$element = editor.$( element );

						if ( position === 'left' ) {
							button.active( ! (
								$element.hasClass( 'text-align-center' ) || $element.hasClass( 'text-align-right' )
							) );
						} else {
							button.active( $element.hasClass( 'text-align-' + position ) );
						}
					} );
				}
			} );

			editor.addCommand( 'block-align-' + position, function() {
				tinymce.each( [ 'left', 'center', 'right' ], function( position ) {
					editor.$( element ).removeClass( 'align' + position );
				} );

				editor.$( element ).addClass( 'align' + position );
				editor.nodeChanged();
			} );

			editor.addButton( 'block-align-' + position, {
				icon: 'gridicons-align-image-' + position,
				cmd: 'block-align-' + position,
				onPostRender: function() {
					var button = this;

					editor.on( 'nodechange', function( event ) {
						$element = editor.$( element );

						if ( position === 'center' ) {
							button.active( ! (
								$element.hasClass( 'alignleft' ) || $element.hasClass( 'alignright' )
							) );
						} else {
							button.active( $element.hasClass( 'align' + position ) );
						}
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
					var element = event.parents[ event.parents.length - 1 ];

					button.active( editor.$( element ).find( 'figcaption' ).length > 0 );
				} );
			}
		} );

		// Attach block UI.

		editor.on( 'preinit', function() {
			var DOM = tinymce.DOM;
			var blockToolbar;
			var blockToolbars = {};

			// editor.addButton( 'moveblock', {
			// 	icon: 'gridicons-reblog',
			// 	onclick: function() {
			// 		editor.$( element ).attr( 'data-mce-selected', 'move' );
			// 		editor.$( editor.getBody() ).addClass( 'is-moving-block' );
			// 		editor.nodeChanged();
			// 	}
			// } );

			editor.addButton( 'block', {
				icon: 'gridicons-posts',
				tooltip: 'Add Block',
				onPostRender: function() {
					var button = this;

					editor.on( 'nodechange', function( event ) {
						element = event.parents[ event.parents.length - 1 ];
						button.icon( wp.blocks.getSettingsByElement( element ).icon );
					} );
				}
			});

			editor.addCommand( 'block-remove', function() {
				var $blocks = editor.$( '*[data-mce-selected="block"]' ).add( element );
				var p = editor.$( '<p><br></p>' );

				editor.undoManager.transact( function() {
					$blocks.first().before( p );
					editor.selection.setCursorLocation( p[0], 0 );
					$blocks.remove();
				} );
			} );

			editor.addButton( 'block-remove', {
				icon: 'gridicons-trash',
				cmd: 'block-remove'
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

			editor.addButton( 'add', {
				icon: 'gridicons-add-outline',
				tooltip: 'Add Block'
			} );

			// Adjust icon of TinyMCE core buttons.
			editor.buttons.bold.icon = 'gridicons-bold';
			editor.buttons.italic.icon = 'gridicons-italic';
			editor.buttons.strikethrough.icon = 'gridicons-strikethrough';
			editor.buttons.link.icon = 'gridicons-link';

			var toolbarInline = editor.wp._createToolbar( [ 'bold', 'italic', 'strikethrough', 'link' ] );
			var toolbarCaret = editor.wp._createToolbar( [ 'add' ] );
			blockToolbar = editor.wp._createToolbar( [ 'up', 'block', 'down' ] );

			toolbarCaret.$el.addClass( 'block-toolbar' );
			blockToolbar.$el.addClass( 'block-toolbar' );

			var range;

			toolbarInline.reposition = function () {
				if ( ! range ) {
					return;
				}

				var toolbar = this.getEl();
				var toolbarRect = toolbar.getBoundingClientRect();
				var elementRect = range.getBoundingClientRect();

				DOM.setStyles( toolbar, {
					position: 'absolute',
					left: elementRect.left + 'px',
					top: elementRect.top + window.pageYOffset - toolbarRect.height - 8 + 'px'
				} );

				this.show();
			}

			toolbarCaret.reposition =
			blockToolbar.reposition = function () {
				if ( ! element ) {
					return;
				}

				var toolbar = this.getEl();
				var toolbarRect = toolbar.getBoundingClientRect();
				var elementRect = element.getBoundingClientRect();

				var contentRect = editor.getBody().getBoundingClientRect();

				DOM.setStyles( toolbar, {
					position: 'absolute',
					left: contentRect.left + 50 + 'px',
					top: elementRect.top + window.pageYOffset + 'px'
				} );

				this.show();
			}

			editor.on( 'blur', function() {
				toolbarCaret.hide();
				blockToolbar.hide();
				tinymce.each( editor.settings.blocks, function( block, key ) {
					blockToolbars[ key ].hide();
				} );
			} );

			function isEmptySlot( node ) {
				// Text node.
				if ( node.nodeType === 3 ) {
					// Has text.
					if ( node.data.length ) {
						return false;
					} else {
						node = node.parentNode;
					}
				}

				// Element node.
				if ( node.nodeType === 1 ) {
					// Element is no direct child.
					if ( node.parentNode !== editor.getBody() ) {
						return false;
					}

					var childNodes = node.childNodes;
					var i = childNodes.length;

					// Loop over children.
					while ( i-- ) {
						// Text node.
						if ( childNodes[ i ].nodeType === 3 ) {
							// Has text.
							if ( node.data.length ) {
								return false;
							}
						}

						// Element node.
						if ( childNodes[ i ].nodeType === 1 ) {
							// Is not BR.
							if ( childNodes[ i ].nodeName !== 'BR' ) {
								return false;
							}
						}
					}
				}

				return true;
			}

			var hasBlockUI = false;

			function hideBlockUI() {
				if ( hasBlockUI ) {
					tinymce.$( editor.getBody() ).removeClass( 'has-block-ui' );
					hasBlockUI = false;
				}

				blockToolbar.hide();

				tinymce.each( blockToolbars, function( toolbar ) {
					toolbar.hide();
				} );
			}

			function focusToolbar( toolbar ) {
				var node = toolbar.find( 'toolbar' )[0];
				node && node.focus( true );
			}

			function showBlockUI( focus ) {
				var settings = wp.blocks.getSettingsByElement( element );

				if ( ! hasBlockUI ) {
					tinymce.$( editor.getBody() ).addClass( 'has-block-ui' );
					hasBlockUI = true;
				}

				blockToolbar.reposition();

				tinymce.each( blockToolbars, function( toolbar, key ) {
					if ( key !== settings._id ) {
						toolbar.hide();
					}
				} );

				if ( settings ) {
					if ( ! blockToolbars[ settings._id ] ) {
						blockToolbars[ settings._id ] = editor.wp._createToolbar( settings.buttons.concat( [ 'block-remove' ] ) );
						blockToolbars[ settings._id ].reposition = function () {
							if (!element) return

							var toolbar = this.getEl();
							var toolbarRect = toolbar.getBoundingClientRect();
							var elementRect = element.getBoundingClientRect();
							var contentRect = editor.getBody().getBoundingClientRect();

							DOM.setStyles( toolbar, {
								position: 'absolute',
								left: elementRect.left + 'px',
								top: elementRect.top + window.pageYOffset - toolbarRect.height - 8 + 'px'
							} );

							this.show();
						}

						editor.nodeChanged(); // Update UI.
					}

					blockToolbars[ settings._id ].reposition();
					focus && focusToolbar( blockToolbars[ settings._id ] );
				}
			}

			var hidden = true;

			editor.on( 'keydown', function( event ) {
				if ( tinymce.util.VK.metaKeyPressed( event ) ) {
					return;
				}

				hidden = true;
			} );

			editor.on( 'mousedown touchstart', function() {
				hidden = false;
			} );

			editor.on( 'selectionChange nodeChange', function( event ) {
				var selection = window.getSelection();
				var isCollapsed = selection.isCollapsed;
				var anchorNode = selection.anchorNode;

				if ( ! anchorNode ) {
					return;
				}

				var isEmpty = isCollapsed && isEmptySlot( anchorNode );
				var isBlockUIVisible = ! hidden;

				if ( isEmpty ) {
					window.console.log( 'Debug: empty node.' );

					hideBlockUI();
					toolbarInline.hide();
					toolbarCaret.reposition();
				} else {
					toolbarCaret.hide();

					if ( ! isCollapsed && anchorNode.nodeType === 3 ) {
						hidden = true;
						hideBlockUI();

						if ( anchorNode.parentNode.nodeName === 'A' ) {
							toolbarInline.hide();
						} else {
							range = document.createRange();
							range.setStart( selection.anchorNode, selection.anchorOffset );
							range.setEnd( selection.anchorNode, selection.anchorOffset );
							toolbarInline.reposition();
						}
					} else {
						toolbarInline.hide();

						// setTimeout( function() {
							if ( isBlockUIVisible ) {
								window.console.log( 'Debug: visible block UI.' );
								showBlockUI();
							} else {
								hideBlockUI();
							}
						// }, 50 );
					}
				}
			} );

			editor.on( 'nodeChange', function( event ) {
				editor.$( '*[data-mce-selected="block"]' ).attr( 'data-mce-selected', null );
				editor.$( element ).attr( 'data-mce-selected', 'block' );
			} );

			// editor.on( 'keydown', function( event ) {
			// 	if ( editor.$( element ).attr( 'data-mce-selected' ) === 'block' ) {
			// 		if ( event.keyCode === tinymce.util.VK.DOWN ) {
			// 			editor.execCommand( 'down' );
			// 			event.preventDefault();
			// 		}

			// 		if ( event.keyCode === tinymce.util.VK.UP ) {
			// 			editor.execCommand( 'up' );
			// 			event.preventDefault();
			// 		}
			// 	}
			// } );

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
							editor.execCommand( 'block-remove' );
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
					hideBlockUI();
				}
			}, true );

			editor.on( 'keyup', function( event ) {
				if ( metaCount === 1 ) {
					showBlockUI( true );
				}

				metaCount = 0;
			} );

			editor.on( 'dragstart', function( event ) {
				if ( element.nodeName === 'FIGURE' ) {
					event.preventDefault();
				}
			} );
		} );
	} );
} )( window.tinymce, window.wp );
