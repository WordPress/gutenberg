/**
 * External dependencies
 */
import classnames from 'classnames';

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
	const { level, summary, style } = attributes;
	const tagName = 'h' + level;
	const fluidTypographySettings = useSetting( 'typography.fluid' );
	const typographyProps = useTypographyProps(
		attributes,
		fluidTypographySettings
	);

	const additionalClassNames = classnames(
		'wp-block-details-summary__summary',
		typographyProps.className,
		{
			'has-custom-font-size': style?.typography?.fontSize ? true : false,
		}
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
			>
				<RichText
					tagName={ tagName }
					className={ additionalClassNames }
					aria-label={ __( 'Add summary' ) }
					allowedFormats={ [] }
					withoutInteractiveFormatting
					value={ !! summary ? summary : __( 'Details' ) }
					onChange={ ( newSummary ) =>
						setAttributes( { summary: newSummary } )
					}
					style={ typographyProps.style }
				/>
			</summary>
		</>
	);
}

export default DetailsSummaryBlock;
