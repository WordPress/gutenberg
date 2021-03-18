/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';
import { is, noop } from '@wp-g2/utils';
// eslint-disable-next-line no-restricted-imports
import { MenuItem as ReakitMenuItem } from 'reakit';

/**
 * WordPress dependencies
 */
import { Icon, check, chevronLeft, chevronRight } from '@wordpress/icons';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BaseButton } from '../base-button';
import { Flex } from '../flex';
import { Text } from '../text';
import { useMenuContext } from './context';
import * as styles from './styles';

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').MenuItemProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function MenuItem( props, forwardedRef ) {
	const {
		as,
		children,
		className,
		closeOnClick = false,
		isBack = false,
		isOffset = false,
		isSelected,
		onClick = noop,
		prefix,
		showArrow = false,
		size,
		suffix,
		...otherProps
	} = useContextSystem( props, 'MenuItem' );

	const { menu } = useMenuContext();
	const shouldShowArrow = ! isBack && showArrow;

	const classes = cx(
		styles.MenuItem,
		size && styles[ size ],
		shouldShowArrow && styles.showArrow,
		isBack && styles.showBackArrow,
		isOffset && styles.offset,
		className
	);

	const Component = as || ( menu ? ReakitMenuItem : 'button' );

	const prevArrow = useMemo(
		() =>
			isBack && (
				<Text isBlock variant="muted">
					<Icon icon={ chevronLeft } size={ 16 } />
				</Text>
			),
		[ isBack ]
	);

	const nextArrow = useMemo(
		() =>
			shouldShowArrow && (
				<Text isBlock variant="muted">
					<Icon icon={ chevronRight } size={ 16 } />
				</Text>
			),
		[ shouldShowArrow ]
	);

	const selectedContent = useMemo(
		() =>
			is.defined( isSelected ) && (
				<Icon
					icon={ check }
					size={ 16 }
					style={ { opacity: isSelected ? 1 : 0 } }
				/>
			),
		[ isSelected ]
	);

	const prefixContent = useMemo( () => {
		return prevArrow || prefix ? (
			<Flex>
				{ prevArrow }
				{ prefix }
			</Flex>
		) : undefined;
	}, [ prefix, prevArrow ] );

	const suffixContent = useMemo( () => {
		return (
			( selectedContent || nextArrow || suffix ) && (
				<Flex>
					{ selectedContent }
					{ suffix }
					{ nextArrow }
				</Flex>
			)
		);
	}, [ nextArrow, selectedContent, suffix ] );

	const handleOnClick = useCallback(
		( /** @type {import('react').MouseEvent<HTMLDivElement>} */ event ) => {
			onClick( event );
			if ( menu?.hide && closeOnClick ) {
				menu.hide();
			}
		},
		[ closeOnClick, menu, onClick ]
	);

	return (
		<BaseButton
			as={ Component }
			isBlock
			noWrap={ false }
			{ ...otherProps }
			{ ...menu }
			className={ classes }
			onClick={ handleOnClick }
			pre={ prefixContent }
			ref={ forwardedRef }
			size={ size }
			suffix={ suffixContent }
			textAlign="left"
		>
			{ children }
		</BaseButton>
	);
}

/**
 * `MenuItem` is an actionable component that renders within a `Menu`.
 *
 * @example
 * ```jsx
 * <Menu>
 *  <MenuItem onClick={...}>Ana</MenuItem>
 *  <MenuItem onClick={...}>Elsa</MenuItem>
 *  <MenuItem onClick={...}>Olaf</MenuItem>
 * </Menu>
 * ```
 *
 * @see https://reakit.io/docs/menu/#menuitem
 */
const ConnectedMenuItem = contextConnect( MenuItem, 'MenuItem' );

export default ConnectedMenuItem;
