/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	Dropdown,
	ToolbarButton,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { usePatterns } from '../utils';

export default function QueryToolbar( {
	attributes: { query },
	setQuery,
	openPatternSelectionModal,
	name,
	clientId,
} ) {
	const hasPatterns = !! usePatterns( clientId, name ).length;

	return (
		<>
			{ ! query.inherit && (
				<ToolbarGroup>
					<Dropdown
						contentClassName="block-library-query-toolbar__popover"
						renderToggle={ ( { onToggle } ) => (
							<ToolbarButton
								icon={ settings }
								label={ __( 'Display settings' ) }
								onClick={ onToggle }
							/>
						) }
						renderContent={ () => (
							<>
								<NumberControl
									__unstableInputWidth="60px"
									className="block-library-query-toolbar__popover-number-control"
									label={ __( 'Items per Page' ) }
									labelPosition="edge"
									min={ 1 }
									max={ 100 }
									onChange={ ( value ) => {
										if (
											isNaN( value ) ||
											value < 1 ||
											value > 100
										) {
											return;
										}
										setQuery( {
											perPage: value,
										} );
									} }
									step="1"
									value={ query.perPage }
									isDragEnabled={ false }
								/>
								<NumberControl
									__unstableInputWidth="60px"
									className="block-library-query-toolbar__popover-number-control"
									label={ __( 'Offset' ) }
									labelPosition="edge"
									min={ 0 }
									max={ 100 }
									onChange={ ( value ) => {
										if (
											isNaN( value ) ||
											value < 0 ||
											value > 100
										) {
											return;
										}
										setQuery( { offset: value } );
									} }
									step="1"
									value={ query.offset }
									isDragEnabled={ false }
								/>
								<NumberControl
									__unstableInputWidth="60px"
									className="block-library-query-toolbar__popover-number-control"
									label={ __( 'Max pages to show' ) }
									labelPosition="edge"
									min={ 0 }
									onChange={ ( value ) => {
										if ( isNaN( value ) || value < 0 ) {
											return;
										}
										setQuery( { pages: value } );
									} }
									step="1"
									value={ query.pages }
									isDragEnabled={ false }
									help={ __(
										'Limit the pages you want to show, even if the query has more results. To show all pages use 0 (zero).'
									) }
								/>
							</>
						) }
					/>
				</ToolbarGroup>
			) }
			{ hasPatterns && (
				<ToolbarGroup className="wp-block-template-part__block-control-group">
					<ToolbarButton onClick={ openPatternSelectionModal }>
						{ __( 'Replace' ) }
					</ToolbarButton>
				</ToolbarGroup>
			) }
		</>
	);
}
