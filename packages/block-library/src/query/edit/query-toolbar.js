/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	Dropdown,
	ToolbarButton,
	RangeControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';

export default function QueryToolbar( { query, setQuery } ) {
	return (
		<ToolbarGroup>
			<Dropdown
				contentClassName="block-library-query-toolbar__popover"
				renderToggle={ ( { onToggle } ) => (
					<ToolbarButton
						icon={ postList }
						label={ __( 'Query' ) }
						onClick={ onToggle }
					/>
				) }
				renderContent={ () => (
					<>
						<NumberControl
							label={ __( 'Items per Page' ) }
							labelPosition="side"
							min={ 1 }
							max={ 100 }
							onChange={ ( value ) =>
								setQuery( { perPage: +value ?? -1 } )
							}
							step="1"
							value={ query.perPage }
							isDragEnabled={ false }
						/>
						<NumberControl
							label={ __( 'Offset' ) }
							labelPosition="side"
							min={ 0 }
							max={ 100 }
							onChange={ ( value ) =>
								setQuery( { offset: +value } )
							}
							step="1"
							value={ query.offset }
							isDragEnabled={ false }
						/>
						<RangeControl
							label={ __( 'Number of Pages' ) }
							min={ 1 }
							allowReset
							value={ query.pages }
							onChange={ ( value ) =>
								setQuery( { pages: value ?? -1 } )
							}
						/>
					</>
				) }
			/>
		</ToolbarGroup>
	);
}
