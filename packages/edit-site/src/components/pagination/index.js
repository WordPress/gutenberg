/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalText as WCText,
	Button,
} from '@wordpress/components';
import { __, _x, _n, sprintf, isRTL } from '@wordpress/i18n';
import { previous, chevronLeft, chevronRight, next } from '@wordpress/icons';

export default function Pagination( {
	currentPage,
	numPages,
	changePage,
	totalItems,
	className,
	disabled = false,
	buttonVariant = 'tertiary',
	label = __( 'Pagination' ),
} ) {
	return (
		<HStack
			expanded={ false }
			as="nav"
			aria-label={ label }
			spacing={ 3 }
			justify="flex-start"
			className={ clsx( 'edit-site-pagination', className ) }
		>
			<WCText variant="muted" className="edit-site-pagination__total">
				{
					// translators: %s: Total number of patterns.
					sprintf(
						// translators: %s: Total number of patterns.
						_n( '%s item', '%s items', totalItems ),
						totalItems
					)
				}
			</WCText>
			<HStack expanded={ false } spacing={ 1 }>
				<Button
					variant={ buttonVariant }
					onClick={ () => changePage( 1 ) }
					accessibleWhenDisabled
					disabled={ disabled || currentPage === 1 }
					label={ __( 'First page' ) }
					icon={ isRTL() ? next : previous }
					size="compact"
				/>
				<Button
					variant={ buttonVariant }
					onClick={ () => changePage( currentPage - 1 ) }
					accessibleWhenDisabled
					disabled={ disabled || currentPage === 1 }
					label={ __( 'Previous page' ) }
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="compact"
				/>
			</HStack>
			<WCText variant="muted">
				{ sprintf(
					// translators: 1: Current page number. 2: Total number of pages.
					_x( '%1$s of %2$s', 'paging' ),
					currentPage,
					numPages
				) }
			</WCText>
			<HStack expanded={ false } spacing={ 1 }>
				<Button
					variant={ buttonVariant }
					onClick={ () => changePage( currentPage + 1 ) }
					accessibleWhenDisabled
					disabled={ disabled || currentPage === numPages }
					label={ __( 'Next page' ) }
					icon={ isRTL() ? chevronLeft : chevronRight }
					size="compact"
				/>
				<Button
					variant={ buttonVariant }
					onClick={ () => changePage( numPages ) }
					accessibleWhenDisabled
					disabled={ disabled || currentPage === numPages }
					label={ __( 'Last page' ) }
					icon={ isRTL() ? previous : next }
					size="compact"
				/>
			</HStack>
		</HStack>
	);
}
