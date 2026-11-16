import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { setup, speak } from '@wordpress/a11y';
import { Button } from '@wordpress/components';
import '../../../../../components/src/button/style.scss';
import '../../../../../components/src/toolbar/toolbar/style.scss';
import '../../../../../components/src/toolbar/toolbar-button/style.scss';
import '../../../../../components/src/toolbar/toolbar-group/style.scss';
import '../style.scss';
import '../../../../../block-editor/src/components/block-toolbar/style.scss';
import '../../../../../block-editor/src/components/block-tools/style.scss';
import '../../../../../block-editor/src/components/link-control/style.scss';
import '../../../../../block-editor/src/components/rich-text/style.scss';
import '../../../../../edit-site/src/components/page-patterns/style.scss';
import '../../../../../edit-site/src/components/sidebar-global-styles/style.scss';
import '../../global-styles-sidebar/style.scss';

type FixtureProps = {
	outerClassName?: string;
	containerClassName?: string;
	innerClassName?: string;
	buttonClassName?: string;
	subscript?: string;
	showLabels?: boolean;
	isBusy?: boolean;
};

const contexts: ( FixtureProps & { name: string; pseudoElement?: string } )[] =
	[
		{ name: 'editor header', innerClassName: 'editor-header' },
		{ name: 'pinned items', outerClassName: 'interface-pinned-items' },
		{
			name: 'block toolbar',
			outerClassName: 'components-accessible-toolbar',
			containerClassName: 'block-editor-block-toolbar',
			innerClassName: 'components-toolbar-group',
			buttonClassName: 'components-toolbar__control',
			subscript: '2',
		},
		{
			name: 'parent inserter',
			containerClassName:
				'components-popover block-editor-block-list__block-popover',
			innerClassName: 'block-editor-block-parent-selector',
			buttonClassName: 'block-editor-block-parent-selector__inserter',
		},
		{
			name: 'link control',
			innerClassName: 'block-editor-link-control',
			pseudoElement: '::before',
		},
		{
			name: 'Rich Text toolbar',
			innerClassName:
				'block-editor-rich-text__inline-format-toolbar-group',
		},
		{ name: 'Patterns', buttonClassName: 'edit-site-patterns__button' },
		{
			name: 'Site Styles',
			innerClassName: 'edit-site-styles__header-actions',
		},
		{
			name: 'Global Styles',
			innerClassName: 'editor-global-styles-sidebar__header',
		},
	];

function PluginIcon() {
	return (
		<svg
			role="img"
			aria-hidden={ false }
			aria-label="Plugin icon"
			viewBox="0 0 24 24"
			width="24"
			height="24"
		>
			<path d="M4 4h16v16H4z" />
		</svg>
	);
}

function Fixture( {
	outerClassName = '',
	containerClassName,
	innerClassName,
	buttonClassName,
	subscript,
	showLabels = true,
	isBusy,
}: FixtureProps ) {
	const button = (
		<Button
			__next40pxDefaultSize
			className={ buttonClassName }
			data-subscript={ subscript }
			icon={ <PluginIcon /> }
			label="Plugin action"
			isBusy={ isBusy }
		/>
	);

	const content = innerClassName ? (
		<div className={ innerClassName }>{ button }</div>
	) : (
		button
	);
	return (
		<div
			className={ `${ showLabels ? 'show-icon-labels' : '' } ${ outerClassName }` }
		>
			{ containerClassName ? (
				<div className={ containerClassName }>{ content }</div>
			) : (
				content
			) }
		</div>
	);
}

describe.each( contexts )( 'Button text labels in $name', ( context ) => {
	beforeEach( () => {
		setup();
		speak( '' );
	} );

	it( 'hides unannotated plugin icons when button text labels are enabled', async () => {
		const { rerender } = await render(
			<Fixture { ...context } showLabels={ false } />
		);
		const icon = screen.getByRole( 'img', { name: 'Plugin icon' } );
		expect( icon ).toBeVisible();

		await rerender( <Fixture { ...context } /> );

		expect( icon ).not.toBeVisible();
		const button = screen.getByRole( 'button', { name: 'Plugin action' } );
		expect(
			getComputedStyle( button, context.pseudoElement ?? '::after' )
				.content
		).toBe( '"Plugin action"' );
	} );

	it( "keeps busy feedback visible without changing the button's accessible name", async () => {
		const { rerender } = await render( <Fixture { ...context } /> );
		const button = screen.getByRole( 'button', { name: 'Plugin action' } );
		const { width, height } = button.getBoundingClientRect();

		await rerender( <Fixture { ...context } isBusy /> );

		const spinner = screen.getByRole( 'presentation', { hidden: true } );
		expect( spinner ).toBeVisible();
		const buttonBounds = button.getBoundingClientRect();
		const spinnerBounds = spinner.getBoundingClientRect();
		expect( spinnerBounds.x + spinnerBounds.width / 2 ).toBeCloseTo(
			buttonBounds.x + buttonBounds.width / 2,
			0
		);
		expect( spinnerBounds.y + spinnerBounds.height / 2 ).toBeCloseTo(
			buttonBounds.y + buttonBounds.height / 2,
			0
		);
		expect( spinnerBounds.width ).toBeCloseTo(
			parseFloat( getComputedStyle( button ).fontSize ),
			0
		);
		expect( spinnerBounds.height ).toBe( spinnerBounds.width );
		expect( button ).toHaveAccessibleName( 'Plugin action' );
		expect( screen.getByText( 'Loading' ) ).toHaveAttribute(
			'aria-live',
			'polite'
		);
		expect( button.getBoundingClientRect().width ).toBe( width );
		expect( button.getBoundingClientRect().height ).toBe( height );
	} );
} );
