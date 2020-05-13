/**
 * WordPress dependencies
 */
import {
	Toolbar,
	Dropdown,
	ToolbarButton,
	RangeControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';

export default function QueryToolbar( { query, setQuery } ) {
	return (
		<Toolbar>
			<Dropdown
				renderToggle={ ( { onToggle } ) => (
					<ToolbarButton
						icon={ postList }
						label={ __( 'Pagination' ) }
						onClick={ onToggle }
					/>
				) }
				renderContent={ () => (
					<>
						<RangeControl
							label={ __( 'Posts per Page' ) }
							min={ 1 }
							allowReset
							value={ query.per_page }
							onChange={ ( value ) =>
								setQuery( { per_page: value ?? -1 } )
							}
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
						<RangeControl
							label={ __( 'Offset' ) }
							min={ 0 }
							allowReset
							value={ query.offset }
							onChange={ ( value ) =>
								setQuery( { offset: value ?? 0 } )
							}
						/>
					</>
				) }
			/>
		</Toolbar>
	);
}
