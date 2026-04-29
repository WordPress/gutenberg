/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SliderPaginationArrowControls } from './slider-pagination-arrow-controls';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const PAGINATION_TEMPLATE = [
	[ 'core/slider-pagination-button', { type: 'previous' } ],
	[ 'core/slider-pagination-indicator' ],
	[ 'core/slider-pagination-button', { type: 'next' } ],
];

export default function Edit( { attributes: { arrowIcon }, setAttributes } ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: PAGINATION_TEMPLATE,
		renderAppender: false,
	} );

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Icon' ) }
					resetAll={ () => setAttributes( { arrowIcon: 'chevron' } ) }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => arrowIcon !== 'chevron' }
						label={ __( 'Arrow' ) }
						onDeselect={ () =>
							setAttributes( { arrowIcon: 'chevron' } )
						}
						isShownByDefault
					>
						<SliderPaginationArrowControls
							value={ arrowIcon }
							onChange={ ( value ) =>
								setAttributes( { arrowIcon: value } )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
