/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	useBlockProps,
	BlockControls,
	AlignmentControl,
	InspectorControls,
	HeadingLevelDropdown,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { useTermCount } from './use-term-count';

export default function TermCountEdit( {
	attributes,
	setAttributes,
	context: { termId, taxonomy },
} ) {
	const { textAlign, tagName = 'p', hasParenthesis } = attributes;
	const term = useTermCount( termId, taxonomy );

	const termCount = term?.termCount || 0;

	const blockProps = useBlockProps( {
		classCount: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const TagName = tagName;

	let termCountDisplay = termCount;
	if ( hasParenthesis ) {
		termCountDisplay = sprintf(
			/* translators: %d: term count number. */
			__( '(%d)' ),
			termCount
		);
	}

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					value={
						tagName === 'p'
							? 0
							: parseInt( tagName.replace( 'h', '' ) )
					}
					options={ [ 0, 1, 2, 3, 4, 5, 6 ] }
					onChange={ ( newLevel ) => {
						setAttributes( {
							tagName: newLevel === 0 ? 'p' : `h${ newLevel }`,
						} );
					} }
				/>
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
							hasParenthesis: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => !! hasParenthesis }
						label={ __( 'Make term count a link' ) }
						onDeselect={ () =>
							setAttributes( { hasParenthesis: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show term count in parenthesis' ) }
							onChange={ () =>
								setAttributes( {
									hasParenthesis: ! hasParenthesis,
								} )
							}
							checked={ hasParenthesis }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<TagName { ...blockProps }>{ termCountDisplay }</TagName>
		</>
	);
}
