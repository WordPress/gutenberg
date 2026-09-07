import { useIsomorphicLayoutEffect } from '@wordpress/compose';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
/* eslint-disable @wordpress/use-recommended-components -- admin-ui is a bundled package that depends on @wordpress/ui */
import {
	Button,
	Icon,
	IconButton,
	LinkButton,
	Menu,
	Stack,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */
import type { Page2Action, Page2Actions as Page2ActionsConfig } from './types';
import styles from './style.module.css';

type ActionRole = { variant: 'solid' | 'outline'; tone: 'brand' };

const PRIMARY_ROLE: ActionRole = { variant: 'solid', tone: 'brand' };
const SECONDARY_ROLE: ActionRole = { variant: 'outline', tone: 'brand' };

// A minimal width reserved for the title/breadcrumbs cluster before the
// expanded action set is allowed to claim the rest of the header row.
const MIN_LOCKUP_RESERVE = 40;

function ActionButton( {
	action,
	role,
}: {
	action: Page2Action;
	role: ActionRole;
} ) {
	if ( 'href' in action ) {
		const { label, icon, href, openInNewTab, ...rest } = action;
		return (
			<LinkButton
				href={ href }
				openInNewTab={ openInNewTab }
				size="compact"
				{ ...role }
				{ ...rest }
			>
				{ icon && <LinkButton.Icon icon={ icon } /> }
				{ label }
			</LinkButton>
		);
	}

	const { label, icon, disabled, onClick, iconOnly, ...rest } = action;

	if ( process.env.NODE_ENV !== 'production' && iconOnly && ! icon ) {
		throw new Error(
			`Page2: action "${ label }" has \`iconOnly\` set but no \`icon\`.`
		);
	}

	if ( iconOnly && icon ) {
		return (
			<IconButton
				icon={ icon }
				label={ label }
				onClick={ onClick }
				disabled={ disabled }
				size="compact"
				{ ...role }
				{ ...rest }
			/>
		);
	}

	return (
		<Button
			onClick={ onClick }
			disabled={ disabled }
			size="compact"
			{ ...role }
			{ ...rest }
		>
			{ icon && <Button.Icon icon={ icon } /> }
			{ label }
		</Button>
	);
}

function OverflowMenu( { items }: { items: readonly Page2Action[] } ) {
	if ( ! items.length ) {
		return null;
	}

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<IconButton
						icon={ moreVertical }
						label={ __( 'More actions' ) }
						size="compact"
						tone="neutral"
						variant="minimal"
					/>
				}
			/>
			<Menu.Popup>
				{ items.map( ( action, index ) => {
					const { label, icon } = action;
					const prefix = icon ? (
						<Icon icon={ icon } size={ 20 } />
					) : undefined;

					if ( 'href' in action ) {
						return (
							<Menu.LinkItem
								key={ index }
								href={ action.href }
								openInNewTab={ action.openInNewTab }
								prefix={ prefix }
							>
								<Menu.ItemLabel>{ label }</Menu.ItemLabel>
							</Menu.LinkItem>
						);
					}

					return (
						<Menu.Item
							key={ index }
							onClick={ action.onClick }
							disabled={ action.disabled }
							prefix={ prefix }
						>
							<Menu.ItemLabel>{ label }</Menu.ItemLabel>
						</Menu.Item>
					);
				} ) }
			</Menu.Popup>
		</Menu.Root>
	);
}

function getOverflowItems(
	actions: Page2ActionsConfig,
	isCollapsed: boolean
): readonly Page2Action[] {
	const overflow = actions.overflow ?? [];
	if ( ! isCollapsed || ! actions.secondary?.length ) {
		return overflow;
	}
	// Collapsed secondary actions move into the overflow menu ahead of the
	// actions that are always in overflow.
	return [ ...actions.secondary, ...overflow ];
}

/**
 * Renders `Page2`'s `actions` prop: a labelled group with a primary action,
 * up to two secondary actions, and an overflow menu.
 *
 * On narrow containers (observed via `ResizeObserver`, not viewport
 * breakpoints), secondary actions move into the overflow menu to make room.
 */
export default function Page2ActionsGroup( {
	actions,
}: {
	actions: Page2ActionsConfig;
} ) {
	const { primary, secondary } = actions;
	const hasSecondary = !! secondary?.length;

	const groupRef = useRef< HTMLDivElement >( null );
	const probeRef = useRef< HTMLDivElement >( null );
	const [ isCollapsed, setIsCollapsed ] = useState( false );

	useIsomorphicLayoutEffect( () => {
		const group = groupRef.current;
		const probe = probeRef.current;

		if ( ! group || ! probe || ! hasSecondary ) {
			return;
		}

		// The nearest ancestor that actually has room to give up is the
		// header row this group shares with the title/breadcrumbs cluster:
		// that cluster absorbs the squeeze via its own `min-width: 0` and
		// text truncation, all the way down to nothing. So the only thing
		// that needs measuring is whether the row has room for the expanded
		// action set at all, leaving a small, fixed reserve for the cluster
		// rather than deriving it from this group's own (circular) width.
		const row = group.parentElement;

		if ( ! row || typeof ResizeObserver !== 'function' ) {
			return;
		}

		const measure = () => {
			const rowWidth = row.getBoundingClientRect().width;
			const requiredWidth = probe.scrollWidth + MIN_LOCKUP_RESERVE;

			setIsCollapsed( ( current ) => {
				const next = requiredWidth > rowWidth;
				return current === next ? current : next;
			} );
		};

		const resizeObserver = new ResizeObserver( measure );
		resizeObserver.observe( row );
		measure();

		return () => resizeObserver.disconnect();
	}, [ hasSecondary, secondary, primary, actions.overflow ] );

	const overflowItems = getOverflowItems( actions, isCollapsed );

	if ( ! primary && ! hasSecondary && ! overflowItems.length ) {
		return null;
	}

	return (
		<Stack
			ref={ groupRef }
			direction="row"
			gap="xs"
			align="center"
			role="group"
			aria-label={ __( 'Actions' ) }
			className={ styles.actions }
		>
			{ hasSecondary && (
				<div
					ref={ probeRef }
					aria-hidden="true"
					className={ styles[ 'actions-probe' ] }
				>
					{ secondary.map( ( action, index ) => (
						<ActionButton
							key={ index }
							action={ action }
							role={ SECONDARY_ROLE }
						/>
					) ) }
					{ primary && (
						<ActionButton
							action={ primary }
							role={ PRIMARY_ROLE }
						/>
					) }
					{ !! actions.overflow?.length && (
						<IconButton
							icon={ moreVertical }
							label=""
							size="compact"
							tone="neutral"
							variant="minimal"
						/>
					) }
				</div>
			) }
			{ hasSecondary &&
				! isCollapsed &&
				secondary.map( ( action, index ) => (
					<ActionButton
						key={ index }
						action={ action }
						role={ SECONDARY_ROLE }
					/>
				) ) }
			{ primary && (
				<ActionButton action={ primary } role={ PRIMARY_ROLE } />
			) }
			<OverflowMenu items={ overflowItems } />
		</Stack>
	);
}
