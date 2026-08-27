import { render, screen } from '@testing-library/react';
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import ExitTemplatePartPanel from '../';

describe( 'ExitTemplatePartPanel', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should render nothing when not editing a template part', () => {
		jest.spyOn(
			select( editorStore ),
			'getCurrentPostType'
		).mockReturnValue( 'wp_template' );
		jest.spyOn(
			select( editorStore ),
			'getEditorSettings'
		).mockReturnValue( {
			onNavigateToPreviousEntityRecord: () => {},
		} );

		const { container } = render( <ExitTemplatePartPanel /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when there is no previous entity to navigate back to', () => {
		jest.spyOn(
			select( editorStore ),
			'getCurrentPostType'
		).mockReturnValue( 'wp_template_part' );
		jest.spyOn(
			select( editorStore ),
			'getEditorSettings'
		).mockReturnValue( {} );

		const { container } = render( <ExitTemplatePartPanel /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render an exit button and navigate back to the previous entity when clicked', () => {
		const onNavigateToPreviousEntityRecord = jest.fn();
		jest.spyOn(
			select( editorStore ),
			'getCurrentPostType'
		).mockReturnValue( 'wp_template_part' );
		jest.spyOn(
			select( editorStore ),
			'getEditorSettings'
		).mockReturnValue( { onNavigateToPreviousEntityRecord } );

		render( <ExitTemplatePartPanel /> );

		const button = screen.getByRole( 'button', { name: 'Exit original' } );
		expect( button ).toBeVisible();

		button.click();

		expect( onNavigateToPreviousEntityRecord ).toHaveBeenCalledTimes( 1 );
	} );
} );
