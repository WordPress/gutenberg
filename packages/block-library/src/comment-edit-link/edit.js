/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function Edit( {
	attributes: { linkTarget, textAlign },
	setAttributes,
} ) {
	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const blockControls = (
		<BlockControls group="block">
			<AlignmentControl
				value={ textAlign }
				onChange={ ( newAlign ) =>
					setAttributes( { textAlign: newAlign } )
				}
			/>
		</BlockControls>
	);
	const inspectorControls = (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						linkTarget: '_self',
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Open in new tab' ) }
					isShownByDefault
					hasValue={ () => linkTarget === '_blank' }
					onDeselect={ () =>
						setAttributes( { linkTarget: '_self' } )
					}
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Open in new tab' ) }
						onChange={ ( value ) =>
							setAttributes( {
								linkTarget: value ? '_blank' : '_self',
							} )
						}
						checked={ linkTarget === '_blank' }
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div { ...blockProps }>
				<a
					href="#edit-comment-pseudo-link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ __( 'Edit' ) }
				</a>
			</div>
		</>
	);
}
