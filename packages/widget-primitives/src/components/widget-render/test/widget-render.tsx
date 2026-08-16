import { render, screen } from '@testing-library/react';
import { Suspense } from '@wordpress/element';
import { WidgetRender } from '../widget-render';
import { registerAdminBlock } from '../../admin-block-renderer/registry';
import type { ResolveWidgetModule, WidgetType } from '../../../types';

function Echo( { label }: { label?: string } ) {
	return <span>{ label }</span>;
}

function BuiltInDemo() {
	return <span>built-in output</span>;
}

describe( 'WidgetRender routing', () => {
	it( 'routes a server-defined widget to the admin block renderer and skips the module resolver', () => {
		registerAdminBlock( {
			name: 'test/echo',
			component: Echo,
			attributes: { label: {} },
		} );
		const resolveWidgetModule = jest.fn();
		const widgetType = {
			name: 'plugin/code-def',
			renderModule: '',
			origin: 'code-registered',
			content: '<!-- wp:test/echo {"label":"routed"} /-->',
		} as WidgetType;

		render(
			<WidgetRender
				widgetType={ widgetType }
				resolveWidgetModule={
					resolveWidgetModule as unknown as ResolveWidgetModule
				}
			/>
		);

		expect( screen.getByText( 'routed' ) ).toBeVisible();
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
