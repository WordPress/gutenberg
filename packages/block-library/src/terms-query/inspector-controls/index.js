/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import TaxonomyControl from './taxonomy-control';
import OrderingControls from './ordering-controls';
import DisplayOptions from './display-options';
import PaginationControl from './max-terms-controls';
import AdvancedControls from './advanced-controls';

export default function TermsQueryInspectorControls( {
	attributes,
	setQuery,
	setAttributes,
	TagName,
	clientId,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Terms Query Settings' ) }
					resetAll={ () => {
						setAttributes( {
							termQuery: {
								taxonomy: 'category',
								order: 'asc',
								orderBy: 'name',
								hideEmpty: true,
								hierarchical: false,
								parent: 0,
								perPage: 10,
							},
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<TaxonomyControl
						attributes={ attributes }
						setQuery={ setQuery }
					/>
					<OrderingControls
						attributes={ attributes }
						setQuery={ setQuery }
					/>
					<DisplayOptions
						attributes={ attributes }
						setQuery={ setQuery }
					/>
					<PaginationControl
						attributes={ attributes }
						setQuery={ setQuery }
					/>
				</ToolsPanel>
			</InspectorControls>
			<AdvancedControls
				TagName={ TagName }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
		</>
	);
}
