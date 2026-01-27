/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useMemo,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * CompatModeIframe renders a block's edit function inside an isolated iframe.
 * This is used for blocks that need to be sandboxed from the main editor.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.clientId      The block's client ID.
 * @param {string}   props.name          The block's name.
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes Function to update block attributes.
 * @param {boolean}  props.isSelected    Whether the block is selected.
 *
 * @return {Element} The compat mode iframe component.
 */
export default function CompatModeIframe( {
	clientId,
	name,
	attributes,
	setAttributes,
	isSelected,
} ) {
	const iframeRef = useRef( null );
	const [ isReady, setIsReady ] = useState( false );
	const [ height, setHeight ] = useState( 100 );
	const [ iframeMounted, setIframeMounted ] = useState( false );
	const attributesRef = useRef( attributes );

	// Keep attributesRef in sync with latest attributes.
	attributesRef.current = attributes;

	// Get the compat mode editor URL from settings.
	const { compatModeEditorUrl, compatModeNonce } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			compatModeEditorUrl: settings.compatModeEditorUrl,
			compatModeNonce: settings.compatModeNonce,
		};
	}, [] );

	// Build the iframe URL.
	const iframeSrc = useMemo( () => {
		if ( ! compatModeEditorUrl || ! compatModeNonce ) {
			return null;
		}
		const url = new URL( compatModeEditorUrl, window.location.origin );
		url.searchParams.set( 'block_name', name );
		url.searchParams.set( '_wpnonce', compatModeNonce );
		return url.toString();
	}, [ compatModeEditorUrl, compatModeNonce, name ] );

	// Handle messages from the iframe.
	const handleMessage = useCallback(
		( event ) => {
			const iframe = iframeRef.current;
			if ( ! iframe ) {
				return;
			}

			// Get the window where the iframe element lives for origin comparison.
			const targetWindow = iframe.ownerDocument?.defaultView;
			const expectedOrigin = targetWindow?.location?.origin || window.location.origin;

			// Only accept messages from same origin.
			if ( event.origin !== expectedOrigin ) {
				return;
			}

			// Only accept messages from our iframe.
			// Check both contentWindow and the message data to verify this is our iframe.
			// During error conditions, the contentWindow reference might be different.
			const isFromOurIframe =
				event.source === iframe.contentWindow ||
				( event.data?.type?.startsWith( 'COMPAT_' ) &&
					event.source?.frameElement?.classList?.contains(
						'block-editor-compat-mode-iframe__frame'
					) );

			if ( ! isFromOurIframe ) {
				return;
			}

			const {
				type,
				attributes: newAttributes,
				height: newHeight,
			} = event.data || {};

			switch ( type ) {
				case 'COMPAT_READY':
					setIsReady( true );
					// Send initial attributes once iframe is ready.
					iframe.contentWindow.postMessage(
						{
							type: 'COMPAT_INIT',
							attributes: attributesRef.current,
							isSelected,
						},
						window.location.origin
					);
					break;

				case 'COMPAT_ATTRS_CHANGED':
					if ( newAttributes ) {
						setAttributes( newAttributes );
					}
					break;

				case 'COMPAT_RESIZE':
					if ( typeof newHeight === 'number' && newHeight > 0 ) {
						setHeight( newHeight );
					}
					break;
			}
		},
		[ isSelected, setAttributes ]
	);

	// Set up message listener.
	// IMPORTANT: The compat mode iframe is rendered inside the editor canvas iframe (via portal),
	// so messages from it go to the editor canvas window, not the main page window.
	// We need to listen on the iframe element's owner document's window.
	// NOTE: We depend on iframeMounted to ensure the effect re-runs after the ref is populated.
	useEffect( () => {
		const iframe = iframeRef.current;
		if ( ! iframe ) {
			return;
		}

		// Get the window where the iframe element lives (editor canvas window)
		const targetWindow = iframe.ownerDocument?.defaultView;
		if ( ! targetWindow ) {
			return;
		}

		targetWindow.addEventListener( 'message', handleMessage );

		// Fallback: if COMPAT_READY isn't received within 5 seconds, show the iframe anyway.
		// This handles race conditions where the message might be missed.
		const fallbackTimer = setTimeout( () => {
			if ( ! isReady ) {
				setIsReady( true );
			}
		}, 5000 );

		return () => {
			targetWindow.removeEventListener( 'message', handleMessage );
			clearTimeout( fallbackTimer );
		};
	}, [ handleMessage, iframeMounted, isReady ] );

	// Send attribute updates to iframe.
	useEffect( () => {
		const iframe = iframeRef.current;
		if ( isReady && iframe?.contentWindow ) {
			iframe.contentWindow.postMessage(
				{
					type: 'COMPAT_UPDATE_ATTRS',
					attributes,
				},
				window.location.origin
			);
		}
	}, [ attributes, isReady ] );

	// Send selection state to iframe.
	useEffect( () => {
		const iframe = iframeRef.current;
		if ( isReady && iframe?.contentWindow ) {
			iframe.contentWindow.postMessage(
				{
					type: isSelected ? 'COMPAT_SELECT' : 'COMPAT_DESELECT',
				},
				window.location.origin
			);
		}
	}, [ isSelected, isReady ] );

	if ( ! iframeSrc ) {
		return (
			<div className="block-editor-compat-mode-iframe__error">
				{ __( 'Compat mode editor URL not configured.' ) }
			</div>
		);
	}

	return (
		<div
			className="block-editor-compat-mode-iframe"
			data-block={ clientId }
		>
			{ ! isReady && (
				<div className="block-editor-compat-mode-iframe__loading">
					<Spinner />
					<span>{ __( 'Loading block editor…' ) }</span>
				</div>
			) }
			<iframe
				ref={ ( el ) => {
					iframeRef.current = el;
					if ( el && ! iframeMounted ) {
						setIframeMounted( true );
					}
				} }
				src={ iframeSrc }
				title={ __( 'Block editor iframe' ) }
				className="block-editor-compat-mode-iframe__frame"
				style={ {
					width: '100%',
					height: `${ height }px`,
					border: 'none',
					display: isReady ? 'block' : 'none',
				} }
				sandbox="allow-scripts allow-same-origin allow-forms"
			/>
		</div>
	);
}
