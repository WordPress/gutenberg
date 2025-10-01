/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as HStack,
	Spinner,
	Button,
} from '@wordpress/components';
import {
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
	BlockControls,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	audio,
	chevronUp,
	chevronDown,
	tableRowDelete,
} from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo, useState } from '@wordpress/element';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

function PlaylistEdit( {
	attributes: { items, autoplay, loop, showItemList },
	setAttributes,
} ) {
	const [ currentItem, setCurrentItem ] = useState( 0 );
	const { createErrorNotice } = useDispatch( noticesStore );
	const itemsData = useSelect(
		( select ) => {
			if ( ! items?.length ) {
				return;
			}
			// We always create a set with the ids and sort them to avoid
			// unnecessary requests when items change.
			const uniqueItems = Array.from( new Set( items ) ).sort(
				( a, b ) => a - b
			);
			// TODO: how can we avoid this request if we already have the data?
			// when removing an item for example.
			return select( coreStore ).getEntityRecords(
				'postType',
				'attachment',
				{
					include: uniqueItems.join( ',' ),
					per_page: -1,
					orderby: 'include',
				}
			);
		},
		[ items ]
	);
	// Build items array because a playlist can contain the same item multiple times.
	// Additionally we preserve the order of items that might be different in case of
	// duplicates.
	const orderedItemData = useMemo( () => {
		if ( ! items?.length || ! itemsData?.length ) {
			return;
		}
		return items
			.map( ( itemId ) => itemsData.find( ( { id } ) => id === itemId ) )
			.filter( Boolean );
	}, [ items, itemsData ] );
	const currentItemData = orderedItemData?.[ currentItem ];
	function onSelectAudio( media ) {
		if ( ! media ) {
			return;
		}

		const mediaArray = Array.isArray( media ) ? media : [ media ];

		// Skip intermediate calls with blob URLs (upload in progress)
		const hasBlobURLs = mediaArray.some(
			( file ) => file.url && isBlobURL( file.url )
		);
		if ( hasBlobURLs ) {
			return;
		}

		// Filter out invalid entries (missing url or id)
		// MediaPlaceholder with allowedTypes already filters to audio files only.
		const validMedia = mediaArray.filter( ( file ) => file.url && file.id );

		if ( validMedia.length === 0 ) {
			createErrorNotice( __( 'Please select valid audio files.' ), {
				id: 'playlist-upload-invalid-file',
				type: 'snackbar',
			} );
			return;
		}

		// Extract IDs from valid media
		const newItemIds = validMedia.map( ( file ) => file.id );

		setAttributes( {
			items: [ ...( items || [] ), ...newItemIds ],
		} );
	}
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}
	function removeItem( index ) {
		const newItems = items.toSpliced( index, 1 );
		setAttributes( {
			items: newItems,
		} );
		if ( currentItem >= newItems.length ) {
			setCurrentItem( Math.max( 0, newItems.length - 1 ) );
		}
	}
	function moveItemUp( index ) {
		const newItems = [ ...items ];
		[ newItems[ index - 1 ], newItems[ index ] ] = [
			newItems[ index ],
			newItems[ index - 1 ],
		];
		// Update current item only if we moved it.
		if ( currentItem === index ) {
			setCurrentItem( index - 1 );
		}
		setAttributes( { items: newItems } );
	}
	function moveItemDown( index ) {
		const newItems = [ ...items ];
		[ newItems[ index ], newItems[ index + 1 ] ] = [
			newItems[ index + 1 ],
			newItems[ index ],
		];
		// Update current item only if we moved it.
		if ( currentItem === index ) {
			setCurrentItem( index + 1 );
		}
		setAttributes( { items: newItems } );
	}
	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	if ( items?.length && ! orderedItemData ) {
		return (
			<div { ...blockProps }>
				<div style={ { textAlign: 'center' } }>
					<Spinner />
				</div>
			</div>
		);
	}
	// TODO: check if it has items but there are no records in database..
	if ( ! items?.length ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ audio } /> }
					labels={ {
						title: __( 'Playlist' ),
						instructions: __(
							'Drag and drop audio files, upload, or choose from your library.'
						),
					} }
					onSelect={ onSelectAudio }
					accept="audio/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					multiple
					onError={ onUploadError }
				/>
			</div>
		);
	}
	return (
		<>
			<BlockControls group="other">
				{ /* TODO: probably only allow single replace.. */ }
				<MediaReplaceFlow
					mediaId={ items }
					mediaURL={ currentItemData?.source_url }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					accept="audio/*"
					name={ __( 'Add' ) }
					onSelect={ onSelectAudio }
					multiple
					addToGallery
				/>
			</BlockControls>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							autoplay: false,
							loop: false,
							showItemList: true,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => autoplay !== false }
						label={ __( 'Autoplay' ) }
						onDeselect={ () =>
							setAttributes( { autoplay: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Autoplay' ) }
							checked={ autoplay }
							onChange={ ( value ) =>
								setAttributes( { autoplay: value } )
							}
							help={
								autoplay
									? __(
											'Autoplay may cause usability issues for some users.'
									  )
									: null
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => loop !== false }
						label={ __( 'Loop' ) }
						onDeselect={ () => setAttributes( { loop: false } ) }
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Loop' ) }
							checked={ loop }
							onChange={ ( value ) =>
								setAttributes( { loop: value } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => showItemList !== true }
						label={ __( 'Show item list' ) }
						onDeselect={ () =>
							setAttributes( { showItemList: true } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show item list' ) }
							checked={ showItemList }
							onChange={ ( value ) =>
								setAttributes( { showItemList: value } )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>
				<figure className="wp-block-playlist__player">
					{ currentItemData && (
						<div className="wp-block-playlist__header">
							{ currentItemData.media_details?.sizes?.thumbnail
								?.source_url && (
								<img
									src={
										currentItemData.media_details.sizes
											.thumbnail.source_url
									}
									alt=""
									className="wp-block-playlist__header-image"
								/>
							) }
							<div className="wp-block-playlist__header-info">
								<div className="wp-block-playlist__header-title">
									{ currentItemData.title?.rendered ||
										currentItemData.title ||
										__( 'Untitled' ) }
								</div>
								{ currentItemData.media_details?.artist && (
									<div className="wp-block-playlist__header-subtitle">
										{ sprintf(
											// translators: %s is the artist name.
											__( 'by %s' ),
											currentItemData.media_details.artist
										) }
									</div>
								) }
							</div>
						</div>
					) }
					{ currentItemData?.source_url && (
						<audio
							controls
							src={ currentItemData.source_url }
							autoPlay={ autoplay }
							loop={ loop }
							className="wp-block-playlist__audio"
						/>
					) }
				</figure>
				{ showItemList && !! orderedItemData?.length && (
					<ol className="wp-block-playlist__items">
						{ orderedItemData.map( ( item, index ) => (
							// TODO: check this below..
							// eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions
							<li
								key={ `${ item.id }-${ index }` }
								className={ clsx( 'wp-block-playlist__item', {
									'is-active': index === currentItem,
								} ) }
								onClick={ () => {
									if ( currentItem !== index ) {
										setCurrentItem( index );
									}
								} }
							>
								<HStack justify="space-between" spacing={ 4 }>
									<span className="wp-block-playlist__item-number">
										{ index + 1 }.
									</span>
									<div className="wp-block-playlist__item-info">
										<div className="wp-block-playlist__item-title">
											{ item.title?.rendered ||
												item.title ||
												__( 'Untitled' ) }
										</div>
										{ item.media_details?.artist && (
											<div className="wp-block-playlist__item-artist">
												{ sprintf(
													// translators: %s is the artist name.
													__( 'by %s' ),
													item.media_details.artist
												) }
											</div>
										) }
									</div>
									<HStack
										justify="flex-end"
										spacing={ 0 }
										className="wp-block-playlist__item-controls"
										expanded={ false }
									>
										{ orderedItemData.length !== 1 && (
											<>
												<Button
													icon={ chevronUp }
													label={ sprintf(
														/* translators: %d: item position */
														__( 'Move item %d up' ),
														index + 1
													) }
													onClick={ ( event ) => {
														moveItemUp( index );
														event.stopPropagation();
													} }
													disabled={ index === 0 }
													accessibleWhenDisabled
													size="small"
												/>
												<Button
													icon={ chevronDown }
													label={ sprintf(
														/* translators: %d: item position */
														__(
															'Move item %d down'
														),
														index + 1
													) }
													onClick={ ( event ) => {
														moveItemDown( index );
														event.stopPropagation();
													} }
													accessibleWhenDisabled
													disabled={
														index ===
														items.length - 1
													}
													size="small"
												/>
											</>
										) }
										<Button
											onClick={ ( event ) => {
												removeItem( index );
												event.stopPropagation();
											} }
											icon={ tableRowDelete }
											size="small"
										/>
									</HStack>
								</HStack>
							</li>
						) ) }
					</ol>
				) }
			</div>
		</>
	);
}

export default PlaylistEdit;
