/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';

function ButtonGroup( {
	mode,
	checked,
	onChange,
	className,
	children,
	...props
} ) {
	const classes = classnames( 'components-button-group', className );
	const role = mode === 'radio' ? 'radiogroup' : 'group';

	return (
		<div className={ classes } role={ role } { ...props }>
			{ mode === 'radio'
				? Children.map( children, ( child, index ) => {
						// TODO: Handle children witout value props
						const { value } = child.props;
						const isChecked = checked === value;
						return cloneElement( child, {
							role: mode,
							'aria-checked': isChecked,
							isPrimary: isChecked,
							isSecondary: ! isChecked,
							tabIndex:
								isChecked || ( ! checked && index === 0 )
									? 0
									: -1,
							onClick() {
								onChange( value );
							},
						} );
				  } )
				: children }
		</div>
	);
}

export default ButtonGroup;
