import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import {
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import warning from '@wordpress/warning';
import type { ReactElement } from 'react';
import { Button } from '../button';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import focusStyles from '../utils/css/focus.module.scss';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { GroupContext, RowContext } from './context';
import type { RowContextValue, RowPart } from './context';
import type {
	ButtonRowProps,
	ContentRowProps,
	Density,
	LinkRowProps,
} from './types';

function join( ...ids: ( string | false )[] ) {
	return ids.filter( Boolean ).join( ' ' ) || undefined;
}

type RowOptions = {
	/**
	 * Whether the row itself is a link or a button.
	 */
	isActivatable: boolean;
	/**
	 * Whether the row is a link that opens in a new tab.
	 */
	opensInNewTab?: boolean;
	density?: Density;
};

/**
 * What the three kinds of row share: the context for their parts, the
 * labelling of their control, their class names, and the list item they
 * wear inside a group.
 */
function useRow( {
	isActivatable,
	opensInNewTab = false,
	density: densityProp = 'comfortable',
}: RowOptions ) {
	const group = useContext( GroupContext );
	const density = group?.density ?? densityProp;

	const id = useId();
	const labelId = `${ id }-label`;
	const descriptionId = `${ id }-description`;
	const metaId = `${ id }-meta`;
	const newTabNoticeId = `${ id }-new-tab`;

	// The label and the chevron are tracked in a ref, not in state. Nothing
	// is rendered from them; they only feed the warnings below.
	const warnedPartsRef = useRef( { label: false, chevron: false } );
	const [ parts, setParts ] = useState( {
		description: false,
		meta: false,
		actions: false,
	} );

	const register = useCallback( ( part: RowPart ) => {
		if ( part === 'label' || part === 'chevron' ) {
			warnedPartsRef.current[ part ] = true;
			return () => {
				warnedPartsRef.current[ part ] = false;
			};
		}

		setParts( ( current ) => ( { ...current, [ part ]: true } ) );
		return () =>
			setParts( ( current ) => ( { ...current, [ part ]: false } ) );
	}, [] );

	useEffect( () => {
		// The effects of the parts run before this one, so the parts of
		// the row have registered themselves by now.
		if ( isActivatable && ! warnedPartsRef.current.label ) {
			warning(
				'Item: an <Item.LinkRow> or <Item.ButtonRow> needs an <Item.Label>. Without it the link or button of the row has no accessible name.'
			);
		}
		if ( opensInNewTab && ! warnedPartsRef.current.chevron ) {
			warning(
				'Item: an <Item.LinkRow> that opens in a new tab needs an <Item.Chevron>. It shows the new-tab arrow in place of the chevron.'
			);
		}
	}, [ isActivatable, opensInNewTab ] );

	const context = useMemo< RowContextValue >(
		() => ( {
			labelId,
			descriptionId,
			metaId,
			register,
			isActivatable,
			opensInNewTab,
			hasActions: parts.actions,
		} ),
		[
			labelId,
			descriptionId,
			metaId,
			register,
			isActivatable,
			opensInNewTab,
			parts.actions,
		]
	);

	/**
	 * What names and describes the control of an activatable row. The
	 * control is an empty element that covers the row, so both come from
	 * the parts rendered beside it.
	 */
	const labelling = {
		// The new-tab notice is part of the name, as it is in `Link`.
		'aria-labelledby': join( labelId, opensInNewTab && newTabNoticeId ),
		'aria-describedby': join(
			parts.description && descriptionId,
			parts.meta && metaId
		),
	};

	const className = clsx(
		defenseStyles.div,
		resetStyles[ 'box-sizing' ],
		styles.row,
		styles[ `is-${ density }` ],
		isActivatable && styles[ 'is-activatable' ],
		// Inside a group, the group or the list item draws the frame.
		! group && styles[ 'has-frame' ]
	);

	// Inside a group the row is one of a list, so it wears a list item.
	// On its own it is only the row.
	function wrap( row: ReactElement ) {
		const content = (
			<RowContext.Provider value={ context }>{ row }</RowContext.Provider>
		);

		if ( ! group ) {
			return content;
		}

		return (
			<li
				className={ clsx(
					defenseStyles.li,
					styles.listitem,
					group.variant === 'detached' && styles[ 'has-frame' ]
				) }
			>
				{ content }
			</li>
		);
	}

	return { className, labelling, newTabNoticeId, wrap };
}

/**
 * A row that takes you somewhere. The whole row is the link.
 *
 * The link is an empty element that covers the row; it does not wrap the
 * row. Controls in `Item.Actions` sit above it, so nothing interactive is
 * nested and each control keeps its own target.
 *
 * `className` and `style` apply to the row. The `ref`, the `render` prop
 * and all other props apply to the link. Use `render` to compose the row
 * with a router link.
 *
 * With `openInNewTab`, or with `target="_blank"`, the row tells assistive
 * technology that it opens in a new tab, and its `Item.Chevron` shows the
 * new-tab arrow.
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
		{
			children,
			className,
			density,
			openInNewTab = false,
			render,
			style,
			target,
			...props
		},
		ref
	) {
		const opensInNewTab = openInNewTab || /^_blank$/i.test( target ?? '' );
		const row = useRow( { isActivatable: true, opensInNewTab, density } );

		const link = useRender( {
			defaultTagName: 'a',
			render,
			ref,
			props: mergeProps< 'a' >( row.labelling, props, {
				target: target ?? ( openInNewTab ? '_blank' : undefined ),
				className: clsx(
					defenseStyles.a,
					focusStyles[ 'outset-ring--focus-except-active' ],
					styles.surface
				),
			} ),
		} );

		return row.wrap(
			<div className={ clsx( row.className, className ) } style={ style }>
				{ link }
				{ opensInNewTab && (
					// Hidden, so that it is read only as part of the name
					// of the link, which references it.
					<span id={ row.newTabNoticeId } hidden>
						{
							/* translators: accessibility text appended to link text */
							__( '(opens in a new tab)' )
						}
					</span>
				) }
				{ children }
			</div>
		);
	}
);

