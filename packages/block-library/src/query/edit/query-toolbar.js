/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	Dropdown,
	ToolbarButton,
	BaseControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { settings, list, grid } from '@wordpress/icons';

export default function QueryToolbar( {
	attributes: { query, displayLayout },
	setQuery,
	setDisplayLayout,
} ) {
	const maxPageInputId = useInstanceId(
		QueryToolbar,
		'blocks-query-pagination-max-page-input'
	);
	const displayLayoutControls = [
		{
			icon: list,
			title: __( 'List view' ),
			onClick: () => setDisplayLayout( { type: 'list' } ),
			isActive: displayLayout?.type === 'list',
		},
		{
			icon: grid,
			title: __( 'Grid view' ),
			onClick: () =>
				setDisplayLayout( {
					type: 'flex',
					columns: displayLayout?.columns || 3,
				} ),
			isActive: displayLayout?.type === 'flex',
		},
	];
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
								<BaseControl>
									<NumberControl
										__unstableInputWidth="60px"
										label={ __( 'Items per Page' ) }
										labelPosition="edge"
										min={ 1 }
										max={ 100 }
										onChange={ ( value ) =>
											setQuery( {
												perPage: +value ?? -1,
											} )
										}
										step="1"
										value={ query.perPage }
										isDragEnabled={ false }
									/>
								</BaseControl>
								<BaseControl>
									<NumberControl
										__unstableInputWidth="60px"
										label={ __( 'Offset' ) }
										labelPosition="edge"
										min={ 0 }
										max={ 100 }
										onChange={ ( value ) =>
											setQuery( { offset: +value } )
										}
										step="1"
										value={ query.offset }
										isDragEnabled={ false }
									/>
								</BaseControl>
								<BaseControl
									id={ maxPageInputId }
									help={ __(
										'Limit the pages you want to show, even if the query has more results. To show all pages use 0 (zero).'
									) }
								>
									<NumberControl
										id={ maxPageInputId }
										__unstableInputWidth="60px"
										label={ __( 'Max page to show' ) }
										labelPosition="edge"
										min={ 0 }
										onChange={ ( value ) =>
											setQuery( { pages: +value } )
										}
										step="1"
										value={ query.pages }
										isDragEnabled={ false }
									/>
								</BaseControl>
							</>
						) }
					/>
				</ToolbarGroup>
			) }
			<ToolbarGroup controls={ displayLayoutControls } />
		</>
	);
}
