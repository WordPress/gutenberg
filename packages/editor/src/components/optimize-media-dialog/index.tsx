import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import {
	Button,
	Modal,
	Notice,
	RangeControl,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useDebounce } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlobURL, revokeBlobURL } from '@wordpress/blob';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as uploadStore } from '@wordpress/upload-media';
import { unlock } from '../../lock-unlock';

/**
 * Quality used when neither the editor settings nor the user pick one.
 * Matches WordPress core's default JPEG quality.
 */
const DEFAULT_QUALITY = 82;

const EXTENSION_TO_MIME_TYPE: Record< string, string > = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	avif: 'image/avif',
};

/**
 * Formats a byte count as KB or MB.
 *
 * @param bytes Size in bytes.
 * @return Human-readable size.
 */
function formatSize( bytes: number ): string {
	const isMegabytes = bytes >= 1024 * 1024;
	const value = isMegabytes ? bytes / ( 1024 * 1024 ) : bytes / 1024;
	return sprintf(
		// translators: 1: File size number. 2: Unit symbol (e.g. KB).
		_x( '%1$s %2$s', 'file size' ),
		value.toLocaleString( undefined, {
			maximumFractionDigits: isMegabytes ? 2 : 0,
		} ),
		isMegabytes
			? /* translators: Unit symbol for megabyte. */
				_x( 'MB', 'unit symbol' )
			: /* translators: Unit symbol for kilobyte. */
				_x( 'KB', 'unit symbol' )
	);
}

/**
 * Downloads the original image so it can be re-encoded in the browser.
 *
 * @param url      Image URL.
 * @param fileName File name to give the download.
 * @return The image file.
 */
async function fetchOriginal( url: string, fileName: string ): Promise< File > {
	const response = await fetch( url );
	if ( ! response.ok ) {
		throw new Error( `Could not fetch ${ url } (${ response.status })` );
	}
	const blob = await response.blob();
	let { type } = blob;
	if ( ! type || type === 'application/octet-stream' ) {
		const extension = fileName.split( '.' ).pop()?.toLowerCase() ?? '';
		type = EXTENSION_TO_MIME_TYPE[ extension ] ?? type;
	}
	return new File( [ blob ], fileName, { type } );
}

/**
 * Hook that keeps a blob URL for a file, revoking the previous one.
 *
 * @param file File to create a URL for.
 * @return Blob URL, or undefined when there is no file.
 */
function useBlobUrl( file?: File | null ): string | undefined {
	const url = useMemo(
		() => ( file ? createBlobURL( file ) : undefined ),
		[ file ]
	);
	useEffect(
		() => () => {
			if ( url ) {
				revokeBlobURL( url );
			}
		},
		[ url ]
	);
	return url;
}

/**
 * Before/after view with a divider that follows a slider.
 *
 * @param props           Component props.
 * @param props.beforeUrl URL of the original image.
 * @param props.afterUrl  URL of the optimized image.
 * @return The comparison view.
 */
function CompareImages( {
	beforeUrl,
	afterUrl,
}: {
	beforeUrl: string;
	afterUrl?: string;
} ) {
	const [ position, setPosition ] = useState( 50 );

	return (
		<div
			className="editor-optimize-media-dialog__compare"
			style={
				{
					'--editor-optimize-media-position': `${ position }%`,
				} as React.CSSProperties
			}
		>
			<img src={ beforeUrl } alt="" />
			{ afterUrl && (
				<img
					className="editor-optimize-media-dialog__after"
					src={ afterUrl }
					alt=""
				/>
			) }
			<span
				className="editor-optimize-media-dialog__divider"
				aria-hidden="true"
			/>
			<span
				className="editor-optimize-media-dialog__label is-before"
				aria-hidden="true"
			>
				{ __( 'Original' ) }
			</span>
			<span
				className="editor-optimize-media-dialog__label is-after"
				aria-hidden="true"
			>
				{ __( 'Optimized' ) }
			</span>
			<input
				className="editor-optimize-media-dialog__handle"
				type="range"
				min={ 0 }
				max={ 100 }
				value={ position }
				onChange={ ( event ) =>
					setPosition( Number( event.target.value ) )
				}
				aria-label={ __( 'Compare original and optimized image' ) }
			/>
		</div>
	);
}

type OptimizeMediaDialogProps = {
	/** URL of the full-size original to optimize. */
	url: string;
	/** Called with the chosen quality (0-1) when the user accepts. */
	onConfirm: ( quality: number ) => void;
	/** Called when the dialog is dismissed without optimizing. */
	onClose: () => void;
};

/**
 * Lets the user compare an image with its optimized version, and pick the
 * quality, before the optimized copy is uploaded.
 *
 * @param props           Component props.
 * @param props.url       URL of the full-size original to optimize.
 * @param props.onConfirm Called with the chosen quality (0-1) when accepted.
 * @param props.onClose   Called when the dialog is dismissed.
 * @return The dialog.
 */
