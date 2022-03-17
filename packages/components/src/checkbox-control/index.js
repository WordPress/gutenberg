/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useInstanceId, useRefEffect } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
import { Icon, check, reset } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

export default function CheckboxControl( {
	label,
	className,
	heading,
	checked,
	indeterminate,
	help,
	onChange,
	...props
} ) {
	if ( heading ) {
		deprecated( '`heading` prop in `CheckboxControl`', {
			alternative: 'a separate element to implement a heading',
			since: '5.8',
		} );
	}

	const [ showCheckedIcon, setShowCheckedIcon ] = useState( false );
	const [ showIndeterminateIcon, setShowIndeterminateIcon ] = useState(
		false
	);

	// Run the following callback everytime the `ref` (and the additional
	// dependencies) change.
	const ref = useRefEffect(
		( node ) => {
			if ( ! node ) {
				return;
			}

			// It cannot be set using an HTML attribute.
			node.indeterminate = !! indeterminate;

			setShowCheckedIcon( node.matches( ':checked' ) );
			setShowIndeterminateIcon( node.matches( ':indeterminate' ) );
		},
		[ checked, indeterminate ]
	);
	const instanceId = useInstanceId( CheckboxControl );
	const id = `inspector-checkbox-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.checked );

	let ariaChecked;
	if ( showCheckedIcon ) {
		ariaChecked = 'true';
	} else if ( showIndeterminateIcon ) {
		ariaChecked = 'mixed';
	} else {
		ariaChecked = 'false';
	}

	return (
		<BaseControl
			label={ heading }
			id={ id }
			help={ help }
			className={ classnames( 'components-checkbox-control', className ) }
		>
			<span className="components-checkbox-control__input-container">
				<input
					ref={ ref }
					id={ id }
					className="components-checkbox-control__input"
					type="checkbox"
					value="1"
					onChange={ onChangeValue }
					checked={ checked }
					aria-describedby={ !! help ? id + '__help' : undefined }
					aria-checked={ ariaChecked }
					{ ...props }
				/>
				{ showIndeterminateIcon ? (
					<Icon
						icon={ reset }
						className="components-checkbox-control__indeterminate"
						role="presentation"
					/>
				) : null }
				{ showCheckedIcon ? (
					<Icon
						icon={ check }
						className="components-checkbox-control__checked"
						role="presentation"
					/>
				) : null }
			</span>
			<label
				className="components-checkbox-control__label"
				htmlFor={ id }
			>
				{ label }
			</label>
		</BaseControl>
	);
}
