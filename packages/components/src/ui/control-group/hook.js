/**
 * Internal dependencies
 */
import { getValidChildren } from '../utils/get-valid-children';
import { useContextSystem } from '../context';
import { ControlGroupContext } from './context';
import * as styles from './styles';
import { useCx } from '../../utils/hooks/use-cx';

/**
 * @param {import('../context').WordPressComponentProps<import('./types').Props, 'div'>} props
 */
export function useControlGroup( props ) {
	const {
		children,
		className,
		direction = 'row',
		templateColumns,
		...otherProps
	} = useContextSystem( props, 'ControlGroup' );

	const validChildren = getValidChildren( children );
	const isVertical = direction === 'column';
	const isGrid = !! templateColumns;

	const cx = useCx();

	const classes = cx(
		styles.itemFocus,
		isGrid && styles.itemGrid,
		className
	);

	const clonedChildren =
		validChildren &&
		validChildren.map( ( child, index ) => {
			const isFirst = index === 0;
			const isLast = index + 1 === validChildren.length;
			const isOnly = isFirst && isLast;
			const isMiddle = ! isFirst && ! isLast;

			// @ts-ignore
			const _key = child?.key || index;

			/** @type {import('@emotion/react').SerializedStyles | undefined} */
			let first;
			if ( isFirst ) {
				if ( isVertical ) {
					first = styles.firstRow;
				} else {
					first = styles.first;
				}
			}

			/** @type {import('@emotion/react').SerializedStyles | undefined} */
			let last;
			if ( isLast ) {
				if ( isVertical ) {
					last = styles.lastRow;
				} else {
					last = styles.last;
				}
			}

			const contextStyles = cx( first, isMiddle && styles.middle, last );

			const contextProps = {
				isFirst,
				isLast,
				isMiddle,
				isOnly,
				isVertical,
				styles: contextStyles,
			};

			return (
				<ControlGroupContext.Provider
					key={ _key }
					value={ contextProps }
				>
					{ child }
				</ControlGroupContext.Provider>
			);
		} );

	return {
		...otherProps,
		children: clonedChildren,
		className: classes,
		direction,
		templateColumns,
	};
}
