/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function SelectControl( { label, selected, help, instanceId, onBlur, options = [], ...props } ) {
	const id = 'inspector-select-control-' + instanceId;
	const onBlurValue = ( event ) => onBlur( event.target.value );

	return ! isEmpty( options ) && (
		<BaseControl label={ label } id={ id } help={ help }>
			<select
				id={ id }
				className="blocks-select-control__input"
				onBlur={ onBlurValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props }
			>
				{ options.map( ( option ) =>
					<option
						key={ option.value }
						value={ option.value }
						selected={ option.value === selected }
					>
						{ option.label }
					</option>
				) }
			</select>
		</BaseControl>
	);
}

export default withInstanceId( SelectControl );
