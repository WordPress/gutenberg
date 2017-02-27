( function( wp ) {
	var _settings = {};

	wp.blocks = {
		register: function( settings ) {
			// Note, elements should probably only be registered by core.
			// May for all block, we should offer to extend the settings (add buttons).

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
		getSettings: function( id ) {
			return _settings[ id ];
		},
		getSettingsByElement( element ) {
			var blockType = element.getAttribute( 'data-wp-block-type' );
			var nodeName = element.nodeName.toLowerCase();

			return this.getSettings( blockType || 'element:' + nodeName );
		}
	};
} )( window.wp = window.wp || {} );

( function( register ) {
	register( {
		elements: [ 'p' ],
		type: 'text',
		icon: 'gridicons-posts',
		buttons: [
			'alignleft',
			'aligncenter',
			'alignright',
			'heading',
			'blockquote',
			'bullist',
			'preformatted'
		]
	} );

	register( {
		elements: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
		type: 'text',
		icon: 'gridicons-heading',
		buttons: [
			'alignleft',
			'aligncenter',
			'alignright',
			'heading1',
			'heading2',
			'heading3',
			'heading4',
			'heading5',
			'heading6',
			'removeheading'
		]
	} );

	register( {
		elements: [ 'ul', 'ol' ],
		type: 'text',
		icon: 'gridicons-list-unordered',
		buttons: [
			'bullist',
			'numlist',
			'removelist'
		]
	} );

	register( {
		elements: [ 'blockquote' ],
		type: 'text',
		icon: 'gridicons-quote',
		buttons: [
			'removeblockquote'
		]
	} );

	register( {
		elements: [ 'pre' ],
		type: 'text',
		icon: 'gridicons-code',
		buttons: [
			'syntax',
			'removepreformatted'
		]
	} );

	register( {
		name: 'image',
		namespace: 'core',
		type: 'image',
		icon: 'gridicons-image',
		buttons: [
			'block-align-left',
			'block-align-center',
			'block-align-right',
			'togglefigcaption'
		]
	} );
} )( window.wp.blocks.register );

( function( tinymce, wp ) {
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

			editor.buttons.bold.icon = 'gridicons-bold';
			editor.buttons.italic.icon = 'gridicons-italic';
			editor.buttons.strikethrough.icon = 'gridicons-strikethrough';
			editor.buttons.link.icon = 'gridicons-link';

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
						element = event.parents[ event.parents.length - 1 ];

						button.active( editor.$( element ).find( 'figcaption' ).length > 0 );
					} );
				}
			} );

			editor.addCommand( 'selectblock', function() {} );

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

			function hideBlockUI() {
				blockToolbar.hide();

				tinymce.each( blockToolbars, function( toolbar ) {
					toolbar.hide();
				} );
			}

			function showBlockUI( focus ) {
				var settings = wp.blocks.getSettingsByElement( element );

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

			editor.on( 'keydown', function() {
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

			editor.on( 'focus', function() {
				tinymce.$( editor.getBody() ).addClass( 'wp-edit-focus' );
			} );

			editor.on( 'blur', function() {
				tinymce.$( editor.getBody() ).removeClass( 'wp-edit-focus' );
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
