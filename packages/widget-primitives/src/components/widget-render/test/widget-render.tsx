/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { Suspense } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WidgetRender } from '../widget-render';
import type { ResolveWidgetModule, WidgetType } from '../../../types';

const PARAGRAPH = '<!-- wp:paragraph --><p>hello</p><!-- /wp:paragraph -->';

function BuiltInDemo() {
	return <span>built-in output</span>;
}

describe( 'WidgetRender routing', () => {
	it( 'routes a server-defined widget to the admin block renderer and skips the module resolver', () => {
		const resolveWidgetModule = jest.fn();
		const widgetType = {
			name: 'plugin/code-def',
			renderModule: '',
			origin: 'code-registered',
			content: PARAGRAPH,
		} as WidgetType;

		const { container } = render(
			<WidgetRender
				widgetType={ widgetType }
				resolveWidgetModule={
					resolveWidgetModule as unknown as ResolveWidgetModule
				}
			/>
		);

		expect( container ).toHaveTextContent( 'hello' );
		expect( resolveWidgetModule ).not.toHaveBeenCalled();
	} );

	it( 'routes a built-in widget through the module resolver', async () => {
		const resolveWidgetModule = jest.fn( async () => ( {
			default: BuiltInDemo,
		} ) );
		const widgetType = {
			name: 'core/built-in',
			renderModule: 'core/built-in/render',
			origin: 'built-in',
		} as WidgetType;

		render(
			<Suspense fallback={ null }>
				<WidgetRender
					widgetType={ widgetType }
					resolveWidgetModule={
						resolveWidgetModule as unknown as ResolveWidgetModule
					}
				/>
			</Suspense>
		);

		await screen.findByText( 'built-in output' );
		expect( resolveWidgetModule ).toHaveBeenCalledWith(
			'core/built-in/render'
		);
	} );
} );
