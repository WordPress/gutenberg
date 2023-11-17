/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Icon,
} from '@wordpress/components';
import { chevronRightSmall, plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { OPERATOR_IN } from './in-filter';

const {
	DropdownMenuV2,
	DropdownSubMenuV2,
	DropdownSubMenuTriggerV2,
	DropdownMenuItemV2,
} = unlock( componentsPrivateApis );

// TODO: find a place where these constants can be shared across components.
const ENUMERATION_TYPE = 'enumeration';

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
		<DropdownMenuV2
			label={ __( 'Add filter' ) }
			trigger={
				<Button
					disabled={ filters.length === view.filters?.length }
					__experimentalIsFocusable
					icon={ plus }
					variant="tertiary"
					size="compact"
				>
					{ __( 'Add filter' ) }
				</Button>
			}
		>
			{ filters.map( ( filter ) => {
				if ( filter.isVisible ) {
					return null;
				}

				return (
					<DropdownSubMenuV2
						key={ filter.field }
						trigger={
							<DropdownSubMenuTriggerV2
								suffix={ <Icon icon={ chevronRightSmall } /> }
							>
								{ filter.name }
							</DropdownSubMenuTriggerV2>
						}
					>
						{ filter.elements.map( ( element ) => (
							<DropdownMenuItemV2
								key={ element.value }
								onSelect={ () => {
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
								role="menuitemcheckbox"
							>
								{ element.label }
							</DropdownMenuItemV2>
						) ) }
					</DropdownSubMenuV2>
				);
			} ) }
		</DropdownMenuV2>
	);
}
