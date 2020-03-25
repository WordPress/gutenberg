/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children, useRef, createContext, useMemo } from '@wordpress/element';

// Default values for when a button isn't a child of a group
export const ButtonGroupContext = createContext( {
	mode: null,
	buttons: {},
} );

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
	const childRefs = useRef( [] );

	const buttons = useMemo( () => {
		const buttonsContext = {};
		if ( mode === 'radio' ) {
			const childrenArray = Children.toArray( children );
			childrenArray.forEach( ( child, index ) => {
				buttonsContext[ child.props.value ] = {
					isChecked: checked === child.props.value,
					isFirst: ! checked && index === 0,
					onPrev: () => {
						const prevIndex =
							( index - 1 + childrenArray.length ) %
							childrenArray.length;
						childRefs.current[ prevIndex ].focus();
						onChange( childrenArray[ prevIndex ].props.value );
					},
					onNext: () => {
						const nextIndex = ( index + 1 ) % childrenArray.length;
						childRefs.current[ nextIndex ].focus();
						onChange( childrenArray[ nextIndex ].props.value );
					},
					onSelect: () => {
						onChange( child.props.value );
					},
					refCallback: ( ref ) => {
						if ( ref === null ) {
							delete childRefs.current[ index ];
						} else {
							childRefs.current[ index ] = ref;
						}
					},
				};
			} );
			return buttonsContext;
		}
	}, [ children, mode, onChange, checked, childRefs ] );

	return (
		<div className={ classes } role={ role } { ...props }>
			<ButtonGroupContext.Provider value={ { mode, buttons } }>
				{ children }
			</ButtonGroupContext.Provider>
		</div>
	);
}

export default ButtonGroup;
