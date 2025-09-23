/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { useMemo, useEffect } from '@wordpress/element';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

function PostTimeToReadEdit( {
	attributes,
	setAttributes,
	clientId,
	context,
} ) {
	const { textAlign, displayAsRange, averageReadingSpeed } = attributes;
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const { blockWasJustInserted } = useSelect(
		( select ) => {
			const { wasBlockJustInserted } = select( blockEditorStore );

			return {
				blockWasJustInserted: wasBlockJustInserted( clientId ),
			};
		},
		[ clientId ]
	);

	// When the block is first inserted, default to displaying as a range.
	useEffect( () => {
		if ( blockWasJustInserted ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				displayAsRange: true,
			} );
		}
	}, [
		blockWasJustInserted,
		__unstableMarkNextChangeAsNotPersistent,
		setAttributes,
	] );

	const { postId, postType } = context;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const [ contentStructure ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);

	const [ blocks ] = useEntityBlockEditor( 'postType', postType, {
		id: postId,
	} );

	const minutesToReadString = useMemo( () => {
		// Replicates the logic found in getEditedPostContent().
		let content;
		if ( contentStructure instanceof Function ) {
			content = contentStructure( { blocks } );
		} else if ( blocks ) {
			// If we have parsed blocks already, they should be our source of truth.
			// Parsing applies block deprecations and legacy block conversions that
			// unparsed content will not have.
			content = __unstableSerializeAndClean( blocks );
		} else {
			content = contentStructure;
		}

		/*
		 * translators: If your word count is based on single characters (e.g. East Asian characters),
		 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
		 * Do not translate into your own language.
		 */
		const wordCountType = _x(
			'words',
			'Word count type. Do not translate!'
		);

		const totalWords = wordCount( content || '', wordCountType );
		if ( displayAsRange ) {
			let maxMinutes = Math.max(
				1,
				Math.round( ( totalWords / averageReadingSpeed ) * 1.2 )
			);
			const minMinutes = Math.max(
				1,
				Math.round( ( totalWords / averageReadingSpeed ) * 0.8 )
			);

			if ( minMinutes === maxMinutes ) {
				maxMinutes = maxMinutes + 1;
			}
			// translators: %1$s: minimum minutes, %2$s: maximum minutes to read the post.
			const rangeLabel = _x(
				'%1$s–%2$s minutes',
				'Range of minutes to read'
			);
			return sprintf( rangeLabel, minMinutes, maxMinutes );
		}

		const minutesToRead = Math.max(
			1,
			Math.round( totalWords / averageReadingSpeed )
		);

		return sprintf(
			/* translators: %s: the number of minutes to read the post. */
			_n( '%s minute', '%s minutes', minutesToRead ),
			minutesToRead
		);
	}, [ contentStructure, blocks, displayAsRange, averageReadingSpeed ] );

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							displayAsRange: true,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						isShownByDefault
						label={ _x(
							'Display as range',
							'Turns reading time range display on or off'
						) }
						hasValue={ () => ! displayAsRange }
						onDeselect={ () => {
							setAttributes( {
								displayAsRange: true,
							} );
						} }
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display as range' ) }
							checked={ !! displayAsRange }
							onChange={ () =>
								setAttributes( {
									displayAsRange: ! displayAsRange,
								} )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>{ minutesToReadString }</div>
		</>
	);
}

export default PostTimeToReadEdit;
