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
	store as blockEditorStore,
	InspectorControls,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { PanelBody, ToggleControl } from '@wordpress/components';
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

function DetailsBlock( { attributes, setAttributes, clientId } ) {
	const { level, summary, showContent } = attributes;
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

	// Check if either the block or the inner blocks are selected.
	const hasSelection = useSelect( ( select ) => {
		const { isBlockSelected, hasSelectedInnerBlock } =
			select( blockEditorStore );
		return hasSelectedInnerBlock( clientId ) || isBlockSelected( clientId );
	}, [] );

	const isOpen = !! showContent ? showContent : hasSelection;

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
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						label={ __( 'Open by default' ) }
						checked={ showContent }
						onChange={ () =>
							setAttributes( {
								showContent: ! showContent,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<details { ...blockProps } open={ isOpen }>
				<summary
					className={ classnames( 'wp-block-details__summary' ) }
					onClick={ ( event ) => event.preventDefault() }
				>
					<RichText
						tagName={ tagName }
						aria-label={ __( 'Add summary' ) }
						placeholder={ __( 'Add summary' ) }
						withoutInteractiveFormatting
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
