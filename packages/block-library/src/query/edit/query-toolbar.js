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
import { list } from '@wordpress/icons';

export default function QueryToolbar( { query, setQuery } ) {
	return (
		<Toolbar>
			<Dropdown
				renderToggle={ ( { onToggle } ) => (
					<ToolbarButton
						icon={ list }
						label={ __( 'Number of Posts' ) }
						onClick={ onToggle }
					/>
				) }
				renderContent={ () => (
					<RangeControl
						label={ __( 'Limit the number of posts returned.' ) }
						min={ 1 }
						max={ 50 }
						allowReset
						value={ query.per_page }
						onChange={ ( value ) =>
							setQuery( { per_page: value ?? -1 } )
						}
					/>
				) }
			/>
		</Toolbar>
	);
}
