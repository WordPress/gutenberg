/**
 * WordPress dependencies
 */
import {
	RichText,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from './heading-level-dropdown';

function DetailsSummaryBlock( { attributes, setAttributes } ) {
	const { level, summary } = attributes;
	const tagName = 'h' + level;

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					selectedLevel={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
			</BlockControls>
			<summary
				{ ...useBlockProps() }
				onClick={ ( event ) => event.preventDefault() }
			>
				<RichText
					tagName={ tagName }
					aria-label={ __( 'Add summary' ) }
					withoutInteractiveFormatting
					value={ !! summary ? summary : __( 'Details' ) }
					onChange={ ( newSummary ) =>
						setAttributes( { summary: newSummary } )
					}
				/>
			</summary>
		</>
	);
}

export default DetailsSummaryBlock;
