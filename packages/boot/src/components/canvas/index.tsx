/**
 * External dependencies
 */
import clsx from 'clsx';
import type {
	CSSProperties,
	KeyboardEvent,
	PointerEvent as ReactPointerEvent,
	ReactNode,
	SyntheticEvent,
} from 'react';

/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	DropdownMenu,
	MenuItem,
	Notice,
	Spinner,
	Tooltip as WCTooltip,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	archive,
	category as categoryIcon,
	chevronDown,
	chevronLeft,
	chevronRight,
	desktop,
	external,
	home,
	layout,
	mobile,
	page,
	pencil,
	postList,
	settings,
	tag,
	tablet,
} from '@wordpress/icons';
import { useInvalidate, useNavigate, useSearch } from '@wordpress/route';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { CanvasData } from '../../store/types';
import { wrapIcon } from '../navigation/items';
import ConfigureHomepageModal from '../configure-homepage-modal';
import BootBackButton from './back-button';

interface CanvasProps {
	canvas: CanvasData;
}

interface CanvasEditButtonProps {
	editLink?: string;
	isResolving?: boolean;
	canEdit?: boolean;
}

interface PreviewLinkResponse {
	editLink?: string;
	previewLabel?: string;
	previewStatus?: string;
	previewStatusLabel?: string;
	previewType?: string;
	previewEditLabel?: string;
	previewCanEdit?: boolean;
	previewTone?: CanvasData[ 'previewTone' ];
}

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
type ResizablePreviewDevice = Exclude< PreviewDevice, 'desktop' >;
type ResizeSide = 'start' | 'end';
type PreparedPreviewDocument = Document & {
	__bootPreviewLinksReady?: boolean;
};

const PREVIEW_DEVICE_WIDTHS: Record< ResizablePreviewDevice, number > = {
	tablet: 780,
	mobile: 390,
};

const PREVIEW_DEVICE_MIN_WIDTHS: Record< ResizablePreviewDevice, number > = {
	tablet: 600,
	mobile: 320,
};

const PREVIEW_DEVICE_MAX_WIDTHS: Record< ResizablePreviewDevice, number > = {
	tablet: 1024,
	mobile: 480,
};

const PREVIEW_QUERY_ARG = 'site-editor-preview';
const PREVIEW_REFRESH_QUERY_ARG = 'site-editor-preview-refresh';

function addPreviewQueryArg( url?: string ) {
	if ( ! url ) {
		return undefined;
	}

	return addQueryArgs( url, {
		[ PREVIEW_QUERY_ARG ]: '1',
	} );
}

function removePreviewQueryArg( url?: string ) {
	if ( ! url ) {
		return undefined;
	}

	try {
		const parsed = new URL( url, window.location.origin );
		parsed.searchParams.delete( PREVIEW_QUERY_ARG );
		parsed.searchParams.delete( PREVIEW_REFRESH_QUERY_ARG );
		return parsed.href;
	} catch {
		return url;
	}
}

function removePreviewRefreshQueryArg( url?: string ) {
	if ( ! url ) {
		return undefined;
	}

	try {
		const parsed = new URL( url, window.location.origin );
		parsed.searchParams.delete( PREVIEW_REFRESH_QUERY_ARG );
		return parsed.href;
	} catch {
		return url;
	}
}

function urlsMatch( first?: string, second?: string ) {
	if ( ! first || ! second ) {
		return first === second;
	}

	try {
		return (
			new URL(
				removePreviewRefreshQueryArg( first ) || '',
				window.location.origin
			).href ===
			new URL(
				removePreviewRefreshQueryArg( second ) || '',
				window.location.origin
			).href
		);
	} catch {
		return first === second;
	}
}

function getPreviewIconFromType(
	previewType?: string,
	fallback?: CanvasData[ 'previewIcon' ]
) {
	switch ( previewType ) {
		case 'home':
			return home;
		case 'page':
			return page;
		case 'post':
			return postList;
		case 'template':
			return layout;
		case 'category':
			return categoryIcon;
		case 'tag':
			return tag;
		case 'archive':
			return archive;
		default:
			return fallback;
	}
}

function isLocalPreviewUrl( url?: string ) {
	if ( ! url ) {
		return false;
	}

	try {
		return (
			new URL( url, window.location.origin ).origin ===
			window.location.origin
		);
	} catch {
		return false;
	}
}