/**
 * A row that runs a command, or that opens a popup. The whole row is the
 * button.
 *
 * The button is an empty element that covers the row; it does not wrap the
 * row. Controls in `Item.Actions` sit above it, so nothing interactive is
 * nested and each control keeps its own target.
 *
 * `className` and `style` apply to the row. The `ref`, the `render` prop
 * and all other props apply to the button.
 *
 * ```jsx
 * <Item.ButtonRow onClick={ openColorPicker }>
 * 	<Item.Label>Background</Item.Label>
 * 	<Item.Actions>
 * 		<IconButton icon={ reset } label="Reset background color" />
 * 	</Item.Actions>
 * </Item.ButtonRow>
 * ```
 */
export const ButtonRow = forwardRef< HTMLButtonElement, ButtonRowProps >(
	function ItemButtonRow(
		{ children, className, density, style, ...props },
		ref
	) {
		const row = useRow( { isActivatable: true, density } );

		return row.wrap(
			<div className={ clsx( row.className, className ) } style={ style }>
				<Button
					ref={ ref }
					variant="unstyled"
					{ ...row.labelling }
					{ ...props }
					className={ styles.surface }
				/>
				{ children }
			</div>
		);
	}
);

/**
 * A row of static content. The row is not a target: only the controls in
 * its `Item.Actions` are interactive.
 *
 * ```jsx
 * <Item.ContentRow>
 * 	<Item.Label>Soft shadow</Item.Label>
 * 	<Item.Actions>
 * 		<Button variant="outline">Edit</Button>
 * 	</Item.Actions>
 * </Item.ContentRow>
 * ```
 */
export const ContentRow = forwardRef< HTMLDivElement, ContentRowProps >(
	function ItemContentRow( { density, render, ...props }, ref ) {
		const row = useRow( { isActivatable: false, density } );

		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >( { className: row.className }, props ),
		} );

		return row.wrap( element );
	}
);

LinkRow.displayName = 'Item.LinkRow';
ButtonRow.displayName = 'Item.ButtonRow';
ContentRow.displayName = 'Item.ContentRow';
