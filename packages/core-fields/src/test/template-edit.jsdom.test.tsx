import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { unlock } from '../lock-unlock';
import TemplateEdit from '../post_type_supports/template/edit';

const field = {
	id: 'template',
	getValue: ( { item }: { item: { template?: string } } ) => item.template,
} as any;

const CUSTOM_TEMPLATES = [ { slug: 'custom', title: { rendered: 'Custom' } } ];
const DEFAULT_TEMPLATE = {
	slug: 'single',
	title: { rendered: 'Single Posts' },
};

// The field reads the post type, the theme, and the templates from the
// `core` store; a stand-in avoids the resolvers' requests.
function createTestRegistry( { isBlockTheme }: { isBlockTheme: boolean } ) {
	const store = createReduxStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
			getPostType: () => ( { viewable: true } ),
			getCurrentTheme: () => ( { is_block_theme: isBlockTheme } ),
			getEntityRecords: () => CUSTOM_TEMPLATES,
			getDefaultTemplateId: () => 'theme//single',
			getEntityRecord: () => DEFAULT_TEMPLATE,
		},
	} );
	unlock( store ).registerPrivateSelectors( {
		getTemplateId: () => 'theme//single',
		getHomePage: () => null,
		getPostsPageId: () => null,
	} );
	const registry = createRegistry();
	registry.register( store );
	return registry;
}

describe( 'TemplateEdit', () => {
	it( 'shows the default template of a block theme as the selected one', () => {
		render(
			<RegistryProvider
				value={ createTestRegistry( { isBlockTheme: true } ) }
			>
				<TemplateEdit
					data={ {
						id: 1,
						type: 'post',
						slug: 'hello',
						template: '',
					} }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);

		const select = screen.getByRole( 'combobox', { name: 'Template' } );
		expect( select ).toHaveTextContent( 'Single Posts' );
		expect( select ).not.toHaveAttribute( 'data-placeholder' );
	} );

	it( 'shows the default template of a classic theme as the selected one', () => {
		render(
			<RegistryProvider
				value={ createTestRegistry( { isBlockTheme: false } ) }
			>
				<TemplateEdit
					data={ {
						id: 1,
						type: 'post',
						template: '',
						available_templates: {
							'': 'Default template',
							'full-width.php': 'Full Width',
						},
					} }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);

		const select = screen.getByRole( 'combobox', { name: 'Template' } );
		expect( select ).toHaveTextContent( 'Default template' );
		expect( select ).not.toHaveAttribute( 'data-placeholder' );
	} );
} );