function getElementFromEventTarget( target: EventTarget | null ) {
	if ( ! target || ! ( 'nodeType' in target ) ) {
		return null;
	}

	const node = target as globalThis.Node;
	if ( node.nodeType === 1 ) {
		return node as Element;
	}

	return node.parentElement;
}

function getLinkFromPreviewEvent( event: MouseEvent ) {
	return getElementFromEventTarget( event.target )?.closest(
		'a[href]'
	) as HTMLAnchorElement | null;
}

function isResizablePreviewDevice(
	device: PreviewDevice
): device is ResizablePreviewDevice {
	return device !== 'desktop';
}

function clampPreviewWidth(
	width: number,
	device: ResizablePreviewDevice,
	viewportWidth?: number
) {
	const maxAvailableWidth =
		viewportWidth && viewportWidth > 0
			? Math.max( 280, viewportWidth - 32 )
			: PREVIEW_DEVICE_MAX_WIDTHS[ device ];
	const maxWidth = Math.min(
		PREVIEW_DEVICE_MAX_WIDTHS[ device ],
		maxAvailableWidth
	);
	const minWidth = Math.min( PREVIEW_DEVICE_MIN_WIDTHS[ device ], maxWidth );

	return Math.round( Math.min( Math.max( width, minWidth ), maxWidth ) );
}

function getPreviewStatusClass( status?: string ) {
	switch ( status ) {
		case 'homepage':
		case 'publish':
			return 'is-published';
		case 'future':
			return 'is-scheduled';
		case 'draft':
		case 'pending':
		case 'auto-draft':
			return 'is-draft';
		case 'private':
			return 'is-private';
		default:
			return 'is-preview';
	}
}

function getPreviewStatusTooltipLabel( status?: string ) {
	switch ( status ) {
		case 'homepage':
		case 'publish':
			return __( 'Published' );
		case 'future':
			return __( 'Scheduled' );
		case 'draft':
		case 'auto-draft':
			return __( 'Draft' );
		case 'pending':
			return __( 'Pending review' );
		case 'private':
			return __( 'Private' );
		case 'trash':
			return __( 'Trash' );
		case 'archive':
			return __( 'Archive' );
		default:
			return __( 'Preview' );
	}
}

function isGlobalPreview( canvas: CanvasData ) {
	return (
		canvas.previewTone === 'global' ||
		[ 'wp_template', 'wp_template_part', 'wp_navigation' ].includes(
			canvas.postType
		)
	);
}

function shouldUseUniversalCanvas( canvas: CanvasData ) {
	return (
		! canvas.isPreview &&
		! [
			'wp_template',
			'wp_template_part',
			'wp_navigation',
			'wp_block',
		].includes( canvas.postType )
	);
}

function PreviewEditButton( {
	editLink,
	isResolving,
	canEdit,
	label,
}: CanvasEditButtonProps & { label: string } ) {
	const navigate = useNavigate();
	const isDisabled = ! editLink || isResolving || canEdit === false;

	return (
		<Button
			variant="primary"
			icon={ pencil }
			disabled={ isDisabled }
			accessibleWhenDisabled
			__next40pxDefaultSize
			onClick={ () => {
				if ( ! isDisabled && editLink ) {
					navigate( { to: editLink } );
				}
			} }
		>
			{ label }
		</Button>
	);
}

