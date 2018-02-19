/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import withInstanceId from '../higher-order/with-instance-id';
import './style.scss';

function SelectControl( { label, help, instanceId, onChange, options = [], ...props } ) {
	const id = `inspector-select-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.value );

	// Disable reason: A select with an onchange throws a warning

	/* eslint-disable jsx-a11y/no-onchange */
	return ! isEmpty( options ) && (
		<BaseControl label={ label } id={ id } help={ help }>
			<select
				id={ id }
				className="blocks-select-control__input"
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props }
			>
				{ options.map( ( option ) =>
					<option
						key={ option.value }
						value={ option.value }
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
