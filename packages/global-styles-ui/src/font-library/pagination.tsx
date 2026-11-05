import { createInterpolateElement } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { Select, Stack } from '@wordpress/ui';
import { sprintf, __, _x, isRTL } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';

const MIN_WINDOW_HEIGHT = 500;

export function getFontsPerPage() {
	// NOTE: The height of the font library modal unavailable to use for rendering font family items is roughly 417px
	// The height of each font family item is 61px.
	const windowHeight = Math.max( window.innerHeight, MIN_WINDOW_HEIGHT );
	return Math.floor( ( windowHeight - 417 ) / 61 );
}

function Pagination( {
	page,
	totalPages,
	onChange,
}: {
	page: number;
	totalPages: number;
	onChange: ( page: number ) => void;
} ) {
	return (
		<Stack direction="row" align="center" justify="end" gap="xl">
			<Stack
				direction="row"
				align="center"
				gap="xs"
				className="font-library__page-selection"
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
						CurrentPage: (
							<Select.Root
								value={ page.toString() }
								onValueChange={ ( newPage ) => {
									if ( newPage !== null ) {
										onChange( parseInt( newPage ) );
									}
								} }
							>
								<Select.Trigger
									className="font-library__page-selection-trigger"
									size="small"
									variant="minimal"
									aria-label={ __( 'Current page' ) }
								/>
								<Select.Popup width="content">
									{ [ ...Array( totalPages ) ].map(
										( e, i ) => {
											const value = ( i + 1 ).toString();
											return (
												<Select.Item
													key={ value }
													value={ value }
													size="small"
												>
													<Select.ItemLabel>
														{ value }
													</Select.ItemLabel>
												</Select.Item>
											);
										}
									) }
								</Select.Popup>
							</Select.Root>
						),
					}
				) }
			</Stack>
			<Stack direction="row" align="center" gap="xs">
				<Button
					onClick={ () => onChange( page - 1 ) }
					disabled={ page === 1 }
					accessibleWhenDisabled
					label={ __( 'Previous page' ) }
					icon={ isRTL() ? next : previous }
					showTooltip
					size="compact"
					tooltipPosition="top"
				/>
				<Button
					onClick={ () => onChange( page + 1 ) }
					disabled={ page === totalPages }
					accessibleWhenDisabled
					label={ __( 'Next page' ) }
					icon={ isRTL() ? previous : next }
					showTooltip
					size="compact"
					tooltipPosition="top"
				/>
			</Stack>
		</Stack>
	);
}

export default Pagination;
