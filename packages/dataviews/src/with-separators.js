/**
 * WordPress dependencies
 */
import { Children, Fragment } from '@wordpress/element';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { DropdownMenuSeparatorV2: DropdownMenuSeparator } = unlock(
	componentsPrivateApis
);

export default function WithSeparators( {
	children,
	separator = <DropdownMenuSeparator />,
} ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && separator }
				{ child }
			</Fragment>
		) );
}
