/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Icon,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { ENUMERATION_TYPE, OPERATOR_IN } from './constants';

const {
	DropdownMenuV2Ariakit: DropdownMenu,
	DropdownMenuItemV2Ariakit: DropdownMenuItem,
} = unlock( componentsPrivateApis );

export default function AddFilter( { fields, view, onChangeView } ) {
	const filters = [];
	fields.forEach( ( field ) => {
		if ( ! field.type ) {
			return;
		}

		switch ( field.type ) {
			case ENUMERATION_TYPE:
				filters.push( {
					field: field.id,
					name: field.header,
					elements: field.elements || [],
					isVisible: view.filters.some(
						( f ) =>
							f.field === field.id && f.operator === OPERATOR_IN
					),
				} );
		}
	} );

	if ( filters.length === 0 ) {
		return null;
	}

	return (
		<DropdownMenu
			label={ __( 'Add filter' ) }
			trigger={
				<Button
					disabled={ filters.length === view.filters?.length }
					__experimentalIsFocusable
					variant="tertiary"
					size="compact"
				>
					<Icon icon={ plus } style={ { flexShrink: 0 } } />
					{ __( 'Add filter' ) }
				</Button>
			}
		>
			{ filters.map( ( filter ) => {
				if ( filter.isVisible ) {
					return null;
				}

				return (
					<DropdownMenu
						key={ filter.field }
						trigger={
							<DropdownMenuItem>{ filter.name }</DropdownMenuItem>
						}
					>
						{ filter.elements.map( ( element ) => (
							<DropdownMenuItem
								key={ element.value }
								onClick={ () => {
									onChangeView( ( currentView ) => ( {
										...currentView,
										page: 1,
										filters: [
											...currentView.filters,
											{
												field: filter.field,
												operator: OPERATOR_IN,
												value: element.value,
											},
										],
									} ) );
								} }
							>
								{ element.label }
							</DropdownMenuItem>
						) ) }
					</DropdownMenu>
				);
			} ) }
		</DropdownMenu>
	);
}
