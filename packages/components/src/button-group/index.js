/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Children,
	useRef,
	createContext,
	useEffect,
	useState,
} from '@wordpress/element';

export const RadioContext = createContext( {} );

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
	const childRefs = useRef( [] );
	const [ context, setContext ] = useState( {} );

	useEffect( () => {
		const children = Children.toArray( reactChildren );
		const current = {};
		children.forEach( ( child, index ) => {
			const { value } = child.props;
			const isChecked = checked === value;
			current[ value ] = {
				role: mode,
				'aria-checked': isChecked,
				tabIndex: isChecked || ( ! checked && index === 0 ) ? 0 : -1,
				ref: ( ref ) => {
					if ( ref === null ) {
						delete childRefs.current[ index ];
					} else {
						childRefs.current[ index ] = ref;
					}
				},
				onKeyDown( e ) {
					if ( e.key === 'ArrowUp' || e.key === 'ArrowLeft' ) {
						e.preventDefault();

						const prevIndex =
							( index - 1 + children.length ) % children.length;
						const prevValue = children[ prevIndex ].props.value;

						childRefs.current[ prevIndex ].focus();
						onChange( prevValue );
					}
					if ( e.key === 'ArrowDown' || e.key === 'ArrowRight' ) {
						e.preventDefault();

						const nextIndex = ( index + 1 ) % children.length;
						const nextValue = children[ nextIndex ].props.value;

						childRefs.current[ nextIndex ].focus();
						onChange( nextValue );
					}
				},
				onClick() {
					onChange( value );
				},
			};
		} );
		setContext( { current } );
	}, [ reactChildren ] );

	return (
		<div className={ classes } role={ role } { ...props }>
			{ mode === 'radio' ? (
				<RadioContext.Provider value={ context.current || {} }>
					{ reactChildren }
				</RadioContext.Provider>
			) : (
				reactChildren
			) }
		</div>
	);
}

export default ButtonGroup;
