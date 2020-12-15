/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	Dropdown,
	ToolbarButton,
	RangeControl,
	BaseControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings, list, grid } from '@wordpress/icons';

export default function QueryToolbar( {
	attributes: { query, layout },
	setQuery,
	setLayout,
} ) {
	const layoutControls = [
		{
			icon: list,
			title: __( 'List view' ),
			onClick: () => setLayout( { type: 'list' } ),
			isActive: layout?.type === 'list',
		},
		{
			icon: grid,
			title: __( 'Grid view' ),
			onClick: () =>
				setLayout( { type: 'flex', columns: layout?.columns || 3 } ),
			isActive: layout?.type === 'flex',
		},
	];
	return (
		<>
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
										setQuery( { perPage: +value ?? -1 } )
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
							<BaseControl>
								<RangeControl
									label={ __( 'Number of Pages' ) }
									min={ 1 }
									allowReset
									value={ query.pages }
									onChange={ ( value ) =>
										setQuery( { pages: value ?? -1 } )
									}
								/>
							</BaseControl>
						</>
					) }
				/>
			</ToolbarGroup>
			<ToolbarGroup controls={ layoutControls } />
		</>
	);
}