export default function OptimizeMediaDialog( {
	url,
	onConfirm,
	onClose,
}: OptimizeMediaDialogProps ) {
	const settingsQuality = useSelect(
		( select ) => select( uploadStore ).getSettings().imageQuality,
		[]
	);
	const initialQuality = settingsQuality
		? Math.round( settingsQuality * 100 )
		: DEFAULT_QUALITY;

	const { compressImagePreview } = unlock( useDispatch( uploadStore ) );

	const [ original, setOriginal ] = useState< File | null >( null );
	const [ optimized, setOptimized ] = useState< File | null >( null );
	const [ quality, setQuality ] = useState( initialQuality );
	const [ encodedQuality, setEncodedQuality ] = useState( initialQuality );
	const [ showQuality, setShowQuality ] = useState( false );
	const [ isEncoding, setIsEncoding ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	const originalUrl = useBlobUrl( original );
	const optimizedUrl = useBlobUrl( optimized );

	useEffect( () => {
		let isCurrent = true;
		const fileName = url.split( '/' ).pop()?.split( '?' )[ 0 ] || 'image';
		fetchOriginal( url, fileName )
			.then( ( file ) => isCurrent && setOriginal( file ) )
			.catch(
				() =>
					isCurrent &&
					setError( __( 'The image could not be loaded.' ) )
			);
		return () => {
			isCurrent = false;
		};
	}, [ url ] );

	const encodePreview = useCallback(
		( file: File, value: number ) => {
			setIsEncoding( true );
			compressImagePreview( file, value / 100 )
				.then( ( result: File | null ) => {
					// A null result means a newer preview replaced this one.
					if ( result ) {
						setOptimized( result );
						setEncodedQuality( value );
						setIsEncoding( false );
					}
				} )
				.catch( () => {
					setError(
						__( 'The optimized preview could not be created.' )
					);
					setIsEncoding( false );
				} );
		},
		[ compressImagePreview ]
	);
	const encode = useDebounce( encodePreview, 300 );

	useEffect( () => {
		if ( original ) {
			encode( original, quality );
		}
		// Only re-encode when the source or the chosen quality changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ original, quality ] );

	useEffect( () => () => encode.cancel(), [ encode ] );

	const savings =
		original && optimized
			? Math.round( ( 1 - optimized.size / original.size ) * 100 )
			: null;

	let summary = null;
	if ( savings !== null && savings > 0 ) {
		summary = sprintf(
			// translators: %d: Percentage the file size was reduced by.
			__( '%d%% smaller' ),
			savings
		);
	} else if ( savings !== null ) {
		summary = __( 'Not smaller than the original' );
	}

	return (
		<Modal
			title={ __( 'Optimize image' ) }
			onRequestClose={ onClose }
			className="editor-optimize-media-dialog"
			size="large"
		>
			<Stack direction="column" gap="lg">
				{ error && (
					<Notice status="error" isDismissible={ false }>
						{ error }
					</Notice>
				) }
				{ ! error && ! originalUrl && <Spinner /> }
				{ originalUrl && (
					<CompareImages
						beforeUrl={ originalUrl }
						afterUrl={ optimizedUrl }
					/>
				) }
				{ original && (
					<Stack
						className="editor-optimize-media-dialog__sizes"
						direction="row"
						align="center"
						gap="lg"
						wrap="wrap"
					>
						<span>
							{ sprintf(
								// translators: %s: File size, e.g. "280 KB".
								__( 'Original: %s' ),
								formatSize( original.size )
							) }
						</span>
						<span>
							{ optimized
								? sprintf(
										// translators: %s: File size, e.g. "60 KB".
										__( 'Optimized: %s' ),
										formatSize( optimized.size )
									)
								: __( 'Optimized: …' ) }
						</span>
						{ summary && <strong>{ summary }</strong> }
						{ isEncoding && <Spinner /> }
					</Stack>
				) }
				<ToggleControl
					label={ __( 'Adjust quality' ) }
					checked={ showQuality }
					onChange={ setShowQuality }
				/>
				{ showQuality && (
					<RangeControl
						label={ __( 'Quality' ) }
						help={ __(
							'Lower quality makes a smaller file. Compare the two versions to find the lowest quality that still looks good.'
						) }
						min={ 1 }
						max={ 100 }
						value={ quality }
						onChange={ ( value ) =>
							setQuality( value ?? initialQuality )
						}
					/>
				) }
				<Stack direction="row" justify="flex-end" gap="sm">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ onClose }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ () => onConfirm( encodedQuality / 100 ) }
						disabled={ ! optimized || isEncoding || !! error }
						accessibleWhenDisabled
					>
						{ __( 'Use optimized image' ) }
					</Button>
				</Stack>
			</Stack>
		</Modal>
	);
}
