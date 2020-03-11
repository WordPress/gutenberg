/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children, cloneElement, useRef } from '@wordpress/element';

function ButtonGroup( {
	mode,
	checked,
	onChange,
	className,
	children: reactChildren,
	...props
} ) {
	const classes = classnames( 'components-button-group', className );
	const role = mode === 'radio' ? 'radiogroup' : 'group';
	const children = Children.toArray( reactChildren );
	const childRefs = useRef( new Map() );

	return (
		<div className={ classes } role={ role } { ...props }>
			{ mode === 'radio'
				? children.map( ( child, index ) => {
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
							ref: ( ref ) =>
								ref === null
									? childRefs.current.delete( index )
									: childRefs.current.set( index, ref ),
							onKeyDown( e ) {
								if (
									e.key === 'ArrowUp' ||
									e.key === 'ArrowLeft'
								) {
									e.preventDefault();

									const prevIndex =
										( index - 1 + children.length ) %
										children.length;
									const prevValue =
										children[ prevIndex ].props.value;

									childRefs.current.get( prevIndex ).focus();
									onChange( prevValue );
								}
								if (
									e.key === 'ArrowDown' ||
									e.key === 'ArrowRight'
								) {
									e.preventDefault();

									const nextIndex =
										( index + 1 ) % children.length;
									const nextValue =
										children[ nextIndex ].props.value;

									childRefs.current.get( nextIndex ).focus();
									onChange( nextValue );
								}
							},
							onClick() {
								onChange( value );
							},
						} );
				  } )
				: reactChildren }
		</div>
	);
}

export default ButtonGroup;
