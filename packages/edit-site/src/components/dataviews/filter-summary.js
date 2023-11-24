/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
	Icon,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import FilterEnumeration from './filter-enumeration';

const { DropdownMenuV2: DropdownMenu } = unlock( componentsPrivateApis );

export default function FilterSummary( { filter, view, onChangeView } ) {
	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const activeElement = filter.elements.find(
		( element ) => element.value === filterInView?.value
	);

	return (
		<DropdownMenu
			key={ filter.field }
			trigger={
				<Button variant="tertiary" size="compact" label={ filter.name }>
					{ activeElement !== undefined
						? sprintf(
								/* translators: 1: Filter name. 2: filter value. e.g.: "Author is Admin". */
								__( '%1$s is %2$s' ),
								filter.name,
								activeElement.label
						  )
						: filter.name }
					<Icon icon={ chevronDown } style={ { flexShrink: 0 } } />
				</Button>
			}
		>
			<FilterEnumeration
				filter={ filter }
				view={ view }
				onChangeView={ onChangeView }
			/>
		</DropdownMenu>
	);
}
