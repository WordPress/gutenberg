/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
	Icon,
} from '@wordpress/components';
import { check, chevronDown } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { OPERATOR_IN } from './constants';
import { unlock } from '../../lock-unlock';

const { DropdownMenuV2, DropdownMenuItemV2, DropdownMenuSeparatorV2 } = unlock(
	componentsPrivateApis
);

export default ( { filter, view, onChangeView } ) => {
	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const activeElement = filter.elements.find(
		( element ) => element.value === filterInView?.value
	);

	return (
		<DropdownMenuV2
			key={ filter.field }
			label={ filter.name }
			trigger={
				<Button variant="tertiary" size="compact">
					{ activeElement !== undefined
						? sprintf(
								/* translators: 1: Filter name. 2: filter value. e.g.: "Author is Admin". */
								__( '%1$s is %2$s' ),
								filter.name,
								activeElement.label
						  )
						: filter.name }
					<Icon icon={ chevronDown } />
				</Button>
			}
		>
			{ filter.elements.map( ( element ) => {
				return (
					<DropdownMenuItemV2
						key={ element.value }
						suffix={
							activeElement?.value === element.value && (
								<Icon icon={ check } />
							)
						}
						onSelect={ () =>
							onChangeView( ( currentView ) => ( {
								...currentView,
								page: 1,
								filters: [
									...view.filters.filter(
										( f ) => f.field !== filter.field
									),
									{
										field: filter.field,
										operator: OPERATOR_IN,
										value:
											activeElement?.value ===
											element.value
												? undefined
												: element.value,
									},
								],
							} ) )
						}
						role="menuitemcheckbox"
					>
						{ element.label }
					</DropdownMenuItemV2>
				);
			} ) }
			<DropdownMenuSeparatorV2 />
			<DropdownMenuItemV2
				key="remove-filter"
				onSelect={ () =>
					onChangeView( ( currentView ) => ( {
						...currentView,
						page: 1,
						filters: [
							...view.filters.filter(
								( f ) => f.field !== filter.field
							),
						],
					} ) )
				}
			>
				{ __( 'Remove' ) }
			</DropdownMenuItemV2>
		</DropdownMenuV2>
	);
};
