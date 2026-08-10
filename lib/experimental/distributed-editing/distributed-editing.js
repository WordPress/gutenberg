/**
 * Distributed editing prototype — editor client.
 *
 * Client side of the server-authoritative save model, integrated into the
 * native save path. An apiFetch middleware decorates wp/v2 post saves with the
 * tracked base version (compare-and-swap) and the approval hashes of the
 * chunks actively present in the save. Unapproved protected proposals are
 * sequestered server-side into `de/pending-review` blocks, which render here
 * like invalid blocks awaiting recovery: a warning box with a Resolve action,
 * and a Resolve dialog carrying the raw markup (editable) with explicit
 * Approve / Reject actions.
 *
 * Trust note on auto-approval: hashes are sent for the chunks in the user's
 * own outgoing content. In this prototype there is no peer channel, so every
 * changed chunk in the editor was either loaded from accepted state
 * (byte-identical, passes through untouched) or authored locally by this
 * user; sequestered payloads live in inert block attributes and only enter
 * content through the explicit Approve action. If a fast relay is ever added,
 * auto-approval must be restricted to tracked local provenance.
 *
 * Deliberately build-free: uses WordPress script globals so the prototype
 * stays inside lib/experimental/ without touching the packages build.
 */

/* global wp */
( function () {
	const {
		createElement: el,
		Fragment,
		useCallback,
		useEffect,
		useState,
	} = wp.element;
	const { registerPlugin } = wp.plugins;
	const { PluginDocumentSettingPanel } = wp.editor;
	const { Button, Flex, FlexItem, Modal, Notice, TextareaControl } =
		wp.components;
	const { useBlockProps, Warning } = wp.blockEditor;
	const { useDispatch, useSelect } = wp.data;
	const { parse, registerBlockType } = wp.blocks;
	const { __, sprintf } = wp.i18n;
	const apiFetch = wp.apiFetch;

	const POLL_INTERVAL = 10000;

	function statePath( postId ) {
		return '/gutenberg-de/v1/posts/' + postId + '/state';
	}

	function shortVersion( version ) {
		return version ? version.slice( 3, 11 ) : '—';
	}

	/**
	 * Shared state between the save middleware and the panel UI.
	 */
	const bridge = {
		baseVersion: null,
		// Debug/testing switch: when true, saves carry no approval hashes, so
		// this session's protected changes sequester like a foreign session's
		// would. Toggle from the console via window.__gutenbergDEBridge to
		// exercise the review flow with a single privileged user.
		disableAutoApprovals: false,
		onBaseVersion: null,
		ready: null,
		refreshState: null,
		ui: null,
		setBaseVersion( version ) {
			this.baseVersion = version;
			if ( this.onBaseVersion ) {
				this.onBaseVersion( version );
			}
		},
	};

	// Prototype-only debug hook; the e2e specs use it to await readiness.
	window.__gutenbergDEBridge = bridge;

	async function sha256Hex( text ) {
		const digest = await window.crypto.subtle.digest(
			'SHA-256',
			new TextEncoder().encode( text )
		);
		return Array.from( new Uint8Array( digest ) )
			.map( ( b ) => b.toString( 16 ).padStart( 2, '0' ) )
			.join( '' );
	}

	async function hashContentVersion( content ) {
		return 'v1:' + ( await sha256Hex( content ) );
	}

	/**
	 * Splits serialized content into byte-exact top-level chunks. Mirrors the
	 * PHP engine's splitter so client-side hashes match server-side hashes.
	 *
	 * @param {string} content Serialized post content.
	 * @return {string[]} Ordered list of chunks.
	 */
	function splitTopLevelChunks( content ) {
		if ( '' === content ) {
			return [];
		}
		const chunks = [];
		let chunkStart = 0;
		let depth = 0;
		const pattern = /<!--\s+(\/)?wp:[a-z][a-z0-9_\-/]*(?:\s+[\s\S]*?)?-->/g;
		let match;
		while ( ( match = pattern.exec( content ) ) !== null ) {
			const tokenStart = match.index;
			const tokenEnd = tokenStart + match[ 0 ].length;
			const isCloser = !! match[ 1 ];
			const isVoid = ! isCloser && match[ 0 ].endsWith( '/-->' );

			if ( isCloser ) {
				if ( depth > 0 ) {
					depth--;
					if ( 0 === depth ) {
						chunks.push( content.slice( chunkStart, tokenEnd ) );
						chunkStart = tokenEnd;
					}
				}
				continue;
			}
			if ( isVoid ) {
				if ( 0 === depth ) {
					if ( tokenStart > chunkStart ) {
						chunks.push( content.slice( chunkStart, tokenStart ) );
					}
					chunks.push( content.slice( tokenStart, tokenEnd ) );
					chunkStart = tokenEnd;
				}
				continue;
			}
			if ( 0 === depth ) {
				if ( tokenStart > chunkStart ) {
					chunks.push( content.slice( chunkStart, tokenStart ) );
				}
				chunkStart = tokenStart;
			}
			depth++;
		}
		if ( chunkStart < content.length ) {
			chunks.push( content.slice( chunkStart ) );
		}
		return chunks;
	}

	async function approvalHashesFor( content ) {
		const unique = Array.from( new Set( splitTopLevelChunks( content ) ) );
		return Promise.all( unique.map( sha256Hex ) );
	}

	function matchesPostSave( options ) {
		if ( ! options.path || ! options.data ) {
			return false;
		}
		if ( 'string' !== typeof options.data.content ) {
			return false;
		}
		const method = ( options.method || 'GET' ).toUpperCase();
		if ( 'POST' !== method && 'PUT' !== method && 'PATCH' !== method ) {
			return false;
		}
		return /^\/wp\/v2\/(posts|pages)\/\d+(\?|$)/.test( options.path );
	}

	apiFetch.use( ( options, next ) => {
		if ( ! matchesPostSave( options ) ) {
			return next( options );
		}

		const ready = bridge.ready || Promise.resolve();
		return ready
			.catch( () => {} )
			.then( async () => {
				if ( ! bridge.baseVersion ) {
					// The accepted state is unknown (initial fetch failed or
					// still racing); fall through to the legacy save path.
					return next( options );
				}

				let approvals = [];
				if ( ! bridge.disableAutoApprovals ) {
					try {
						approvals = await approvalHashesFor(
							options.data.content
						);
					} catch {
						// No SubtleCrypto (insecure context): protected
						// changes will sequester into review blocks instead.
					}
				}

				const send = () =>
					next( {
						...options,
						data: {
							...options.data,
							de_approvals: approvals,
							de_base_version: bridge.baseVersion,
						},
					} );

				const handle = ( promise ) =>
					promise.catch( ( error ) => {
						if (
							error &&
							'de_stale_base' === error.code &&
							bridge.ui
						) {
							return bridge.ui.resolveStale( error.data ).then(
								( action ) => {
									if ( 'overwrite' === action ) {
										bridge.setBaseVersion(
											error.data.version
										);
										return handle( send() );
									}
									throw error;
								},
								() => {
									throw error;
								}
							);
						}
						throw error;
					} );

				return handle( send() ).then( async ( response ) => {
					const raw =
						response && response.content && response.content.raw;
					if ( 'string' === typeof raw ) {
						try {
							bridge.setBaseVersion(
								await hashContentVersion( raw )
							);
						} catch {
							if ( bridge.refreshState ) {
								bridge.refreshState( true );
							}
						}
						if ( raw !== options.data.content ) {
							// Retraction UX: adopt the accepted content so
							// the pending-review wrapper appears in place of
							// the proposal immediately. Deferred so the save
							// flow settles before the block list resets.
							window.setTimeout( () => {
								wp.data
									.dispatch( 'core/block-editor' )
									.resetBlocks( parse( raw ) );
							} );
							wp.data
								.dispatch( 'core/notices' )
								.createNotice(
									'warning',
									__(
										'Some protected changes were sequestered into pending-review blocks.'
									)
								);
						}
					}
					if ( bridge.refreshState ) {
						bridge.refreshState( false );
					}
					return response;
				} );
			} );
	} );

	/*
	 * The resolution dialog for a sequestered proposal, modeled on the
	 * invalid-block "Resolve" modal but with a single editable pane instead
	 * of a diff. Approve applies the (possibly edited) markup, Reject keeps
	 * the kses-filtered placeholder; either replaces the wrapper block, which
	 * unmounts the dialog with it.
	 */
	function ResolveModal( {
		onApprove,
		onChange,
		onReject,
		onRequestClose,
		proposed,
	} ) {
		return el(
			Modal,
			{
				onRequestClose,
				size: 'large',
				title: __( 'Resolve pending changes' ),
			},
			el(
				'p',
				{ style: { marginTop: 0 } },
				__(
					'A collaborator proposed markup that needs review before it becomes part of the post. Approve it to adopt the markup shown below, or reject it to keep the filtered version.'
				)
			),
			el( TextareaControl, {
				__nextHasNoMarginBottom: true,
				help: __(
					'Approval applies exactly the markup shown here, including any edits you make.'
				),
				label: __( 'Proposed markup' ),
				onChange,
				rows: 12,
				style: {
					fontFamily: 'Menlo, Consolas, monaco, monospace',
					fontSize: '13px',
				},
				value: proposed,
			} ),
			el(
				'p',
				{ style: { fontSize: '12px' } },
				__(
					'Approving requires the unfiltered_html capability and takes effect on save; without it the change is sequestered again.'
				)
			),
			el(
				Flex,
				{ justify: 'flex-end' },
				el(
					FlexItem,
					{},
					el(
						Button,
						{ onClick: onRequestClose, variant: 'tertiary' },
						__( 'Cancel' )
					)
				),
				el(
					FlexItem,
					{},
					el(
						Button,
						{
							isDestructive: true,
							onClick: onReject,
							variant: 'secondary',
						},
						__( 'Reject' )
					)
				),
				el(
					FlexItem,
					{},
					el(
						Button,
						{ onClick: onApprove, variant: 'primary' },
						__( 'Approve' )
					)
				)
			)
		);
	}

	/**
	 * The review surface for a sequestered proposal, styled after the
	 * invalid-block recovery flow: the block renders a standard warning box
	 * with a Resolve action, and resolution happens in the modal above. The
	 * safe placeholder is not rendered in-canvas; only the block's server
	 * render callback outputs it, on the front end.
	 *
	 * The proposed markup is only ever rendered as text (editable) — never as
	 * live DOM in the editor canvas, which is same-origin and privileged.
	 */
	registerBlockType( 'de/pending-review', {
		apiVersion: 3,
		attributes: {
			pendingId: { type: 'string' },
			// Authoritative in the comment attributes: the placeholder markup
			// is also the block's inner content (for unregistered-context
			// degradation), but that inner content contains block delimiters,
			// so it reparses as nested blocks rather than raw text. The
			// attribute is the reliable source the editor renders from.
			placeholder: { type: 'string' },
			proposed: { type: 'string' },
			proposedHash: { type: 'string' },
			proposer: { type: 'number' },
		},
		category: 'text',
		description: __(
			'A protected change awaiting review. Approve it to adopt the proposed markup, or reject it to keep the filtered version.'
		),
		edit: function PendingReviewEdit( {
			attributes,
			clientId,
			setAttributes,
		} ) {
			const [ resolving, setResolving ] = useState( false );
			const { removeBlock, replaceBlocks } =
				useDispatch( 'core/block-editor' );
			const blockProps = useBlockProps();

			// Replaces the wrapper with the blocks parsed from `markup`. An
			// empty result (e.g. the filter stripped everything) removes the
			// wrapper outright.
			const resolveWith = ( markup ) => {
				const blocks = parse(
					'string' === typeof markup ? markup : ''
				);

				if ( blocks.length > 0 ) {
					replaceBlocks( clientId, blocks );
				} else {
					removeBlock( clientId );
				}
			};

			// The proposer is deliberately not surfaced: attribution is
			// transport-level and advisory, so displaying it as authorship
			// would overstate what the server can vouch for. It stays in the
			// block attributes for auditing.
			return el(
				'div',
				blockProps,
				el(
					Warning,
					{
						actions: [
							el(
								Button,
								{
									__next40pxDefaultSize: true,
									key: 'resolve',
									onClick: () => setResolving( true ),
									variant: 'primary',
								},
								__( 'Resolve' )
							),
						],
					},
					__( 'Block contains changes awaiting review.' )
				),
				resolving &&
					el( ResolveModal, {
						onApprove: () => resolveWith( attributes.proposed ),
						onChange: ( value ) =>
							setAttributes( { proposed: value } ),
						onReject: () => resolveWith( attributes.placeholder ),
						onRequestClose: () => setResolving( false ),
						proposed: attributes.proposed || '',
					} )
			);
		},
		icon: 'shield',
		// A void block: the server render callback outputs the safe
		// placeholder on the front end. Returning null keeps the stored
		// content a single comment, so there is no inner content to fail block
		// validation.
		save: () => null,
		supports: {
			className: false,
			customClassName: false,
			html: false,
		},
		title: __( 'Pending review' ),
	} );

	function StaleModal( { stale, onLoadRemote, onOverwrite, onCancel } ) {
		return el(
			Modal,
			{
				title: __( 'Remote changes conflict' ),
				onRequestClose: onCancel,
			},
			el(
				'p',
				{},
				sprintf(
					/* translators: %s: version hash. */
					__(
						'The post changed on the server (now %s…) since your edits were based. This prototype has no client-side merge: load the server version (discarding local edits) or overwrite it with yours.'
					),
					shortVersion( stale.version )
				)
			),
			el(
				Flex,
				{ justify: 'flex-end' },
				el(
					FlexItem,
					{},
					el(
						Button,
						{ onClick: onCancel, variant: 'tertiary' },
						__( 'Cancel' )
					)
				),
				el(
					FlexItem,
					{},
					el(
						Button,
						{ onClick: onLoadRemote, variant: 'secondary' },
						__( 'Load server version' )
					)
				),
				el(
					FlexItem,
					{},
					el(
						Button,
						{
							isDestructive: true,
							onClick: onOverwrite,
							variant: 'primary',
						},
						__( 'Overwrite with mine' )
					)
				)
			)
		);
	}

	function DistributedEditingPanel() {
		const postId = useSelect(
			( select ) => select( 'core/editor' ).getCurrentPostId(),
			[]
		);
		const { resetBlocks } = useDispatch( 'core/block-editor' );

		const [ baseVersion, setBaseVersion ] = useState( null );
		const [ serverState, setServerState ] = useState( null );
		// { data, resolve, reject } while the stale-conflict modal is open.
		const [ conflict, setConflict ] = useState( null );

		const adoptServerContent = useCallback(
			( version, content ) => {
				resetBlocks( parse( content ) );
				bridge.setBaseVersion( version );
			},
			[ resetBlocks ]
		);

		const refreshServerState = useCallback(
			( adoptVersion ) => {
				if ( ! postId ) {
					return Promise.resolve( null );
				}
				return apiFetch( { path: statePath( postId ) } ).then(
					( state ) => {
						setServerState( state );
						if ( adoptVersion ) {
							bridge.setBaseVersion( state.version );
						}
						return state;
					}
				);
			},
			[ postId ]
		);

		useEffect( () => {
			if ( ! postId ) {
				return;
			}
			bridge.onBaseVersion = setBaseVersion;
			bridge.refreshState = refreshServerState;
			bridge.ready = refreshServerState( true );
			bridge.ui = {
				resolveStale: ( data ) =>
					new Promise( ( resolve, reject ) => {
						setConflict( { data, resolve, reject } );
					} ),
			};
			const timer = setInterval( () => {
				apiFetch( { path: statePath( postId ) } )
					.then( setServerState )
					.catch( () => {} );
			}, POLL_INTERVAL );
			return () => {
				clearInterval( timer );
				bridge.onBaseVersion = null;
				bridge.refreshState = null;
				bridge.ui = null;
			};
		}, [ postId, refreshServerState ] );

		if ( ! postId ) {
			return null;
		}

		const remoteChanged =
			serverState && baseVersion && serverState.version !== baseVersion;

		const panel = el(
			PluginDocumentSettingPanel,
			{
				name: 'distributed-editing',
				title: __( 'Distributed Editing' ),
			},
			el(
				'p',
				{},
				sprintf(
					/* translators: 1: local base version, 2: server version. */
					__( 'Base: %1$s… · Server: %2$s…' ),
					shortVersion( baseVersion ),
					shortVersion( serverState && serverState.version )
				)
			),
			el(
				'p',
				{},
				__(
					'Saves are validated against this base version. Protected changes from others appear as pending-review blocks in the canvas.'
				)
			),
			remoteChanged &&
				el(
					Notice,
					{ isDismissible: false, status: 'warning' },
					__( 'The post changed on the server.' ),
					' ',
					el(
						Button,
						{
							onClick: () =>
								adoptServerContent(
									serverState.version,
									serverState.content
								),
							variant: 'link',
						},
						__( 'Load server version' )
					)
				)
		);

		return el(
			Fragment,
			{},
			panel,
			conflict &&
				el( StaleModal, {
					onCancel: () => {
						conflict.reject( new Error( 'cancelled' ) );
						setConflict( null );
					},
					onLoadRemote: () => {
						adoptServerContent(
							conflict.data.version,
							conflict.data.content
						);
						conflict.resolve( 'loaded' );
						setConflict( null );
					},
					onOverwrite: () => {
						conflict.resolve( 'overwrite' );
						setConflict( null );
					},
					stale: conflict.data,
				} )
		);
	}

	registerPlugin( 'distributed-editing', {
		render: DistributedEditingPanel,
	} );
} )();
