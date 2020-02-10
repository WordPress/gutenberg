/**
 * External dependencies
 */
import { isEmpty } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

export default function RadioControl( {
	label,
	className,
	selected,
	help,
	onChange,
	options = [],
} ) {
	const instanceId = useInstanceId( RadioControl );
	const id = `inspector-radio-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		! isEmpty( options ) && (
			<BaseControl
				label={ label }
				id={ id }
				help={ help }
				className={ classnames(
					className,
					'components-radio-control'
				) }
			>
				{ options.map( ( option, index ) => (
					<div
						key={ `${ id }-${ index }` }
						className="components-radio-control__option"
					>
						<input
							id={ `${ id }-${ index }` }
							className="components-radio-control__input"
							type="radio"
							name={ id }
							value={ option.value }
							onChange={ onChangeValue }
							checked={ option.value === selected }
							aria-describedby={
								!! help ? `${ id }__help` : undefined
							}
						/>
						<label htmlFor={ `${ id }-${ index }` }>
							{ option.label }
						</label>
					</div>
				) ) }
			</BaseControl>
		)
	);
}
