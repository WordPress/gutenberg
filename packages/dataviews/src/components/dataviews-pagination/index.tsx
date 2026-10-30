import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Button } from '@wordpress/components';
import {
	createInterpolateElement,
	memo,
	useContext,
	useState,
} from '@wordpress/element';
import { sprintf, __, _x, isRTL } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import { Input, Select, Stack } from '@wordpress/ui';
import DataViewsContext from '../dataviews-context';
import type { View } from '../../types';

/**
 * Above this many pages the page select gives way to a number input. A list
 * of hundreds of pages is slower to scan than typing the page number, and
 * rendering one option per page freezes the browser once a dataset runs to
 * tens of thousands of pages.
 */
const MAX_PAGE_SELECT_PAGES = 100;

export function hasPaginationControls(
	view: View,
	paginationInfo: { totalItems: number; totalPages: number }
): boolean {
	return (
		! view.infiniteScrollEnabled &&
		paginationInfo.totalItems > 0 &&
		paginationInfo.totalPages > 1
	);
}

function PageNumberInput( {
	currentPage,
	totalPages,
	onChangePage,
}: {
	currentPage: number;
	totalPages: number;
	onChangePage: ( page: number ) => void;
} ) {
	// What the user has typed but not committed; `null` shows the page.
	const [ draft, setDraft ] = useState< string | null >( null );

	const commit = () => {
		setDraft( null );
		const page = Number.parseInt( draft ?? '', 10 );
		if ( Number.isNaN( page ) ) {
			return;
		}
		const nextPage = Math.min( Math.max( page, 1 ), totalPages );
		if ( nextPage !== currentPage ) {
			onChangePage( nextPage );
		}
	};

	return (
		<Input
			className="dataviews-pagination__page-input"
			type="number"
			size="compact"
			min={ 1 }
			max={ totalPages }
			value={ draft ?? currentPage.toString() }
			onValueChange={ setDraft }
			onBlur={ commit }
			onKeyDown={ ( event ) => {
				if ( event.key === 'Enter' ) {
					event.preventDefault();
					commit();
				}
			} }
			aria-label={ __( 'Current page' ) }
			style={ {
				'--dataviews-pagination-page-input-digits':
					totalPages.toString().length,
			} }
		/>
	);
}

export function DataViewsPageSelect( { className }: { className?: string } ) {
	const { view, onChangeView, paginationInfo } =
		useContext( DataViewsContext );

	if ( ! hasPaginationControls( view, paginationInfo ) ) {
		return null;
	}

	const { totalPages } = paginationInfo;
	const currentPage = view.page ?? 1;
	const hasPageInput = totalPages > MAX_PAGE_SELECT_PAGES;
	const pageSelectOptions = hasPageInput
		? []
		: Array.from( Array( totalPages ) ).map( ( _, i ) => {
				const page = i + 1;
				return {
					value: page.toString(),
					label: page.toString(),
					'aria-label':
						currentPage === page
							? sprintf(
									// translators: 1: current page number. 2: total number of pages.
									__( 'Page %1$d of %2$d' ),
									currentPage,
									totalPages
								)
							: page.toString(),
				};
			} );

	return (
		<Stack
			direction="row"
			justify="flex-start"
			align="center"
			gap="xs"
			className={ clsx( 'dataviews-pagination__page-select', className ) }
		>
			{ createInterpolateElement(
				sprintf(
					// translators: 1: Current page number, 2: Total number of pages.
					_x( '<div>Page</div>%1$s<div>of %2$d</div>', 'paging' ),
					'<CurrentPage />',
					totalPages
				),
				{
					div: <div aria-hidden />,
					// @ts-expect-error — Tag injected via sprintf argument, not visible in format string.
					CurrentPage: hasPageInput ? (
						<PageNumberInput
							currentPage={ currentPage }
							totalPages={ totalPages }
							onChangePage={ ( page ) =>
								onChangeView( { ...view, page } )
							}
						/>
					) : (
						<Select.Root
							value={ currentPage.toString() }
							onValueChange={ ( newValue ) => {
								if ( newValue === null ) {
									return;
								}
								onChangeView( {
									...view,
									page: +newValue,
								} );
							} }
						>
							<Select.Trigger
								className="dataviews-pagination__page-select-trigger"
								size="small"
								variant="minimal"
								aria-label={ __( 'Current page' ) }
							/>
							<Select.Popup width="content">
								{ pageSelectOptions.map( ( option ) => (
									<Select.Item
										key={ option.value }
										value={ option.value }
										size="small"
										aria-label={ option[ 'aria-label' ] }
									>
										<Select.ItemLabel>
											{ option.label }
										</Select.ItemLabel>
									</Select.Item>
								) ) }
							</Select.Popup>
						</Select.Root>
					),
				}
			) }
		</Stack>
	);
}

export function DataViewsPageNavigation( {
	className,
}: {
	className?: string;
} ) {
	const { view, onChangeView, paginationInfo } =
		useContext( DataViewsContext );

	if ( ! hasPaginationControls( view, paginationInfo ) ) {
		return null;
	}

	const { totalPages } = paginationInfo;
	const currentPage = view.page ?? 1;

	return (
		<Stack
			direction="row"
			gap="xs"
			align="center"
			className={ clsx(
				'dataviews-pagination__page-navigation',
				className
			) }
		>
			<Button
				onClick={ () =>
					onChangeView( {
						...view,
						page: currentPage - 1,
					} )
				}
				disabled={ currentPage === 1 }
				accessibleWhenDisabled
				label={ __( 'Previous page' ) }
				icon={ isRTL() ? next : previous }
				showTooltip
				size="compact"
				tooltipPosition="top"
			/>
			<Button
				onClick={ () =>
					onChangeView( { ...view, page: currentPage + 1 } )
				}
				disabled={ currentPage >= totalPages }
				accessibleWhenDisabled
				label={ __( 'Next page' ) }
				icon={ isRTL() ? previous : next }
				showTooltip
				size="compact"
				tooltipPosition="top"
			/>
		</Stack>
	);
}

// Given children, renders those in place of the page select and the
// previous/next buttons.
export function DataViewsPagination( {
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
} ) {
	const { view, paginationInfo } = useContext( DataViewsContext );

	if ( ! hasPaginationControls( view, paginationInfo ) ) {
		return null;
	}

	return (
		<Stack
			direction="row"
			className={ clsx( 'dataviews-pagination', className ) }
			justify="end"
			align="center"
			gap="xl"
		>
			{ children ?? (
				<>
					<DataViewsPageSelect />
					<DataViewsPageNavigation />
				</>
			) }
		</Stack>
	);
}

export default memo( DataViewsPagination );
