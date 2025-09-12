/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

function PostTimeToReadEdit( { attributes, setAttributes, context } ) {
	const { textAlign, averageReadingSpeed, displayAsRange } = attributes;
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
			const readingSpeed = averageReadingSpeed;
			const minMinutes = Math.max(
				1,
				Math.round( totalWords / ( readingSpeed * 1.2 ) )
			);
			let maxMinutes = Math.max(
				1,
				Math.round( totalWords / ( readingSpeed * 0.8 ) )
			);
			if ( minMinutes === maxMinutes ) {
				maxMinutes = minMinutes + 1;
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
	}, [ contentStructure, blocks, averageReadingSpeed, displayAsRange ] );

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
							displayAsRange: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						isShownByDefault
						hasValue={ () => averageReadingSpeed !== undefined }
						label={ _x(
							'Average Reading Speed',
							'Sets the average reading speed in words per minute'
						) }
						onDeselect={ () =>
							setAttributes( { averageReadingSpeed: undefined } )
						}
					>
						<NumberControl
							isShownByDefault
							__next40pxDefaultSize
							min={ 1 }
							label={ __( 'Average Reading Speed' ) }
							value={ averageReadingSpeed || 1 }
							onChange={ ( value ) => {
								setAttributes( { averageReadingSpeed: value } );
							} }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						isShownByDefault
						label={ _x(
							'Display as range',
							'Turns reading time range display on or off'
						) }
						hasValue={ () => !! displayAsRange }
						onDeselect={ () => {
							setAttributes( {
								displayAsRange: false,
							} );
						} }
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ _x(
								'Display as range',
								'Turns reading time range display on or off'
							) }
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
