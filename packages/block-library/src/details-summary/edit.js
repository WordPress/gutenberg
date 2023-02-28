/**
 * WordPress dependencies
 */
import {
	RichText,
	BlockControls,
	useBlockProps,
	getTypographyClassesAndStyles as useTypographyProps,
	useSetting,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from './heading-level-dropdown';

function DetailsSummaryBlock( { attributes, setAttributes } ) {
	const { level, summary } = attributes;
	const tagName = 'h' + level;
	const fluidTypographySettings = useSetting( 'typography.fluid' );
	const typographyProps = useTypographyProps(
		attributes,
		fluidTypographySettings
	);

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
				style={ typographyProps.style }
			>
				<div className="wp-block-details-summary__summary">
					<RichText
						tagName={ tagName }
						aria-label={ __( 'Add summary' ) }
						allowedFormats={ [] }
						withoutInteractiveFormatting
						value={ !! summary ? summary : __( 'Details' ) }
						onChange={ ( newSummary ) =>
							setAttributes( { summary: newSummary } )
						}
						style={ typographyProps.style }
					/>
				</div>
			</summary>
		</>
	);
}

export default DetailsSummaryBlock;
