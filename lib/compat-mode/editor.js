/**
 * Compat mode editor - renders a block in an isolated iframe.
 */
( function () {
	const config = window.compatModeConfig;
	const parentOrigin = window.location.origin;

	wp.domReady( function () {
		// Send COMPAT_READY multiple times to handle race conditions where the
		// parent's listener might not be set up yet when the iframe loads quickly.
		function sendReadyWithRetry( attempts ) {
			window.parent.postMessage( { type: 'COMPAT_READY' }, parentOrigin );
			if ( attempts > 1 ) {
				setTimeout( function () {
					sendReadyWithRetry( attempts - 1 );
				}, 100 );
			}
		}
		sendReadyWithRetry( 3 ); // Send 3 times: immediately, +100ms, +200ms

		const {
			createElement,
			createRoot,
			useState,
			useEffect,
			useCallback,
			useRef,
		} = wp.element;
		const { getBlockType } = wp.blocks;

		// Register core blocks.
		if ( wp.blockLibrary && wp.blockLibrary.registerCoreBlocks ) {
			wp.blockLibrary.registerCoreBlocks();
		}

		function waitForBlock( blockName, maxAttempts, attempt ) {
			attempt = attempt || 1;
			const blockType = getBlockType( blockName );

			if ( blockType ) {
				initializeEditor();
				return;
			}

			if ( attempt >= maxAttempts ) {
				// eslint-disable-next-line no-console
				console.error(
					'[Compat Mode] Block not found after ' +
						maxAttempts +
						' attempts: ' +
						blockName
				);
				document.getElementById( 'compat-mode-editor' ).innerHTML =
					'<div style="padding: 20px; color: red;">Block not found: ' +
					blockName +
					'</div>';
				window.parent.postMessage(
					{ type: 'COMPAT_READY' },
					parentOrigin
				);
				return;
			}

			setTimeout( function () {
				waitForBlock( blockName, maxAttempts, attempt + 1 );
			}, 100 );
		}

		function initializeEditor() {
			const { BlockEditorProvider, BlockList } = wp.blockEditor;
			const { createBlock } = wp.blocks;

			// Add mediaUpload function to settings so MediaUploadCheck renders content.
			// This is a minimal implementation that shows an error for now.
			const editorSettings = Object.assign( {}, config.editorSettings, {
				mediaUpload( options ) {
					if ( options.onError ) {
						options.onError(
							'Media upload from compat mode is not yet supported.'
						);
					}
				},
			} );

			function CompatModeBlockEditor( { blockName } ) {
				const initialBlock = createBlock( blockName, {} );
				const [ blocks, setBlocks ] = useState( [ initialBlock ] );
				const resizeObserverRef = useRef( null );
				const lastAttributesJson = useRef( '' );

				const reportHeight = useCallback( function () {
					const editor =
						document.getElementById( 'compat-mode-editor' );
					if ( editor ) {
						window.parent.postMessage(
							{ type: 'COMPAT_RESIZE', height: editor.scrollHeight },
							parentOrigin
						);
					}
				}, [] );

				// Handle block changes - report to parent
				const handleBlocksChange = useCallback(
					function ( newBlocks ) {
						setBlocks( newBlocks );

						// Report attribute changes to parent
						if ( newBlocks[ 0 ] ) {
							const currentJson = JSON.stringify(
								newBlocks[ 0 ].attributes
							);
							if ( currentJson !== lastAttributesJson.current ) {
								lastAttributesJson.current = currentJson;
								window.parent.postMessage(
									{
										type: 'COMPAT_ATTRS_CHANGED',
										attributes: newBlocks[ 0 ].attributes,
									},
									parentOrigin
								);
								setTimeout( reportHeight, 50 );
							}
						}
					},
					[ reportHeight ]
				);

				// Set up resize observer
				useEffect( function () {
					const editor =
						document.getElementById( 'compat-mode-editor' );
					if ( editor && window.ResizeObserver ) {
						resizeObserverRef.current = new ResizeObserver(
							reportHeight
						);
						resizeObserverRef.current.observe( editor );
					}
					setTimeout( reportHeight, 100 );
					return function () {
						if ( resizeObserverRef.current ) {
							resizeObserverRef.current.disconnect();
						}
					};
				}, [ reportHeight ] );

				// Listen for messages from parent
				useEffect(
					function () {
						function handleMessage( event ) {
							if ( event.origin !== parentOrigin ) {
								return;
							}
							const data = event.data || {};
							switch ( data.type ) {
								case 'COMPAT_INIT':
									if ( data.attributes ) {
										const block = createBlock(
											blockName,
											data.attributes
										);
										setBlocks( [ block ] );
									}
									setTimeout( reportHeight, 100 );
									break;
								case 'COMPAT_UPDATE_ATTRS':
									if ( data.attributes && blocks[ 0 ] ) {
										const updatedBlock = createBlock(
											blockName,
											Object.assign(
												{},
												blocks[ 0 ].attributes,
												data.attributes
											)
										);
										setBlocks( [ updatedBlock ] );
									}
									setTimeout( reportHeight, 50 );
									break;
							}
						}
						window.addEventListener( 'message', handleMessage );
						return function () {
							window.removeEventListener(
								'message',
								handleMessage
							);
						};
					},
					[ reportHeight, blockName, blocks ]
				);

				return createElement(
					'div',
					{ className: 'compat-mode-block-wrapper' },
					createElement(
						BlockEditorProvider,
						{
							value: blocks,
							onInput: handleBlocksChange,
							onChange: handleBlocksChange,
							settings: editorSettings,
						},
						createElement( BlockList, null )
					)
				);
			}

			// Error boundary to catch block render errors
			class ErrorBoundary extends wp.element.Component {
				constructor( props ) {
					super( props );
					this.state = { hasError: false, error: null };
				}
				static getDerivedStateFromError( error ) {
					return { hasError: true, error };
				}
				componentDidCatch( error, errorInfo ) {
					// eslint-disable-next-line no-console
					console.error(
						'[Compat Mode] Block error:',
						error,
						errorInfo
					);
				}
				render() {
					if ( this.state.hasError ) {
						return createElement(
							'div',
							{
								className: 'compat-mode-block-wrapper',
								style: {
									padding: '20px',
									color: '#cc1818',
									backgroundColor: '#fce4e4',
									borderRadius: '4px',
								},
							},
							createElement( 'strong', null, 'Block Error' ),
							createElement(
								'p',
								null,
								this.state.error?.message || 'An error occurred.'
							)
						);
					}
					return this.props.children;
				}
			}

			const container = document.getElementById( 'compat-mode-editor' );
			const root = createRoot( container );

			root.render(
				createElement(
					ErrorBoundary,
					null,
					createElement( CompatModeBlockEditor, {
						blockName: config.blockName,
					} )
				)
			);
		}

		waitForBlock( config.blockName, 50, 1 );
	} );
} )();
