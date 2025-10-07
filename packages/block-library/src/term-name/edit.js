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
} from '@wordpress/block-editor';
import {
	ToggleControl,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function TermNameEdit( {
	attributes,
	setAttributes,
	context: { termId, taxonomy },
} ) {
	const { textAlign, tagName = 'div', isLink } = attributes;

	const term = useSelect(
		( select ) => {
			if ( ! termId || ! taxonomy ) {
				return null;
			}
			return select( coreStore ).getEntityRecord(
				'taxonomy',
				taxonomy,
				termId
			);
		},
		[ termId, taxonomy ]
	);

	const termName = term?.name || __( 'Term Name' );

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const TagName = tagName;

	let termNameDisplay = termName;
	if ( isLink && term ) {
		const termLink = term.link || '#';
		termNameDisplay = (
			<a href={ termLink } onClick={ ( e ) => e.preventDefault() }>
				{ termName }
			</a>
		);
	}

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
							tagName: 'div',
							isLink: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => tagName !== 'div' }
						label={ __( 'HTML element' ) }
						onDeselect={ () => setAttributes( { tagName: 'div' } ) }
						isShownByDefault
					>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'HTML element' ) }
							value={ tagName }
							options={ [
								{ label: __( 'Default (div)' ), value: 'div' },
								{ label: __( 'Paragraph (p)' ), value: 'p' },
								{ label: __( 'Heading 1 (h1)' ), value: 'h1' },
								{ label: __( 'Heading 2 (h2)' ), value: 'h2' },
								{ label: __( 'Heading 3 (h3)' ), value: 'h3' },
								{ label: __( 'Heading 4 (h4)' ), value: 'h4' },
								{ label: __( 'Heading 5 (h5)' ), value: 'h5' },
								{ label: __( 'Heading 6 (h6)' ), value: 'h6' },
							] }
							onChange={ ( value ) =>
								setAttributes( { tagName: value } )
							}
						/>
					</ToolsPanelItem>
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
