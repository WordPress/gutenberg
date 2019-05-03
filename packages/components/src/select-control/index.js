/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

function SelectControl( {
	help,
	instanceId,
	label,
	multiple = false,
	onChange,
	options = [],
	className,
	...props
} ) {
	const id = `inspector-select-control-${ instanceId }`;
	const onChangeValue = ( event ) => {
		if ( multiple ) {
			const selectedOptions = [ ...event.target.options ].filter( ( { selected } ) => selected );
			const newValues = selectedOptions.map( ( { value } ) => value );
			onChange( newValues );
			return;
		}
		const dataSet = event.target[ event.target.selectedIndex ].dataset;
		const elementData = JSON.parse( JSON.stringify( dataSet ) );
		onChange( event.target.value, elementData );
	};

	// Disable reason: A select with an onchange throws a warning

	/* eslint-disable jsx-a11y/no-onchange */
	return ! isEmpty( options ) && (
		<BaseControl label={ label } id={ id } help={ help } className={ className }>
			<select
				id={ id }
				className="components-select-control__input"
				onChange={ onChangeValue }
				aria-describedby={ !! help ? `${ id }__help` : undefined }
				multiple={ multiple }
				{ ...props }
			>
				{ options.map( ( option, index ) =>
					<option
						key={ `${ option.label }-${ option.value }-${ index }` }
						value={ option.value }
						{ ...option.data }
					>
						{ option.label }
					</option>
				) }
			</select>
		</BaseControl>
	);
	/* eslint-enable jsx-a11y/no-onchange */
}

export default withInstanceId( SelectControl );