function PreviewDocumentInfo( {
	canvas,
	onPreviewRefresh,
}: CanvasProps & { onPreviewRefresh?: () => void } ) {
	const invalidate = useInvalidate();
	const navigate = useNavigate();
	const searchParams = useSearch( { strict: false } ) as Record<
		string,
		unknown
	>;
	const [ isConfiguringHomepage, setIsConfiguringHomepage ] =
		useState( false );
	const showPreviewStatus = Boolean(
		canvas.previewStatus || canvas.previewStatusLabel
	);
	const hasConfigureHomepageFlag = Boolean( searchParams.configureHomepage );
	const clearConfigureHomepageFlag = useCallback( () => {
		if ( ! hasConfigureHomepageFlag ) {
			return;
		}

		navigate( {
			search: ( currentSearch: Record< string, unknown > ) => ( {
				...currentSearch,
				configureHomepage: undefined,
			} ),
		} as never );
	}, [ hasConfigureHomepageFlag, navigate ] );
	const closeConfigureHomepageModal = useCallback( () => {
		setIsConfiguringHomepage( false );
		clearConfigureHomepageFlag();
	}, [ clearConfigureHomepageFlag ] );

	useEffect( () => {
		if ( canvas.previewStatus === 'homepage' && hasConfigureHomepageFlag ) {
			setIsConfiguringHomepage( true );
		}
	}, [ canvas.previewStatus, hasConfigureHomepageFlag ] );

	if (
		! canvas.previewLabel &&
		! canvas.previewIcon &&
		! showPreviewStatus
	) {
		return null;
	}

	const icon = wrapIcon( canvas.previewIcon, false );
	const statusTooltipLabel = getPreviewStatusTooltipLabel(
		canvas.previewStatus
	);
	const documentInfo = (
		<>
			<div className="boot-preview-canvas__document">
				{ icon && (
					<span
						className="boot-preview-canvas__document-icon"
						aria-hidden="true"
					>
						{ icon }
					</span>
				) }
				{ canvas.previewLabel && (
					<span className="boot-preview-canvas__document-label">
						{ canvas.previewLabel }
					</span>
				) }
				{ canvas.previewStatus === 'homepage' && (
					<DropdownMenu
						className="boot-preview-canvas__document-options"
						icon={ chevronDown }
						label={ __( 'Page Options' ) }
						popoverProps={ { placement: 'bottom' } }
						toggleProps={ {
							variant: 'tertiary',
							__next40pxDefaultSize: true,
						} }
					>
						{ ( { onClose } ) => (
							<MenuItem
								icon={ settings }
								onClick={ () => {
									setIsConfiguringHomepage( true );
									onClose();
								} }
							>
								{ __( 'Configure Homepage' ) }
							</MenuItem>
						) }
					</DropdownMenu>
				) }
				{ showPreviewStatus && (
					<WCTooltip text={ statusTooltipLabel } placement="bottom">
						<span
							className="boot-preview-canvas__document-status"
							role="status"
							aria-label={ statusTooltipLabel }
							title={ statusTooltipLabel }
						>
							<span
								className={ clsx(
									'boot-preview-canvas__document-status-dot',
									getPreviewStatusClass(
										canvas.previewStatus
									)
								) }
								aria-hidden="true"
							/>
						</span>
					</WCTooltip>
				) }
			</div>
			{ isConfiguringHomepage && (
				<ConfigureHomepageModal
					onClose={ closeConfigureHomepageModal }
					onSaved={ () => {
						invalidate();
						onPreviewRefresh?.();
					} }
				/>
			) }
		</>
	);

	return documentInfo;
}

