/**
 * WordPress dependencies
 */
import {
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { SVG, Circle } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { DropdownMenuItemV2: DropdownMenuItem } = unlock(
	componentsPrivateApis
);

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 }></Circle>
	</SVG>
);

/**
 * A custom implementation of a radio menu item using the standard menu item
 * component, which allows deselecting selected values.
 */
export const DropdownMenuRadioItemCustom = forwardRef(
	function DropdownMenuRadioItemCustom(
		{ checked, name, value, hideOnClick, onChange, onClick, ...props },
		ref
	) {
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
				hideOnClick={ !! hideOnClick }
				prefix={
					checked ? (
						<Icon icon={ radioCheck } />
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
