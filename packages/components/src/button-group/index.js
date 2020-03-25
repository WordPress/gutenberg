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
	const [ buttons, setButtons ] = useState( {} );

	useEffect( () => {
		const children = Children.toArray( reactChildren );
		const allButtons = {};
		children.forEach( ( child, index ) => {
			const prevIndex = ( index - 1 + children.length ) % children.length;
			const nextIndex = ( index + 1 ) % children.length;
			allButtons[ child.props.value ] = {
				isChecked: checked === child.props.value,
				isFirst: ! checked && index === 0,
				onPrev: () => {
					childRefs.current[ prevIndex ].focus();
					onChange( children[ prevIndex ].props.value );
				},
				onNext: () => {
					childRefs.current[ nextIndex ].focus();
					onChange( children[ nextIndex ].props.value );
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
		setButtons( allButtons );
	}, [ reactChildren ] );

	return (
		<div className={ classes } role={ role } { ...props }>
			{ mode === 'radio' ? (
				<RadioContext.Provider
					value={ {
						buttons,
						checked,
						mode,
						onChange,
					} }
				>
					{ reactChildren }
				</RadioContext.Provider>
			) : (
				reactChildren
			) }
		</div>
	);
}

export default ButtonGroup;
