/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from './heading-level-dropdown';

const DETAILS = [
	[
		'core/paragraph',
		{
			placeholder: __(
				'Add text or blocks that will display when the details block is opened.'
			),
		},
	],
];

function DetailsBlock( { attributes, setAttributes } ) {
	const { level, summary } = attributes;
	const tagName = 'h' + level;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-details__content',
		},
		{
			template: DETAILS,
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
			<details { ...blockProps }>
				<summary
					className={ classnames( 'wp-block-details__summary' ) }
				>
					<RichText
						tagName={ tagName }
						aria-label={ __( 'Add summary' ) }
						placeholder={ __( 'Add summary' ) }
						value={ summary }
						onChange={ ( newSummary ) =>
							setAttributes( { summary: newSummary } )
						}
					/>
				</summary>
				<div { ...innerBlocksProps } />
			</details>
		</>
	);
}

export default DetailsBlock;
