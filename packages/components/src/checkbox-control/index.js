/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { G, Path, SVG } from '../primitives';

function CheckboxControl( { label, className, heading, checked, help, instanceId, onChange, ...props } ) {
	const id = `inspector-checkbox-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.checked );

	const svgCheck = (
		<SVG
			viewBox="0 0 20 20"
			xmlns="http://www.w3.org/2000/svg"
			className="components-checkbox-control__checked"
			role="presentation"
		>
			<G>
				<Path d="M14.83 4.89l1.34.94-5.81 8.38H9.02L5.78 9.67l1.34-1.25 2.57 2.4z" />
			</G>
		</SVG>
	);

	return (
		<BaseControl label={ heading } id={ id } help={ help } className={ className }>
			<input
				id={ id }
				className="components-checkbox-control__input"
				type="checkbox"
				value="1"
				onChange={ onChangeValue }
				checked={ checked }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props }
			/>
			<label className="components-checkbox-control__label" htmlFor={ id }>
				{ checked ? svgCheck : null }
				{ label }
			</label>
		</BaseControl>
	);
}

export default withInstanceId( CheckboxControl );
