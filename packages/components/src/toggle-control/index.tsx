/**
 * External dependencies
 */
import type { ChangeEvent } from 'react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FormToggle from '../form-toggle';
import BaseControl from '../base-control';
import type { WordPressComponentProps } from '../ui/context/wordpress-component';
import type { ToggleControlProps } from './types';
import { HStack } from '../h-stack';
import { useCx } from '../utils';
import { space } from '../ui/utils/space';

export function ToggleControl( {
	__nextHasNoMarginBottom,
	label,
	checked,
	help,
	className,
	onChange,
	disabled,
}: WordPressComponentProps< ToggleControlProps, 'input', false > ) {
	function onChangeToggle( event: ChangeEvent< HTMLInputElement > ) {
		onChange( event.target.checked );
	}
	const instanceId = useInstanceId( ToggleControl );
	const id = `inspector-toggle-control-${ instanceId }`;

	const cx = useCx();
	const classes = cx(
		'components-toggle-control',
		className,
		! __nextHasNoMarginBottom && css( { marginBottom: space( 3 ) } )
	);

	let describedBy, helpLabel;
	if ( help ) {
		describedBy = id + '__help';
		helpLabel = typeof help === 'function' ? help( checked ) : help;
	}

	return (
		<BaseControl
			id={ id }
			help={ helpLabel }
			className={ classes }
			__nextHasNoMarginBottom
		>
			<HStack justify="flex-start" spacing={ 3 }>
				<FormToggle
					id={ id }
					checked={ checked }
					onChange={ onChangeToggle }
					aria-describedby={ describedBy }
					disabled={ disabled }
				/>
				<label
					htmlFor={ id }
					className="components-toggle-control__label"
				>
					{ label }
				</label>
			</HStack>
		</BaseControl>
	);
}

export default ToggleControl;
