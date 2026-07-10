/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	SelectControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ALLOWED_BLOCKS = [ 'core/playlist-track' ];

export default function PlaylistTracklistEdit( {
	attributes,
	setAttributes,
	clientId,
	isSelected,
} ) {
	const { order, showArtists, showImages, showNumbers, showTrackLength } =
		attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const { hasSelectedChild, innerBlockTracks } = useSelect(
		( select ) => {
			const { getBlock, hasSelectedInnerBlock } =
				select( blockEditorStore );

			return {
				hasSelectedChild: hasSelectedInnerBlock( clientId ),
				innerBlockTracks: getBlock( clientId )?.innerBlocks ?? [],
			};
		},
		[ clientId ]
	);

	const onChangeOrder = useCallback(
		( trackOrder ) => {
			const sortedBlocks = [ ...innerBlockTracks ].sort( ( a, b ) => {
				const titleA = a.attributes.title || '';
				const titleB = b.attributes.title || '';

				if ( trackOrder === 'asc' ) {
					return titleA.localeCompare( titleB );
				}
				return titleB.localeCompare( titleA );
			} );
			replaceInnerBlocks( clientId, sortedBlocks );
			setAttributes( {
				order: trackOrder,
			} );
		},
		[ clientId, innerBlockTracks, replaceInnerBlocks, setAttributes ]
	);

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-playlist__tracklist', {
			'wp-block-playlist__tracklist-artist-is-hidden': ! showArtists,
			'wp-block-playlist__tracklist-show-numbers': showNumbers,
			'wp-block-playlist__tracklist-length-is-hidden': ! showTrackLength,
		} ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		__experimentalAppenderTagName: 'li',
		renderAppender:
			( isSelected || hasSelectedChild ) &&
			InnerBlocks.ButtonBlockAppender,
	} );

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							showArtists: true,
							showNumbers: true,
							showTrackLength: true,
							showImages: true,
							order: 'asc',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Show artist name in Tracklist' ) }
						isShownByDefault
						hasValue={ () => showArtists !== true }
						onDeselect={ () =>
							setAttributes( { showArtists: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show artist name in Tracklist' ) }
							onChange={ toggleAttribute( 'showArtists' ) }
							checked={ showArtists }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Show number in Tracklist' ) }
						isShownByDefault
						hasValue={ () => showNumbers !== true }
						onDeselect={ () =>
							setAttributes( { showNumbers: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show number in Tracklist' ) }
							onChange={ toggleAttribute( 'showNumbers' ) }
							checked={ showNumbers }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Show track length in Tracklist' ) }
						isShownByDefault
						hasValue={ () => showTrackLength !== true }
						onDeselect={ () =>
							setAttributes( { showTrackLength: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show track length in Tracklist' ) }
							onChange={ toggleAttribute( 'showTrackLength' ) }
							checked={ showTrackLength }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Show images' ) }
						isShownByDefault
						hasValue={ () => showImages !== true }
						onDeselect={ () =>
							setAttributes( { showImages: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show images' ) }
							onChange={ toggleAttribute( 'showImages' ) }
							checked={ showImages }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Order' ) }
						isShownByDefault
						hasValue={ () => order !== 'asc' }
						onDeselect={ () => setAttributes( { order: 'asc' } ) }
					>
						<SelectControl
							label={ __( 'Order' ) }
							value={ order }
							options={ [
								{ label: __( 'Descending' ), value: 'desc' },
								{ label: __( 'Ascending' ), value: 'asc' },
							] }
							onChange={ ( value ) => onChangeOrder( value ) }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<ol { ...innerBlocksProps } />
		</>
	);
}
