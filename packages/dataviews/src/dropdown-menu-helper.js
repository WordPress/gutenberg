/**
 * WordPress dependencies
 */
import {
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { check } from '@wordpress/icons';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { DropdownMenuItemV2Ariakit: DropdownMenuItem } = unlock(
	componentsPrivateApis
);

/**
 * A custom implementation of a radio menu item using the standard menu item
 * component, which allows deselecting selected values.
 */
export const DropdownMenuRadioItemCustom = forwardRef(
	( { checked, name, value, onChange, onClick, ...props }, ref ) => {
		const onClickHandler = ( e ) => {
			onClick?.( e );
			onChange?.( { ...e, target: { ...e.target, value } } );
		};
		return (
			<DropdownMenuItem
				ref={ ref }
				role="menuitemradio"
				name={ name }
				aria-checked={ checked }
				hideOnClick={ false }
				prefix={
					checked ? (
						<Icon icon={ check } />
					) : (
						<span
							className="dataviews__filters-custom-menu-radio-item-prefix"
							aria-hidden="true"
						></span>
					)
				}
				onClick={ onClickHandler }
				{ ...props }
			/>
		);
	}
);
