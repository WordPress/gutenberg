/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	ALIGNMENTS,
	DIRECTION,
	getAlignmentIndex,
	getAlignmentValueFromIndex,
	getNextIndexFromDirection,
} from './utils';
import Cell from './cell';
import { Root } from './styles/alignment-matrix-control-styles';
import { useControlledState } from '../utils/hooks';
import { useRTL } from '../utils/rtl';
import AlignmentMatrixControlIcon from './icon';

export default function AlignmentMatrixControl( {
	className,
	label = __( 'Alignment Matrix Control' ),
	hasFocusBorder = true,
	onChange = noop,
	onKeyDown = noop,
	value = 'center',
	...props
} ) {
	const isRTL = useRTL();
	const [ alignIndex, setAlignIndex ] = useControlledState(
		getAlignmentIndex( value )
	);
	const nodeRef = useRef();
	const instanceId = useInstanceId( AlignmentMatrixControl );

	const handleOnChange = ( nextIndex, changeProps ) => {
		const alignName = getAlignmentValueFromIndex( nextIndex );

		setAlignIndex( nextIndex );
		onChange( alignName, changeProps );
	};

	const handleOnKeyDown = ( event ) => {
		const { keyCode } = event;
		let nextIndex;
		let direction;

		onKeyDown( event );

		switch ( keyCode ) {
			case UP:
				event.preventDefault();
				direction = DIRECTION.UP;

				nextIndex = getNextIndexFromDirection( alignIndex, direction );
				handleOnChange( nextIndex, { event } );

				break;
			case DOWN:
				event.preventDefault();
				direction = DIRECTION.DOWN;

				nextIndex = getNextIndexFromDirection( alignIndex, direction );
				handleOnChange( nextIndex, { event } );

				break;
			case LEFT:
				event.preventDefault();
				direction = isRTL ? DIRECTION.RIGHT : DIRECTION.LEFT;

				nextIndex = getNextIndexFromDirection( alignIndex, direction );
				handleOnChange( nextIndex, { event } );

				break;
			case RIGHT:
				event.preventDefault();
				direction = isRTL ? DIRECTION.LEFT : DIRECTION.RIGHT;

				nextIndex = getNextIndexFromDirection( alignIndex, direction );
				handleOnChange( nextIndex, { event } );

				break;
			default:
				break;
		}
	};

	const createHandleOnClick = ( index ) => ( event ) => {
		nodeRef.current.focus();
		event.preventDefault();
		handleOnChange( index, { event } );
	};

	/**
	 * Keydown event is handled on the native node element rather than
	 * on the React Element. This resolves interaction conflicts when
	 * integrated with other components, such as Toolbar.
	 */
	useEffect( () => {
		const node = nodeRef.current;
		if ( node ) {
			node.addEventListener( 'keydown', handleOnKeyDown );
		}

		return () => {
			if ( node ) {
				node.removeEventListener( 'keydown', handleOnKeyDown );
			}
		};
	}, [ handleOnKeyDown ] );

	const id = `alignment-matrix-control-${ instanceId }`;
	const activeCellId = `${ id }-${ alignIndex }`;

	const classes = classnames(
		'component-alignment-matrix-control',
		className
	);

	return (
		<Root
			{ ...props }
			aria-activedescendant={ activeCellId }
			aria-label={ label }
			aria-labelledby={ id }
			className={ classes }
			hasFocusBorder={ hasFocusBorder }
			id={ id }
			ref={ nodeRef }
			role="listbox"
			tabIndex={ 0 }
		>
			{ ALIGNMENTS.map( ( align, index ) => {
				const isActive = alignIndex === index;
				const cellId = `${ id }-${ index }`;
				const cellValue = getAlignmentValueFromIndex( index );

				return (
					<Cell
						id={ cellId }
						isActive={ isActive }
						key={ align }
						onClick={ createHandleOnClick( index ) }
						value={ cellValue }
					/>
				);
			} ) }
		</Root>
	);
}

AlignmentMatrixControl.Icon = AlignmentMatrixControlIcon;
AlignmentMatrixControl.icon = <AlignmentMatrixControlIcon />;

AlignmentMatrixControl.__getAlignmentIndex = getAlignmentIndex;
