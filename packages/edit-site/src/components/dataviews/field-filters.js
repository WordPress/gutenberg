/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Icon,
} from '@wordpress/components';
import { chevronDown, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { DropdownMenuV2, DropdownMenuItemV2 } = unlock( componentsPrivateApis );

function renderFilter( { field, view, onChangeView } ) {
	// TODO: implement more filter types.
	if ( field.type !== 'set' ) {
		return null;
	}

	if ( ! field.setList ) {
		return null;
	}

	return (
		<DropdownMenuV2
			key={ 'filter-' + field.id }
			trigger={
				<Button variant="tertiary">
					{ field.header }
					<Icon icon={ chevronDown } />
				</Button>
			}
		>
			{ [
				// Should providing the nullable state be the field responsibility?
				{ id: undefined, name: __( 'All' ) },
				...field.setList,
			].map( ( element ) => {
				if (
					! element.hasOwnProperty( 'id' ) ||
					! element.hasOwnProperty( 'name' )
				) {
					return null;
				}

				return (
					<DropdownMenuItemV2
						key={ element.name } // TODO: formalize elements – they should have name.
						prefix={
							// TODO: we need the filter value from the view
							// and also the field key to be used. Or elements could have an id, for example.
							// like a select.
							view.filters[ field.id ] &&
							view.filters[ field.id ] === element.id && (
								<Icon icon={ check } />
							)
						}
						role="menuitemcheckbox"
						onSelect={ () => {
							onChangeView( ( currentView ) => {
								return {
									...currentView,
									filters: {
										...currentView.filters,
										[ field.id ]: element.id,
									},
								};
							} );
						} }
					>
						{ element.name }
					</DropdownMenuItemV2>
				);
			} ) }
		</DropdownMenuV2>
	);
}

export default function FieldFilters( { view, fields, onChangeView } ) {
	return Object.keys( view.filters ).map( ( key ) => {
		const fieldWithFilter = fields.find(
			( field ) =>
				field.enableColumnFilter &&
				field.type && // We could consider lift off this restriction and having a fallback filter (search text, for example).
				field.id === key
		);
		if ( ! fieldWithFilter ) {
			return null;
		}

		return renderFilter( { field: fieldWithFilter, view, onChangeView } );
	} );
}