function PreviewDeviceSwitcher( {
	device,
	onChange,
}: {
	device: PreviewDevice;
	onChange: ( device: PreviewDevice ) => void;
} ) {
	return (
		<ToggleGroupControl
			className="boot-preview-canvas__device-switcher"
			label={ __( 'Device preview' ) }
			hideLabelFromVision
			value={ device }
			onChange={ ( nextDevice ) => {
				if ( nextDevice ) {
					onChange( nextDevice as PreviewDevice );
				}
			} }
			isBlock
		>
			<ToggleGroupControlOptionIcon
				value="desktop"
				icon={ desktop }
				label={ __( 'Desktop view' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="tablet"
				icon={ tablet }
				label={ __( 'Tablet view' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="mobile"
				icon={ mobile }
				label={ __( 'Mobile view' ) }
			/>
		</ToggleGroupControl>
	);
}

function PreviewLiveSiteButton( { url }: { url?: string } ) {
	if ( ! url ) {
		return null;
	}

	return (
		<Button
			className="boot-preview-canvas__live-site-button"
			icon={ external }
			label={ __( 'View site in new tab' ) }
			href={ url }
			target="_blank"
			rel="noreferrer"
			variant="tertiary"
			__next40pxDefaultSize
		/>
	);
}

function ExternalPreviewNotice( {
	url,
	onDismiss,
}: {
	url?: string;
	onDismiss: () => void;
} ) {
	if ( ! url ) {
		return null;
	}

	return (
		<Notice
			className="boot-preview-canvas__external-notice"
			status="warning"
			onDismiss={ onDismiss }
		>
			{ sprintf(
				/* translators: %s: The external URL that cannot be previewed. */
				__(
					"I can't preview that link (%s) because it's external to your website."
				),
				url
			) + ' ' }
			<a
				className="boot-preview-canvas__external-notice-link"
				href={ url }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Open in new tab' ) }
			</a>
		</Notice>
	);
}

function PreviewViewport( {
	device,
	children,
}: {
	device: PreviewDevice;
	children: ReactNode;
} ) {
	const viewportRef = useRef< HTMLDivElement >( null );
	const frameRef = useRef< HTMLDivElement >( null );
	const resizeStateRef = useRef< {
		side: ResizeSide;
		startWidth: number;
		startX: number;
	} | null >( null );
	const [ customWidth, setCustomWidth ] = useState< number | undefined >();
	const [ isResizing, setIsResizing ] = useState( false );

	useEffect( () => {
		setCustomWidth( undefined );
		setIsResizing( false );
		resizeStateRef.current = null;
	}, [ device ] );

	const getNextWidth = useCallback(
		( width: number ) => {
			if ( ! isResizablePreviewDevice( device ) ) {
				return width;
			}

			return clampPreviewWidth(
				width,
				device,
				viewportRef.current?.clientWidth
			);
		},
		[ device ]
	);

	const updateResizeWidth = useCallback(
		( clientX: number ) => {
			const resizeState = resizeStateRef.current;
			if ( ! resizeState || ! isResizablePreviewDevice( device ) ) {
				return;
			}

			const delta = clientX - resizeState.startX;
			const nextWidth =
				resizeState.side === 'end'
					? resizeState.startWidth + delta * 2
					: resizeState.startWidth - delta * 2;

			setCustomWidth( getNextWidth( nextWidth ) );
		},
		[ device, getNextWidth ]
	);

	const stopResizing = useCallback( () => {
		resizeStateRef.current = null;
		setIsResizing( false );
	}, [] );

	useEffect( () => {
		if ( ! isResizing ) {
			return;
		}

		const handlePointerMove = ( event: globalThis.PointerEvent ) => {
			updateResizeWidth( event.clientX );
		};
		const handlePointerUp = () => {
			stopResizing();
		};

		window.addEventListener( 'pointermove', handlePointerMove );
		window.addEventListener( 'pointerup', handlePointerUp );
		window.addEventListener( 'pointercancel', handlePointerUp );

		return () => {
			window.removeEventListener( 'pointermove', handlePointerMove );
			window.removeEventListener( 'pointerup', handlePointerUp );
			window.removeEventListener( 'pointercancel', handlePointerUp );
		};
	}, [ isResizing, stopResizing, updateResizeWidth ] );

	const handleResizePointerDown = useCallback(
		( event: ReactPointerEvent< HTMLButtonElement >, side: ResizeSide ) => {
			if ( ! isResizablePreviewDevice( device ) ) {
				return;
			}

			event.preventDefault();
			resizeStateRef.current = {
				side,
				startWidth:
					frameRef.current?.getBoundingClientRect().width ||
					PREVIEW_DEVICE_WIDTHS[ device ],
				startX: event.clientX,
			};
			setIsResizing( true );
		},
		[ device ]
	);

	const handleResizeKeyDown = useCallback(
		( event: KeyboardEvent< HTMLButtonElement > ) => {
			if ( ! isResizablePreviewDevice( device ) ) {
				return;
			}

			if ( event.key === 'Home' ) {
				event.preventDefault();
				setCustomWidth( undefined );
				return;
			}

			if ( event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' ) {
				return;
			}

			event.preventDefault();
			const currentWidth = customWidth || PREVIEW_DEVICE_WIDTHS[ device ];
			const delta = event.key === 'ArrowRight' ? 10 : -10;
			setCustomWidth( getNextWidth( currentWidth + delta ) );
		},
		[ customWidth, device, getNextWidth ]
	);

	const isResizable = isResizablePreviewDevice( device );
	const frameStyle: CSSProperties | undefined = isResizable
		? {
				maxInlineSize: `${
					customWidth || PREVIEW_DEVICE_WIDTHS[ device ]
				}px`,
		  }
		: undefined;

	return (
		<div className="boot-preview-canvas__viewport" ref={ viewportRef }>
			<div
				ref={ frameRef }
				className={ clsx(
					'boot-preview-canvas__frame',
					`is-${ device }`,
					{
						'is-resizable': isResizable,
						'is-resizing': isResizing,
					}
				) }
				style={ frameStyle }
			>
				{ children }
				{ isResizable && (
					<>
						<button
							type="button"
							className="boot-preview-canvas__resize-handle is-start"
							aria-label={ __( 'Resize preview width' ) }
							title={ __( 'Resize preview width' ) }
							onPointerDown={ ( event ) =>
								handleResizePointerDown( event, 'start' )
							}
							onPointerCancel={ stopResizing }
							onKeyDown={ handleResizeKeyDown }
						/>
						<button
							type="button"
							className="boot-preview-canvas__resize-handle is-end"
							aria-label={ __( 'Resize preview width' ) }
							title={ __( 'Resize preview width' ) }
							onPointerDown={ ( event ) =>
								handleResizePointerDown( event, 'end' )
							}
							onPointerCancel={ stopResizing }
							onKeyDown={ handleResizeKeyDown }
						/>
					</>
				) }
			</div>
		</div>
	);
}

function PreviewToolbar( {
	canvas,
	editLink,
	isResolving,
	device,
	onChangeDevice,
	livePreviewUrl,
	canGoBack = false,
	canGoForward = false,
	onGoBack,
	onGoForward,
	onPreviewRefresh,
}: CanvasProps & {
	editLink?: string;
	isResolving?: boolean;
	device: PreviewDevice;
	onChangeDevice: ( device: PreviewDevice ) => void;
	livePreviewUrl?: string;
	canGoBack?: boolean;
	canGoForward?: boolean;
	onGoBack?: () => void;
	onGoForward?: () => void;
	onPreviewRefresh?: () => void;
} ) {
	return (
		<div className="boot-preview-canvas__toolbar">
			<div className="boot-preview-canvas__toolbar-start">
				<PreviewEditButton
					editLink={ editLink }
					isResolving={ isResolving }
					canEdit={ canvas.previewCanEdit }
					label={ canvas.previewEditLabel || __( 'Edit' ) }
				/>
				<div
					className="boot-preview-canvas__history"
					aria-label={ __( 'Preview history' ) }
				>
					<Button
						className="boot-preview-canvas__history-button"
						icon={ chevronLeft }
						iconSize={ 18 }
						label={ __( 'Back in preview' ) }
						disabled={ ! canGoBack }
						accessibleWhenDisabled
						__next40pxDefaultSize
						onClick={ onGoBack }
					/>
					<Button
						className="boot-preview-canvas__history-button"
						icon={ chevronRight }
						iconSize={ 18 }
						label={ __( 'Forward in preview' ) }
						disabled={ ! canGoForward }
						accessibleWhenDisabled
						__next40pxDefaultSize
						onClick={ onGoForward }
					/>
				</div>
			</div>
			<div className="boot-preview-canvas__toolbar-center">
				<PreviewDocumentInfo
					canvas={ canvas }
					onPreviewRefresh={ onPreviewRefresh }
				/>
			</div>
			<div className="boot-preview-canvas__toolbar-end">
				<PreviewDeviceSwitcher
					device={ device }
					onChange={ onChangeDevice }
				/>
				<PreviewLiveSiteButton url={ livePreviewUrl } />
			</div>
		</div>
	);
}

function FrontendPreviewCanvas( { canvas }: CanvasProps ) {
	const searchParams = useSearch( { strict: false } ) as Record<
		string,
		unknown
	>;
	const homepagePreviewReset =
		canvas.previewStatus === 'homepage' &&
		typeof searchParams.homepagePreviewReset === 'string'
			? searchParams.homepagePreviewReset
			: '';
	const fallbackPreviewMetadata = useMemo(
		() => ( {
			previewLabel: canvas.previewLabel,
			previewIcon: canvas.previewIcon,
			previewStatus: canvas.previewStatus,
			previewStatusLabel: canvas.previewStatusLabel,
			previewEditLabel: canvas.previewEditLabel,
			previewCanEdit: canvas.previewCanEdit,
			previewTone: canvas.previewTone,
		} ),
		[
			canvas.previewCanEdit,
			canvas.previewEditLabel,
			canvas.previewIcon,
			canvas.previewLabel,
			canvas.previewStatus,
			canvas.previewStatusLabel,
			canvas.previewTone,
		]
	);
	const [ currentEditLink, setCurrentEditLink ] = useState( canvas.editLink );
	const [ previewMetadata, setPreviewMetadata ] = useState(
		fallbackPreviewMetadata
	);
	const [ isResolving, setIsResolving ] = useState( false );
	const [ selectedDevice, setSelectedDevice ] =
		useState< PreviewDevice >( 'desktop' );
	const initialPreviewUrl = addPreviewQueryArg( canvas.previewUrl );
	const [ frameSrc, setFrameSrc ] = useState( initialPreviewUrl );
	const [ frameRefreshKey, setFrameRefreshKey ] = useState( 0 );
	const [ previewHistory, setPreviewHistory ] = useState< string[] >(
		initialPreviewUrl ? [ initialPreviewUrl ] : []
	);
	const [ previewHistoryIndex, setPreviewHistoryIndex ] = useState( 0 );
	const previewHistoryRef = useRef( previewHistory );
	const previewHistoryIndexRef = useRef( previewHistoryIndex );
	const pendingHistoryIndexRef = useRef< number | null >( null );
	const previewContextRequestRef = useRef( 0 );
	const [ externalPreviewUrl, setExternalPreviewUrl ] = useState< string >();

	useEffect( () => {
		previewHistoryRef.current = previewHistory;
	}, [ previewHistory ] );

	useEffect( () => {
		previewHistoryIndexRef.current = previewHistoryIndex;
	}, [ previewHistoryIndex ] );

	useEffect( () => {
		previewContextRequestRef.current += 1;
		const nextPreviewUrl = addPreviewQueryArg( canvas.previewUrl );
		setIsResolving( false );
		setCurrentEditLink( canvas.editLink );
		setPreviewMetadata( fallbackPreviewMetadata );
		setFrameSrc( nextPreviewUrl );
		setPreviewHistory( nextPreviewUrl ? [ nextPreviewUrl ] : [] );
		setPreviewHistoryIndex( 0 );
		setExternalPreviewUrl( undefined );
		pendingHistoryIndexRef.current = null;
		setFrameRefreshKey( ( key ) => key + 1 );
	}, [
		canvas.editLink,
		fallbackPreviewMetadata,
		homepagePreviewReset,
		canvas.previewUrl,
	] );

	const resolveEditLink = useCallback(
		async ( url?: string ) => {
			const requestId = previewContextRequestRef.current + 1;
			previewContextRequestRef.current = requestId;

			if ( ! url ) {
				setCurrentEditLink( canvas.editLink );
				setPreviewMetadata( fallbackPreviewMetadata );
				return;
			}

			setIsResolving( true );

			try {
				const response = await apiFetch< PreviewLinkResponse >( {
					path: addQueryArgs(
						'/gutenberg/v1/site-editor-preview-link',
						{ url: removePreviewQueryArg( url ) }
					),
				} );

				if ( previewContextRequestRef.current !== requestId ) {
					return;
				}

				setCurrentEditLink( response.editLink );
				setPreviewMetadata( {
					previewLabel: response.previewLabel || canvas.previewLabel,
					previewIcon: getPreviewIconFromType(
						response.previewType,
						canvas.previewIcon
					),
					previewStatus:
						response.previewStatus || canvas.previewStatus,
					previewStatusLabel:
						response.previewStatusLabel ||
						canvas.previewStatusLabel,
					previewEditLabel:
						response.previewEditLabel || canvas.previewEditLabel,
					previewCanEdit:
						response.previewCanEdit ?? canvas.previewCanEdit,
					previewTone: response.previewTone || canvas.previewTone,
				} );
			} catch {
				if ( previewContextRequestRef.current !== requestId ) {
					return;
				}

				setCurrentEditLink( canvas.editLink );
				setPreviewMetadata( fallbackPreviewMetadata );
			} finally {
				if ( previewContextRequestRef.current === requestId ) {
					setIsResolving( false );
				}
			}
		},
		[
			canvas.editLink,
			canvas.previewEditLabel,
			canvas.previewCanEdit,
			canvas.previewIcon,
			canvas.previewLabel,
			canvas.previewStatus,
			canvas.previewStatusLabel,
			canvas.previewTone,
			fallbackPreviewMetadata,
		]
	);

	const refreshCurrentPreview = useCallback( () => {
		previewContextRequestRef.current += 1;
		setIsResolving( false );
		setCurrentEditLink( canvas.editLink );
		setPreviewMetadata( fallbackPreviewMetadata );

		const currentPreviewUrl =
			previewHistoryRef.current[ previewHistoryIndexRef.current ] ||
			frameSrc ||
			addPreviewQueryArg( canvas.previewUrl );

		if ( currentPreviewUrl ) {
			setFrameSrc(
				addQueryArgs(
					removePreviewRefreshQueryArg( currentPreviewUrl ),
					{
						[ PREVIEW_REFRESH_QUERY_ARG ]: Date.now().toString(),
					}
				)
			);
		}

		setFrameRefreshKey( ( key ) => key + 1 );
	}, [
		canvas.editLink,
		canvas.previewUrl,
		fallbackPreviewMetadata,
		frameSrc,
	] );

	const preparePreviewDocument = useCallback(
		( iframe: HTMLIFrameElement ) => {
			const frameDocument = iframe.contentDocument;
			if ( ! frameDocument ) {
				return;
			}

			const links = Array.from(
				frameDocument.querySelectorAll< HTMLAnchorElement >( 'a[href]' )
			);
			links.forEach( ( link ) => {
				const href = link.getAttribute( 'href' );
				if ( ! href || href.startsWith( '#' ) || link.target ) {
					return;
				}

				if ( ! isLocalPreviewUrl( link.href ) ) {
					return;
				}

				const previewUrl = addPreviewQueryArg( link.href );
				if ( previewUrl ) {
					link.href = previewUrl;
				}
			} );

			const preparedDocument = frameDocument as PreparedPreviewDocument;
			if ( preparedDocument.__bootPreviewLinksReady ) {
				return;
			}

			preparedDocument.__bootPreviewLinksReady = true;
			frameDocument.addEventListener(
				'click',
				( event ) => {
					const link = getLinkFromPreviewEvent( event );
					const href = link?.getAttribute( 'href' );
					if ( ! link || ! href || href.startsWith( '#' ) ) {
						return;
					}

					if ( ! isLocalPreviewUrl( link.href ) ) {
						event.preventDefault();
						setExternalPreviewUrl( link.href );
						return;
					}

					if ( link.target ) {
						return;
					}

					setExternalPreviewUrl( undefined );
					const previewUrl = addPreviewQueryArg( link.href );
					if ( ! previewUrl ) {
						return;
					}

					if ( ! urlsMatch( previewUrl, link.href ) ) {
						event.preventDefault();
						if ( iframe.contentWindow ) {
							iframe.contentWindow.location.href = previewUrl;
						}
					}
				},
				true
			);
		},
		[]
	);

	const recordPreviewNavigation = useCallback( ( currentUrl?: string ) => {
		if ( ! currentUrl ) {
			return;
		}

		const pendingHistoryIndex = pendingHistoryIndexRef.current;
		if ( pendingHistoryIndex !== null ) {
			pendingHistoryIndexRef.current = null;
			setPreviewHistoryIndex( pendingHistoryIndex );
			return;
		}

		const history = previewHistoryRef.current;
		const historyIndex = previewHistoryIndexRef.current;
		if ( urlsMatch( history[ historyIndex ], currentUrl ) ) {
			return;
		}

		const nextHistory = history
			.slice( 0, historyIndex + 1 )
			.concat( currentUrl );
		setPreviewHistory( nextHistory );
		setPreviewHistoryIndex( nextHistory.length - 1 );
	}, [] );

	const handleLoad = useCallback(
		( event: SyntheticEvent< HTMLIFrameElement > ) => {
			let currentUrl = canvas.previewUrl;

			try {
				preparePreviewDocument( event.currentTarget );
				currentUrl =
					event.currentTarget.contentWindow?.location.href ||
					currentUrl;
			} catch {
				currentUrl = canvas.previewUrl;
			}

			const previewUrl = addPreviewQueryArg( currentUrl );
			if ( previewUrl && ! urlsMatch( previewUrl, currentUrl ) ) {
				setFrameSrc( previewUrl );
				return;
			}

			recordPreviewNavigation( previewUrl );
			resolveEditLink( currentUrl );
		},
		[
			canvas.previewUrl,
			preparePreviewDocument,
			recordPreviewNavigation,
			resolveEditLink,
		]
	);

	const handleHistoryNavigation = useCallback( ( offset: -1 | 1 ) => {
		const nextIndex = previewHistoryIndexRef.current + offset;
		const nextUrl = previewHistoryRef.current[ nextIndex ];
		if ( ! nextUrl ) {
			return;
		}

		pendingHistoryIndexRef.current = nextIndex;
		setPreviewHistoryIndex( nextIndex );
		setFrameSrc( nextUrl );
	}, [] );

	const previewCanvas = {
		...canvas,
		...previewMetadata,
	};
	const currentPreviewUrl =
		previewHistory[ previewHistoryIndex ] || frameSrc || canvas.previewUrl;
	const livePreviewUrl = removePreviewQueryArg( currentPreviewUrl );

	return (
		<div
			className={ clsx( 'boot-preview-canvas', {
				'is-global-preview': isGlobalPreview( previewCanvas ),
			} ) }
		>
			<PreviewToolbar
				canvas={ previewCanvas }
				editLink={ currentEditLink }
				isResolving={ isResolving }
				device={ selectedDevice }
				onChangeDevice={ setSelectedDevice }
				canGoBack={ previewHistoryIndex > 0 }
				canGoForward={ previewHistoryIndex < previewHistory.length - 1 }
				onGoBack={ () => handleHistoryNavigation( -1 ) }
				onGoForward={ () => handleHistoryNavigation( 1 ) }
				onPreviewRefresh={ refreshCurrentPreview }
				livePreviewUrl={ livePreviewUrl }
			/>
			<ExternalPreviewNotice
				url={ externalPreviewUrl }
				onDismiss={ () => setExternalPreviewUrl( undefined ) }
			/>
			<PreviewViewport device={ selectedDevice }>
				{ frameSrc && (
					<iframe
						key={ frameRefreshKey }
						title={ __( 'Site preview' ) }
						src={ frameSrc }
						onLoad={ handleLoad }
					/>
				) }
			</PreviewViewport>
		</div>
	);
}

function EditorPreviewCanvas( {
	canvas,
	children,
}: CanvasProps & {
	children: ReactNode;
} ) {
	const [ selectedDevice, setSelectedDevice ] =
		useState< PreviewDevice >( 'desktop' );

	return (
		<div
			className={ clsx( 'boot-preview-canvas', {
				'is-global-preview': isGlobalPreview( canvas ),
			} ) }
		>
			<PreviewToolbar
				canvas={ canvas }
				editLink={ canvas.editLink }
				device={ selectedDevice }
				onChangeDevice={ setSelectedDevice }
			/>
			<PreviewViewport device={ selectedDevice }>
				{ children }
			</PreviewViewport>
		</div>
	);
}

/**
 * Canvas component that dynamically loads and renders the lazy editor.
 *
 * @param {Object} props        - Component props
 * @param {Object} props.canvas - Canvas data containing postType and postId
 * @return Canvas surface with editor
 */
export default function Canvas( { canvas }: CanvasProps ) {
	const [ Editor, setEditor ] = useState< any >( null );

	useEffect( () => {
		// Dynamically import the lazy-editor module
		import( '@wordpress/lazy-editor' )
			.then( ( module ) => {
				setEditor( () => module.Editor );
			} )
			.catch( ( error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Failed to load lazy editor:', error );
			} );
	}, [] );

	if ( canvas.isPreview && canvas.previewUrl ) {
		return <FrontendPreviewCanvas canvas={ canvas } />;
	}

	// Show spinner while loading the editor module
	if ( ! Editor ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
					padding: '2rem',
				} }
			>
				<Spinner />
			</div>
		);
	}

	// Render back button in full-screen mode (when not preview)
	// Uses render prop pattern to receive fillProps from Slot
	const backButton = ! canvas.isPreview
		? ( { length }: { length: number } ) => (
				<BootBackButton length={ length } />
		  )
		: undefined;

	const editor = (
		<div style={ { height: '100%', position: 'relative' } }>
			<div
				style={ { height: '100%' } }
				// @ts-expect-error inert not typed properly
				inert={ canvas.isPreview ? 'true' : undefined }
			>
				<Editor
					postType={ canvas.postType }
					postId={ canvas.postId }
					settings={ {
						isPreviewMode: canvas.isPreview,
						...( shouldUseUniversalCanvas( canvas )
							? {
									// Prototype-only universal canvas mode: content
									// entities should open with their full template
									// visible so the user can edit content in
									// context, while direct design entity routes
									// continue to use their normal dedicated canvas.
									defaultRenderingMode: 'template-locked',
									__experimentalUniversalCanvas: true,
									__experimentalForceTemplateVisibleOnMount:
										true,
							  }
							: {} ),
						// The Extensible Site Editor has its own "Choose a
						// layout" page-creation flow. Core's existing
						// "Choose a pattern" starter modal is a separate
						// editor affordance and competes with that flow, so
						// suppress it by default for canvases rendered here.
						// Routes can still explicitly opt back in by setting
						// `skipStartPageOptions` to false.
						disableStartPageOptions:
							canvas.skipStartPageOptions ?? true,
						// Only preview mode needs a local style override. In edit
						// mode, passing an empty `styles` array here replaces the
						// lazy editor's resolved theme/global styles, which can
						// leave the editor iframe rendering with browser defaults.
						...( canvas.isPreview
							? {
									styles: [
										{ css: 'body{min-height:100vh;}' },
									],
							  }
							: {} ),
					} }
					backButton={ backButton }
				/>
			</div>
		</div>
	);

	if ( canvas.isPreview ) {
		return (
			<EditorPreviewCanvas canvas={ canvas }>
				{ editor }
			</EditorPreviewCanvas>
		);
	}

	// Render the editor with canvas data.
	return editor;
}
