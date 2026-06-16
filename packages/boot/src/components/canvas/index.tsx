/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode, SyntheticEvent } from 'react';

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
	Spinner,
	Tooltip as WCTooltip,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	archive,
	category as categoryIcon,
	chevronDown,
	chevronLeft,
	chevronRight,
	desktop,
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
import { useInvalidate, useNavigate } from '@wordpress/route';
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
}

interface PreviewLinkResponse {
	editLink?: string;
	previewLabel?: string;
	previewStatus?: string;
	previewStatusLabel?: string;
	previewType?: string;
	previewEditLabel?: string;
	previewTone?: CanvasData[ 'previewTone' ];
}

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
type PreparedPreviewDocument = Document & {
	__bootPreviewLinksReady?: boolean;
};

const PREVIEW_QUERY_ARG = 'site-editor-preview';

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
			new URL( first, window.location.origin ).href ===
			new URL( second, window.location.origin ).href
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

function isGlobalPreview( canvas: CanvasData ) {
	return (
		canvas.previewTone === 'global' ||
		[ 'wp_template', 'wp_template_part', 'wp_navigation' ].includes(
			canvas.postType
		)
	);
}

function PreviewEditButton( {
	editLink,
	isResolving,
	label,
}: CanvasEditButtonProps & { label: string } ) {
	const navigate = useNavigate();

	return (
		<Button
			variant="primary"
			icon={ pencil }
			disabled={ ! editLink || isResolving }
			accessibleWhenDisabled
			__next40pxDefaultSize
			onClick={ () => {
				if ( editLink ) {
					navigate( { to: editLink } );
				}
			} }
		>
			{ label }
		</Button>
	);
}

function PreviewDocumentInfo( { canvas }: CanvasProps ) {
	const invalidate = useInvalidate();
	const [ isConfiguringHomepage, setIsConfiguringHomepage ] =
		useState( false );

	if (
		! canvas.previewLabel &&
		! canvas.previewIcon &&
		! canvas.previewStatusLabel
	) {
		return null;
	}

	const icon = wrapIcon( canvas.previewIcon, false );
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
				{ canvas.previewStatusLabel && (
					<WCTooltip
						text={ canvas.previewStatusLabel }
						placement="bottom"
					>
						<span
							className="boot-preview-canvas__document-status"
							role="status"
							aria-label={ canvas.previewStatusLabel }
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
					onClose={ () => setIsConfiguringHomepage( false ) }
					onSaved={ invalidate }
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

function PreviewToolbar( {
	canvas,
	editLink,
	isResolving,
	device,
	onChangeDevice,
	canGoBack = false,
	canGoForward = false,
	onGoBack,
	onGoForward,
}: CanvasProps & {
	editLink?: string;
	isResolving?: boolean;
	device: PreviewDevice;
	onChangeDevice: ( device: PreviewDevice ) => void;
	canGoBack?: boolean;
	canGoForward?: boolean;
	onGoBack?: () => void;
	onGoForward?: () => void;
} ) {
	return (
		<div className="boot-preview-canvas__toolbar">
			<div className="boot-preview-canvas__toolbar-start">
				<PreviewEditButton
					editLink={ editLink }
					isResolving={ isResolving }
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
				<PreviewDocumentInfo canvas={ canvas } />
			</div>
			<div className="boot-preview-canvas__toolbar-end">
				<PreviewDeviceSwitcher
					device={ device }
					onChange={ onChangeDevice }
				/>
			</div>
		</div>
	);
}

function FrontendPreviewCanvas( { canvas }: CanvasProps ) {
	const fallbackPreviewMetadata = useMemo(
		() => ( {
			previewLabel: canvas.previewLabel,
			previewIcon: canvas.previewIcon,
			previewStatus: canvas.previewStatus,
			previewStatusLabel: canvas.previewStatusLabel,
			previewEditLabel: canvas.previewEditLabel,
			previewTone: canvas.previewTone,
		} ),
		[
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
	const [ previewHistory, setPreviewHistory ] = useState< string[] >(
		initialPreviewUrl ? [ initialPreviewUrl ] : []
	);
	const [ previewHistoryIndex, setPreviewHistoryIndex ] = useState( 0 );
	const previewHistoryRef = useRef( previewHistory );
	const previewHistoryIndexRef = useRef( previewHistoryIndex );
	const pendingHistoryIndexRef = useRef< number | null >( null );
	const previewContextRequestRef = useRef( 0 );

	useEffect( () => {
		previewHistoryRef.current = previewHistory;
	}, [ previewHistory ] );

	useEffect( () => {
		previewHistoryIndexRef.current = previewHistoryIndex;
	}, [ previewHistoryIndex ] );

	useEffect( () => {
		const nextPreviewUrl = addPreviewQueryArg( canvas.previewUrl );
		setCurrentEditLink( canvas.editLink );
		setPreviewMetadata( fallbackPreviewMetadata );
		setFrameSrc( nextPreviewUrl );
		setPreviewHistory( nextPreviewUrl ? [ nextPreviewUrl ] : [] );
		setPreviewHistoryIndex( 0 );
		pendingHistoryIndexRef.current = null;
	}, [ canvas.editLink, fallbackPreviewMetadata, canvas.previewUrl ] );

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
			canvas.previewIcon,
			canvas.previewLabel,
			canvas.previewStatus,
			canvas.previewStatusLabel,
			canvas.previewTone,
			fallbackPreviewMetadata,
		]
	);

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
					const link =
						event.target instanceof Element
							? ( event.target.closest(
									'a[href]'
							  ) as HTMLAnchorElement | null )
							: null;
					const href = link?.getAttribute( 'href' );
					if (
						! link ||
						! href ||
						href.startsWith( '#' ) ||
						link.target ||
						! isLocalPreviewUrl( link.href )
					) {
						return;
					}

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
			/>
			<div className="boot-preview-canvas__viewport">
				<div
					className={ clsx(
						'boot-preview-canvas__frame',
						`is-${ selectedDevice }`
					) }
				>
					{ frameSrc && (
						<iframe
							title={ __( 'Site preview' ) }
							src={ frameSrc }
							onLoad={ handleLoad }
						/>
					) }
				</div>
			</div>
		</div>
	);
}

function EditorPreviewCanvas( {
	canvas,
	children,
}: CanvasProps & { children: ReactNode } ) {
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
			<div className="boot-preview-canvas__viewport">
				<div
					className={ clsx(
						'boot-preview-canvas__frame',
						`is-${ selectedDevice }`
					) }
				>
					{ children }
				</div>
			</div>
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
						disableStartPageOptions: canvas.skipStartPageOptions,
						styles: canvas.isPreview
							? [ { css: 'body{min-height:100vh;}' } ]
							: [],
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
