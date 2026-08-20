import { shouldShowTemplateOption } from '../utils';

describe( 'shouldShowTemplateOption', () => {
	it( 'shows the template option when editing content with a template', () => {
		expect(
			shouldShowTemplateOption( {
				postType: 'post',
				templateId: 'theme//single',
			} )
		).toBe( true );
	} );

	it( 'hides the template option when there is no template', () => {
		expect(
			shouldShowTemplateOption( {
				postType: 'post',
				templateId: undefined,
			} )
		).toBe( false );
	} );

	it.each( [
		'wp_template',
		'wp_template_part',
		'wp_block',
		'wp_navigation',
	] )( 'hides the template option when editing a %s', ( postType ) => {
		expect(
			shouldShowTemplateOption( {
				postType,
				templateId: 'theme//single',
			} )
		).toBe( false );
	} );
} );
