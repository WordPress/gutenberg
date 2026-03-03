/**
 * WordPress dependencies
 */
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { useEntityProp, useEntityBlockEditor } from '@wordpress/core-data';
import { count as wordCount } from '@wordpress/wordcount';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

function PostTimeToReadEdit( { attributes, setAttributes, context } ) {
	const { displayAsRange, displayMode, averageReadingSpeed } = attributes;
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

	const displayString = useMemo( () => {
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

		// Add "time to read" part, if enabled.
		if ( displayMode === 'time' ) {
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
		}

		// Add "word count" part, if enabled.
		if ( displayMode === 'words' ) {
			return wordCountType === 'words'
				? sprintf(
						/* translators: %s: the number of words in the post. */
						_n( '%s word', '%s words', totalWords ),
						totalWords.toLocaleString()
				  )
				: sprintf(
						/* translators: %s: the number of characters in the post. */
						_n( '%s character', '%s characters', totalWords ),
						totalWords.toLocaleString()
				  );
		}
	}, [
		contentStructure,
		blocks,
		displayAsRange,
		displayMode,
		averageReadingSpeed,
	] );

	const blockProps = useBlockProps();

	return (
		<>
			{ displayMode === 'time' && (
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
			) }
			<div { ...blockProps }>{ displayString }</div>
		</>
	);
}

export default PostTimeToReadEdit;
