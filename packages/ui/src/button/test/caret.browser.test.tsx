import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import { Button } from '..';
import * as Select from '../../form/primitives/select';
import { ThemeProvider } from '../../utils/theme-provider';

type Size = 'default' | 'compact' | 'small';

function measureCaret(
	trigger: HTMLElement,
	label: HTMLElement,
	caret: Element,
	padding: number
) {
	const labelRect = getTextRect( label );
	const caretRect = caret.getBoundingClientRect();
	const triggerRect = trigger.getBoundingClientRect();
	const style = getComputedStyle( trigger );
	const isRTL = style.direction === 'rtl';

	const gap = isRTL
		? labelRect.left - caretRect.right
		: caretRect.left - labelRect.right;
	const distanceToEdge = isRTL
		? caretRect.left -
			( triggerRect.left + parseFloat( style.borderLeftWidth ) )
		: triggerRect.right -
			parseFloat( style.borderRightWidth ) -
			caretRect.right;

	return {
		width: caretRect.width,
		gap,
		pullIn: padding - distanceToEdge,
	};
}

function getTextRect( element: Element ) {
	const range = document.createRange();
	range.selectNodeContents( element );
	return range.getBoundingClientRect();
}

describe.each( [ 'ltr', 'rtl' ] as const )( 'Button.Caret (%s)', ( dir ) => {
	it.each( [ 'default', 'compact', 'small' ] satisfies Size[] )(
		'matches the Select caret geometry at the %s size',
		async ( size ) => {
			await render(
				<ThemeProvider isRoot>
					<div
						dir={ dir }
						style={ {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'start',
						} }
					>
						<Select.Root
							items={ [ { value: 'actions', label: 'Actions' } ] }
							defaultValue="actions"
						>
							<Select.Trigger size={ size } aria-label="Select" />
						</Select.Root>
						<Button tone="neutral" variant="outline" size={ size }>
							<span>Actions</span>
							<Button.Caret data-testid="caret" />
						</Button>
					</div>
				</ThemeProvider>
			);

			const selectTrigger = screen.getByRole( 'combobox', {
				name: 'Select',
			} );
			const button = screen.getByRole( 'button', { name: 'Actions' } );

			const select = measureCaret(
				selectTrigger,
				within( selectTrigger ).getByText( 'Actions' ),
				// eslint-disable-next-line testing-library/no-node-access -- The Select caret is internal and has no accessible role.
				selectTrigger.querySelector( 'svg' )!,
				parseFloat(
					getComputedStyle( selectTrigger ).getPropertyValue(
						'--wp-ui-input-layout-padding-inline'
					)
				)
			);
			const buttonCaret = measureCaret(
				button,
				within( button ).getByText( 'Actions' ),
				screen.getByTestId( 'caret' ),
				parseFloat( getComputedStyle( button ).paddingInlineEnd )
			);

			expect( select ).toEqual( { width: 18, gap: 4, pullIn: 4 } );
			expect( buttonCaret ).toEqual( select );
		}
	);
} );
