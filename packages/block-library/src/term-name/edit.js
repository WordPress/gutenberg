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
	TextControl,
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
	const { textAlign, isLink, linkTarget } = attributes;

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

	let termNameDisplay = termName;
	if ( isLink && term ) {
		const termLink = term.link || '#';
		termNameDisplay = (
			<a
				href={ termLink }
				target={ linkTarget }
				onClick={ ( e ) => e.preventDefault() }
			>
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
							isLink: false,
							linkTarget: '_self',
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
					{ isLink && (
						<ToolsPanelItem
							hasValue={ () => linkTarget !== '_self' }
							label={ __( 'Link target' ) }
							onDeselect={ () =>
								setAttributes( { linkTarget: '_self' } )
							}
						>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Link target' ) }
								value={ linkTarget }
								onChange={ ( newLinkTarget ) =>
									setAttributes( {
										linkTarget: newLinkTarget,
									} )
								}
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>{ termNameDisplay }</div>
		</>
	);
}
