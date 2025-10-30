/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { useTermName } from './use-term-name';

export default function TermNameEdit( {
	attributes,
	setAttributes,
	context: { termId, taxonomy },
} ) {
	const { textAlign, level = 0, isLink } = attributes;
	const { term } = useTermName( termId, taxonomy );

	const termName = term?.name
		? decodeEntities( term.name )
		: __( 'Term Name' );

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const TagName = level === 0 ? 'p' : `h${ level }`;

	let termNameDisplay = termName;
	if ( isLink ) {
		termNameDisplay = (
			<a
				href="#term-name-pseudo-link"
				onClick={ ( e ) => e.preventDefault() }
			>
				{ termName }
			</a>
		);
	}

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					value={ level }
					options={ [ 0, 1, 2, 3, 4, 5, 6 ] }
					onChange={ ( newLevel ) => {
						setAttributes( { level: newLevel } );
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
							isLink: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => !! isLink }
						label={ __( 'Make term name a link' ) }
						onDeselect={ () => setAttributes( { isLink: false } ) }
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Make term name a link' ) }
							onChange={ () =>
								setAttributes( { isLink: ! isLink } )
							}
							checked={ isLink }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<TagName { ...blockProps }>{ termNameDisplay }</TagName>
		</>
	);
}
