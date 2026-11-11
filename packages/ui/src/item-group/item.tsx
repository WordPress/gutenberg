import clsx from 'clsx';
import {
	Children,
	cloneElement,
	Fragment,
	forwardRef,
	isValidElement,
	useId,
} from '@wordpress/element';
import { chevronRight } from '@wordpress/icons';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '../button';
import { Icon } from '../icon';
import { Link } from '../link';
import { Text } from '../text';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import styles from './style.module.css';
import type { ItemProps } from './types';

/**
 * Joins the ids that describe an element, dropping the ones that do not
 * exist, so `aria-describedby` is either a valid list or absent.
 */
function describedBy( ...ids: ( string | undefined )[] ) {
	const present = ids.filter( Boolean );
	return present.length ? present.join( ' ' ) : undefined;
}

/**
 * Describes each action by the item it belongs to, so a short visible label
 * such as "Export" is announced as "Export, Export settings".
 */
function describeActions( actions: ReactNode, ids: string ): ReactNode {
	return Children.map( actions, ( action ) => {
		if ( ! isValidElement( action ) ) {
			return action;
		}

		// Several controls are usually passed in a fragment. Describe what
		// is inside it rather than the fragment, which carries nothing.
		if ( action.type === Fragment ) {
			const fragment = action as ReactElement< {
				children?: ReactNode;
			} >;
			return describeActions( fragment.props.children, ids );
		}

		const element = action as ReactElement< {
			'aria-describedby'?: string;
		} >;

		return cloneElement( element, {
			'aria-describedby': describedBy(
				element.props[ 'aria-describedby' ],
				ids
			),
		} );
	} );
}

/**
 * One row of an `ItemGroup`.
 *
 * An item can be the control itself, through `href` or `onClick`, in which
 * case the whole row activates and a trailing glyph says what that does. It
 * can also hold controls of its own through `actions`, which stay separate
 * activation targets. Both at once is supported: the controls are siblings
 * of the row's own control, never nested inside it.
 */
export const Item = forwardRef< HTMLElement, ItemProps >(
	function ItemGroupItem(
		{
			actions,
			badges,
			className,
			decoration,
			description,
			href,
			navigation = 'drilldown',
			onClick,
			rel,
			target,
			title,
			...restProps
		},
		ref
	) {
		const id = useId();
		const titleId = `${ id }-title`;
		const descriptionId = `${ id }-description`;
		const badgesId = `${ id }-badges`;

		// A glyph says what activating the row does, so a row that cannot be
		// activated never shows one.
		const isActivatable = !! href || !! onClick;
		const showsGlyph = isActivatable && navigation !== 'none';

		const content = (
			<>
				{ !! decoration && (
					<span className={ styles.decoration } aria-hidden="true">
						{ decoration }
					</span>
				) }
				<span className={ styles.body }>
					<span className={ styles.text }>
						<Text
							id={ titleId }
							className={ styles.title }
							variant="body-md"
						>
							{ title }
						</Text>
						{ !! description && (
							<Text
								id={ descriptionId }
								className={ styles.description }
								variant="body-sm"
							>
								{ description }
							</Text>
						) }
					</span>
					{ !! badges && (
						<span id={ badgesId } className={ styles.badges }>
							{ badges }
						</span>
					) }
				</span>
				{ showsGlyph && (
					<Icon
						className={ styles.glyph }
						icon={ chevronRight }
						aria-hidden="true"
					/>
				) }
			</>
		);

		// An activatable item is named by its title alone, so the link or
		// button announces the destination and nothing else. The description
		// and the status follow as descriptions.
		const activatableProps = {
			'aria-labelledby': titleId,
			'aria-describedby': describedBy(
				description ? descriptionId : undefined,
				badges ? badgesId : undefined
			),
			className: styles.control,
			children: content,
		};

		let control;
		if ( href ) {
			control = (
				<Link
					ref={ ref as React.Ref< HTMLAnchorElement > }
					variant="unstyled"
					href={ href }
					target={ target }
					rel={ rel }
					onClick={ onClick }
					{ ...activatableProps }
					{ ...restProps }
				/>
			);
		} else if ( onClick ) {
			control = (
				<Button
					ref={ ref as React.Ref< HTMLButtonElement > }
					variant="unstyled"
					onClick={ onClick }
					{ ...activatableProps }
					{ ...restProps }
				/>
			);
		} else {
			control = (
				<div
					ref={ ref as React.Ref< HTMLDivElement > }
					className={ clsx( defenseStyles.div, styles.control ) }
					{ ...restProps }
				>
					{ content }
				</div>
			);
		}

		return (
			<li className={ clsx( defenseStyles.li, styles.item, className ) }>
				{ control }
				{ !! actions && (
					<span className={ styles.actions }>
						{ describeActions(
							actions,
							describedBy(
								titleId,
								description ? descriptionId : undefined
							) as string
						) }
					</span>
				) }
			</li>
		);
	}
);

Item.displayName = 'ItemGroup.Item';
