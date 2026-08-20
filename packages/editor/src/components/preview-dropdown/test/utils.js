import { shouldShowTemplateOption } from '../utils';

describe( 'shouldShowTemplateOption', () => {
	it( 'shows the template option when editing content with a template', () => {
		expect(
			shouldShowTemplateOption( {
				isTemplate: false,
				templateId: 'theme//single',
				isFocusedTemplatePart: false,
			} )
		).toBe( true );
	} );

	it( 'hides the template option when editing a focused template part', () => {
		expect(
			shouldShowTemplateOption( {
				isTemplate: false,
				templateId: 'theme//single',
				isFocusedTemplatePart: true,
			} )
		).toBe( false );
	} );

	it( 'hides the template option when editing a template', () => {
		expect(
			shouldShowTemplateOption( {
				isTemplate: true,
				templateId: 'theme//single',
				isFocusedTemplatePart: false,
			} )
		).toBe( false );
	} );

	it( 'hides the template option when there is no template', () => {
		expect(
			shouldShowTemplateOption( {
				isTemplate: false,
				templateId: undefined,
				isFocusedTemplatePart: false,
			} )
		).toBe( false );
	} );
} );
