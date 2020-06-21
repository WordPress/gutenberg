/**
 * External dependencies
 */
import { isEmpty, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

/**
 * Used to render the <select /> Loading... placeholder when the isLoading
 * state is set.
 */
const loadingValue = '__loading__';

export default function SelectControl( {
	disabled,
	help,
	isLoading = false,
	label,
	multiple = false,
	onChange = noop,
	options = [],
	className,
	hideLabelFromVision,
	value: valueProp,
	...props
} ) {
	const instanceId = useInstanceId( SelectControl );
	const id = `inspector-select-control-${ instanceId }`;
	const isDisabled = disabled || isLoading;

	const onChangeValue = ( event ) => {
		if ( multiple ) {
			const selectedOptions = [ ...event.target.options ].filter(
				( { selected } ) => selected
			);
			const newValues = selectedOptions.map( ( { value } ) => value );
			onChange( newValues );
			return;
		}
		onChange( event.target.value );
	};

	if ( isEmpty( options ) ) {
		return null;
	}

	const value = isLoading ? loadingValue : valueProp;

	// Disable reason: A select with an onchange throws a warning
	/* eslint-disable jsx-a11y/no-onchange */
	return (
		<BaseControl
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			isLoading={ isLoading }
			id={ id }
			help={ help }
			className={ className }
		>
			<select
				aria-busy={ isLoading }
				id={ id }
				className="components-select-control__input"
				disabled={ isDisabled }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? `${ id }__help` : undefined }
				multiple={ multiple }
				value={ value }
				{ ...props }
			>
				<SelectOptions isLoading={ isLoading } options={ options } />
			</select>
		</BaseControl>
	);
	/* eslint-enable jsx-a11y/no-onchange */
}

function SelectOptions( { isLoading, options } ) {
	if ( isLoading ) {
		return (
			<option disabled value={ loadingValue }>
				{ __( 'Loading…' ) }
			</option>
		);
	}

	return options.map( ( option, index ) => (
		<option
			key={ `${ option.label }-${ option.value }-${ index }` }
			value={ option.value }
			disabled={ option.disabled }
		>
			{ option.label }
		</option>
	) );
}
