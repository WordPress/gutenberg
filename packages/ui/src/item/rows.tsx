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

function join( ...ids: ( string | false | undefined )[] ) {
	return ids.filter( Boolean ).join( ' ' ) || undefined;
}

/**
 * The naming props a consumer can pass to a link or button row. They
 * follow the precedence of `Menu`: an explicit name replaces the label, and
 * an explicit description is added to the description and meta of the row.
 */
type AriaProps = {
	'aria-label'?: string;
	'aria-labelledby'?: string;
	'aria-describedby'?: string;
};

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
	aria?: AriaProps;
};

/**
 * What the three kinds of row share: the context for their parts, the
 * labelling of their control, their class names, and the list item they
 * wear inside a group.
 */
function useRow( {
	isActivatable,
	opensInNewTab = false,
	density = 'comfortable',
	aria = {},
}: RowOptions ) {
	const group = useContext( GroupContext );

	const id = useId();
	const labelId = `${ id }-label`;
	const descriptionId = `${ id }-description`;
	const metaId = `${ id }-meta`;
	const newTabNoticeId = `${ id }-new-tab`;

	// The label, the actions and the chevron are tracked in a ref, not in
	// state. Nothing is rendered from them; they only feed the warnings.
	const mountedRef = useRef( {
		label: false,
		actions: false,
		chevron: false,
	} );
	// The description and the meta are in state: the control of the row
	// references them.
	const [ parts, setParts ] = useState( {
		description: false,
		meta: false,
	} );

	const register = useCallback(
		( part: RowPart ) => {
			if ( part === 'description' || part === 'meta' ) {
				// A static row does not reference its description and
				// meta, so it does not need to render again when they
				// mount.
				if ( ! isActivatable ) {
					return () => {};
				}

				setParts( ( current ) => ( { ...current, [ part ]: true } ) );
				return () =>
					setParts( ( current ) => ( {
						...current,
						[ part ]: false,
					} ) );
			}

			const mounted = mountedRef.current;
			mounted[ part ] = true;

			if ( mounted.actions && mounted.chevron ) {
				warning(
					'Item.Chevron: a row that holds controls should not also show a chevron. The glyph reads as belonging to the control beside it rather than to the row.'
				);
			}

			return () => {
				mounted[ part ] = false;
			};
		},
		[ isActivatable ]
	);

	const hasExplicitName = !! (
		aria[ 'aria-label' ] || aria[ 'aria-labelledby' ]
	);

	useEffect( () => {
		// The effects of the parts run before this one, so the label has
		// registered itself by now if the row has one.
		if (
			isActivatable &&
			! hasExplicitName &&
			! mountedRef.current.label
		) {
			warning(
				'Item: an <Item.LinkRow> or <Item.ButtonRow> needs an <Item.Label>. Without it the link or button of the row has no accessible name.'
			);
		}
	}, [ isActivatable, hasExplicitName ] );

	const context = useMemo< RowContextValue >(
		() => ( {
			labelId,
			descriptionId,
			metaId,
			register,
			isActivatable,
			opensInNewTab,
		} ),
		[
			labelId,
			descriptionId,
			metaId,
			register,
			isActivatable,
			opensInNewTab,
		]
	);

	/**
	 * What names and describes the control of an activatable row. The
	 * control is an empty element that covers the row, so both come from
	 * the parts rendered beside it.
	 */
	const labelling = {
		'aria-label': aria[ 'aria-label' ],
		'aria-labelledby':
			aria[ 'aria-labelledby' ] ??
			( hasExplicitName
				? undefined
				: // The new-tab notice is part of the name, as it is in `Link`.
					join( labelId, opensInNewTab && newTabNoticeId ) ),
		'aria-describedby': join(
			aria[ 'aria-describedby' ],
			// An explicit name replaces the notice, so it is kept as a
			// description instead.
			hasExplicitName && opensInNewTab && newTabNoticeId,
			parts.description && descriptionId,
			parts.meta && metaId
		),
	};

	const className = clsx(
		defenseStyles.div,
		resetStyles[ 'box-sizing' ],
		styles.row,
		// Inside a group, the row inherits the density of the group.
		! group && styles[ `is-${ density }` ],
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
				{ /*
				 * The group ends at its list items. A row rendered further
				 * down, such as in a popup opened from `Item.Actions`, is
				 * not an item of this list. React passes context through
				 * portals, so it has to be reset here.
				 */ }
				<GroupContext.Provider value={ null }>
					{ content }
				</GroupContext.Provider>
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
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			'aria-describedby': ariaDescribedBy,
			...props
		},
		ref
	) {
		const opensInNewTab = openInNewTab || /^_blank$/i.test( target ?? '' );
		const hasDestination = !! props.href || !! render;

		useEffect( () => {
			if ( ! hasDestination ) {
				warning(
					'Item.LinkRow: pass an `href`, or a `render` prop that supplies one. Without it the row is not a link, and keyboard users cannot reach it.'
				);
			}
		}, [ hasDestination ] );
		const row = useRow( {
			isActivatable: true,
			opensInNewTab,
			density,
			aria: {
				'aria-label': ariaLabel,
				'aria-labelledby': ariaLabelledBy,
				'aria-describedby': ariaDescribedBy,
			},
		} );

		const link = useRender( {
			defaultTagName: 'a',
			render,
			ref,
			props: mergeProps< 'a' >( props, row.labelling, {
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
		{
			children,
			className,
			density,
			style,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			'aria-describedby': ariaDescribedBy,
			...props
		},
		ref
	) {
		const row = useRow( {
			isActivatable: true,
			density,
			aria: {
				'aria-label': ariaLabel,
				'aria-labelledby': ariaLabelledBy,
				'aria-describedby': ariaDescribedBy,
			},
		} );

		return row.wrap(
			<div className={ clsx( row.className, className ) } style={ style }>
				<Button
					ref={ ref }
					variant="unstyled"
					{ ...props }
					{ ...row.labelling }
					className={ clsx( styles.surface, styles[ 'is-button' ] ) }
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
