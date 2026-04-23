/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalText as Text,
	Button,
} from '@wordpress/components';
import { __, _x, sprintf, isRTL } from '@wordpress/i18n';
import { previous, chevronLeft, chevronRight, next } from '@wordpress/icons';

/**
 * Pagination component for navigating through pages of items.
 *
 * Supports two modes:
 * - **Full mode**: When `numPages` is provided, renders first/prev/next/last
 *   buttons with a "X of Y" page indicator.
 * - **Simplified mode**: When only `hasMore` is provided (no totals), renders
 *   prev/next buttons with a "Page X" indicator. The "next" button is disabled
 *   when `hasMore` is `false`.
 *
 * @param {Object}   props
 * @param {number}   props.currentPage The current page number (1-based).
 * @param {number}   [props.numPages]  Total number of pages. Enables full mode with first/last buttons and "X of Y" indicator.
 * @param {Function} props.changePage  Callback invoked with the new page number.
 * @param {boolean}  [props.hasMore]   Whether more pages exist beyond the current page. Used in simplified mode when totals are unknown.
 * @param {string}   [props.className] Additional class name.
 * @param {boolean}  [props.disabled]  Whether all pagination controls are disabled.
 * @param {string}   [props.label]     Accessible label for the nav element.
 */
export default function Pagination( {
	currentPage,
	numPages,
	changePage,
	hasMore,
	className,
	disabled = false,
	label = __( 'Pagination' ),
} ) {
	const hasTotals = typeof numPages === 'number';
	const isFirstPage = currentPage === 1;
	const isLastPage = hasTotals ? currentPage === numPages : hasMore === false;

	return (
		<HStack
			expanded={ false }
			as="nav"
			aria-label={ label }
			spacing={ 3 }
			justify="center"
			className={ clsx( 'block-editor-pagination', className ) }
		>
			<HStack expanded={ false } spacing={ 1 }>
				{ hasTotals && (
					<Button
						onClick={ () => changePage( 1 ) }
						accessibleWhenDisabled
						disabled={ disabled || isFirstPage }
						label={ __( 'First page' ) }
						icon={ isRTL() ? next : previous }
						size="compact"
					/>
				) }
				<Button
					onClick={ () => changePage( currentPage - 1 ) }
					accessibleWhenDisabled
					disabled={ disabled || isFirstPage }
					label={ __( 'Previous page' ) }
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="compact"
				/>
			</HStack>
			<Text variant="muted">
				{ hasTotals
					? sprintf(
							// translators: 1: Current page number. 2: Total number of pages.
							_x( '%1$d of %2$d', 'paging' ),
							currentPage,
							numPages
					  )
					: sprintf(
							// translators: %d: Current page number.
							__( 'Page %d' ),
							currentPage
					  ) }
			</Text>
			<HStack expanded={ false } spacing={ 1 }>
				<Button
					onClick={ () => changePage( currentPage + 1 ) }
					accessibleWhenDisabled
					disabled={ disabled || isLastPage }
					label={ __( 'Next page' ) }
					icon={ isRTL() ? chevronLeft : chevronRight }
					size="compact"
				/>
				{ hasTotals && (
					<Button
						onClick={ () => changePage( numPages ) }
						accessibleWhenDisabled
						disabled={ disabled || isLastPage }
						label={ __( 'Last page' ) }
						icon={ isRTL() ? previous : next }
						size="compact"
					/>
				) }
			</HStack>
		</HStack>
	);
}
