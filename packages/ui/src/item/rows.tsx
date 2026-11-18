import clsx from 'clsx';
import {
	forwardRef,
	useCallback,
	useId,
	useMemo,
	useState,
} from '@wordpress/element';
import type { ReactNode } from 'react';
import { Button as UIButton } from '../button';
import { Link as UILink } from '../link';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import styles from './style.module.css';
import { RowContext, useGroupContext } from './context';
import type { RowContextValue } from './context';
import type { ButtonRowProps, ContentRowProps, LinkRowProps } from './types';

function join( ...ids: ( string | false | undefined )[] ) {
	const present = ids.filter( Boolean );
	return present.length ? present.join( ' ' ) : undefined;
}

/**
 * The labelling a row shares with its parts, and the list item it wears
 * inside a group.
 */
function useRow() {
	const { inGroup, density } = useGroupContext();
	const id = useId();
	const labelId = `${ id }-label`;
	const descriptionId = `${ id }-description`;
	const metaId = `${ id }-meta`;

	const [ parts, setParts ] = useState( {
		label: false,
		description: false,
		meta: false,
		actions: false,
	} );

	const register = useCallback(
		( part: 'label' | 'description' | 'meta' | 'actions' ) => {
			setParts( ( current ) => ( { ...current, [ part ]: true } ) );
			return () =>
				setParts( ( current ) => ( { ...current, [ part ]: false } ) );
		},
		[]
	);

	// A control inside the row is described by the row it belongs to, so
	// "Reset" is announced as "Reset, Background". The meta is left out: it
	// describes the row, not what the control will do.
	const actionDescribedBy = join(
		parts.label && labelId,
		parts.description && descriptionId
	);

	const context = useMemo(
		() => ( {
			labelId,
			descriptionId,
			metaId,
			register,
			actionDescribedBy,
			hasActions: parts.actions,
		} ),
		[
			labelId,
			descriptionId,
			metaId,
			register,
			actionDescribedBy,
			parts.actions,
		]
	);

	/**
	 * What names the row's own control. The control is an empty element
	 * covering the row, so its name has to come from the label rendered
	 * beside it rather than from its own content.
	 */
	const labelling = {
		'aria-labelledby': parts.label ? labelId : undefined,
		'aria-describedby': join(
			parts.description && descriptionId,
			parts.meta && metaId
		),
	};

	return { context, density, inGroup, labelling };
}

/**
 * The row itself: its parts, the context they share, and the list item it
 * wears inside a group.
 */
type RowBoxProps = Omit<
	React.HTMLAttributes< HTMLDivElement >,
	'children' | 'className'
> & {
	children: ReactNode;
	className?: string;
	context: RowContextValue;
	density: string;
	inGroup: boolean;
};

const Row = forwardRef< HTMLDivElement, RowBoxProps >( function ItemRowBox(
	{ children, className, context, density, inGroup, ...props },
	ref
) {
	const row = (
		<RowContext.Provider value={ context }>
			<div
				ref={ ref }
				className={ clsx(
					defenseStyles.div,
					styles.row,
					styles[ `is-${ density }` ],
					className
				) }
				{ ...props }
			>
				{ children }
			</div>
		</RowContext.Provider>
	);

	// In a group the row is one of a set, so it wears a list item. On its
	// own it is just the row.
	return inGroup ? (
		<li className={ clsx( defenseStyles.li, styles.listitem ) }>{ row }</li>
	) : (
		row
	);
} );

/**
 * A row that takes you somewhere. The whole row is the link.
 *
 * The link is an empty element covering the row rather than a wrapper
 * around it, so controls in `Item.Actions` sit above it instead of inside
 * it. Nothing interactive is nested, and each control keeps its own target.
 *
 * ```jsx
 * <Item.LinkRow href="/styles">
 * 	<Item.Label>Global Styles</Item.Label>
 * 	<Item.Description>Open typography and colors.</Item.Description>
 * 	<Item.Chevron />
 * </Item.LinkRow>
 * ```
 */
export const LinkRow = forwardRef< HTMLAnchorElement, LinkRowProps >(
	function ItemLinkRow(
		{ children, className, href, rel, target, onClick, ...props },
		ref
	) {
		const { context, density, inGroup, labelling } = useRow();

		return (
			<Row
				className={ clsx( styles[ 'is-activatable' ], className ) }
				context={ context }
				density={ density }
				inGroup={ inGroup }
			>
				<UILink
					ref={ ref }
					variant="unstyled"
					className={ styles.surface }
					href={ href }
					target={ target }
					rel={ rel }
					onClick={ onClick }
					{ ...labelling }
					{ ...props }
				/>
				{ children }
			</Row>
		);
	}
);

/**
 * A row that runs a command. The whole row is the button, drawn the same
 * way as `Item.LinkRow`.
 */
export const ButtonRow = forwardRef< HTMLButtonElement, ButtonRowProps >(
	function ItemButtonRow( { children, className, onClick, ...props }, ref ) {
		const { context, density, inGroup, labelling } = useRow();

		return (
			<Row
				className={ clsx( styles[ 'is-activatable' ], className ) }
				context={ context }
				density={ density }
				inGroup={ inGroup }
			>
				<UIButton
					ref={ ref }
					variant="unstyled"
					className={ styles.surface }
					onClick={ onClick }
					{ ...labelling }
					{ ...props }
				/>
				{ children }
			</Row>
		);
	}
);

/**
 * A row of static content whose controls are its own. The row is not a
 * target, so clicking the label does nothing.
 */
export const ContentRow = forwardRef< HTMLDivElement, ContentRowProps >(
	function ItemContentRow( { children, className, ...props }, ref ) {
		const { context, density, inGroup } = useRow();

		return (
			<Row
				ref={ ref }
				className={ className }
				context={ context }
				density={ density }
				inGroup={ inGroup }
				{ ...props }
			>
				{ children }
			</Row>
		);
	}
);

LinkRow.displayName = 'Item.LinkRow';
ButtonRow.displayName = 'Item.ButtonRow';
ContentRow.displayName = 'Item.ContentRow';
