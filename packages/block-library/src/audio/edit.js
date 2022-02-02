/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import {
	Disabled,
	PanelBody,
	SelectControl,
	Spinner,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	RichText,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { audio as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

function AudioEdit( {
	attributes,
	className,
	noticeOperations,
	setAttributes,
	onReplace,
	isSelected,
	noticeUI,
	insertBlocksAfter,
} ) {
	const { id, autoplay, caption, loop, preload, src } = attributes;
	const isTemporaryAudio = ! id && isBlobURL( src );
	const mediaUpload = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().mediaUpload;
	}, [] );

	useEffect( () => {
		if ( ! id && isBlobURL( src ) ) {
			const file = getBlobByURL( src );

			if ( file ) {
				mediaUpload( {
					filesList: [ file ],
					onFileChange: ( [ { id: mediaId, url } ] ) => {
						setAttributes( { id: mediaId, src: url } );
					},
					onError: ( e ) => {
						setAttributes( { src: undefined, id: undefined } );
						noticeOperations.createErrorNotice( e );
					},
					allowedTypes: ALLOWED_MEDIA_TYPES,
				} );
			}
		}
	}, [] );

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	function onSelectURL( newSrc ) {
		// Set the block's src from the edit component's state, and switch off
		// the editing UI.
		if ( newSrc !== src ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock( {
				attributes: { url: newSrc },
			} );
			if ( undefined !== embedBlock && onReplace ) {
				onReplace( embedBlock );
				return;
			}
			setAttributes( { src: newSrc, id: undefined } );
		}
	}

	function onUploadError( message ) {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	function getAutoplayHelp( checked ) {
		return checked
			? __( 'Autoplay may cause usability issues for some users.' )
			: null;
	}

	function onSelectAudio( media ) {
		if ( ! media || ! media.url ) {
			// in this case there was an error and we should continue in the editing state
			// previous attributes should be removed because they may be temporary blob urls
			setAttributes( { src: undefined, id: undefined } );
			return;
		}
		// sets the block's attribute and updates the edit component from the
		// selected media, then switches off the editing UI
		setAttributes( { src: media.url, id: media.id } );
	}

	const classes = classnames( className, {
		'is-transient': isTemporaryAudio,
	} );

	const blockProps = useBlockProps( {
		className: classes,
	} );

	if ( ! src ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					onSelect={ onSelectAudio }
					onSelectURL={ onSelectURL }
					accept="audio/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					notices={ noticeUI }
					onError={ onUploadError }
				/>
			</div>
		);
	}

	return (
		<>
			<BlockControls group="other">
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ src }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					accept="audio/*"
					onSelect={ onSelectAudio }
					onSelectURL={ onSelectURL }
					onError={ onUploadError }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Audio settings' ) }>
					<ToggleControl
						label={ __( 'Autoplay' ) }
						onChange={ toggleAttribute( 'autoplay' ) }
						checked={ autoplay }
						help={ getAutoplayHelp }
					/>
					<ToggleControl
						label={ __( 'Loop' ) }
						onChange={ toggleAttribute( 'loop' ) }
						checked={ loop }
					/>
					<SelectControl
						label={ _x( 'Preload', 'noun; Audio block parameter' ) }
						value={ preload || '' }
						// `undefined` is required for the preload attribute to be unset.
						onChange={ ( value ) =>
							setAttributes( {
								preload: value || undefined,
							} )
						}
						options={ [
							{ value: '', label: __( 'Browser default' ) },
							{ value: 'auto', label: __( 'Auto' ) },
							{ value: 'metadata', label: __( 'Metadata' ) },
							{
								value: 'none',
								label: _x( 'None', '"Preload" value' ),
							},
						] }
					/>
				</PanelBody>
			</InspectorControls>
			<figure { ...blockProps }>
				{ /*
					Disable the audio tag if the block is not selected
					so the user clicking on it won't play the
					file or change the position slider when the controls are enabled.
				*/ }
				<Disabled isDisabled={ ! isSelected }>
					<audio controls="controls" src={ src } />
				</Disabled>
				{ isTemporaryAudio && <Spinner /> }
				{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
					<RichText
						tagName="figcaption"
						aria-label={ __( 'Audio caption text' ) }
						placeholder={ __( 'Add caption' ) }
						value={ caption }
						onChange={ ( value ) =>
							setAttributes( { caption: value } )
						}
						inlineToolbar
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter( createBlock( 'core/paragraph' ) )
						}
					/>
				) }
			</figure>
		</>
	);
}
export default withNotices( AudioEdit );
