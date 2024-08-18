/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PublishButtonLabel from '../label';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

describe( 'PublishButtonLabel', () => {
	it( 'should show publishing if publishing in progress', () => {
		useSelect.mockImplementation( () => ( {
			hasPublishAction: true,
			isPublishing: true,
		} ) );
		const label = PublishButtonLabel();
		expect( label ).toBe( 'Publishing…' );
	} );

	it( 'should show saving if published and saving in progress', () => {
		useSelect.mockImplementation( () => ( {
			hasPublishAction: true,
			isPublished: true,
			isSaving: true,
		} ) );
		const label = PublishButtonLabel();
		expect( label ).toBe( 'Saving…' );
	} );

	it( 'should show saving if scheduled and saving in progress', () => {
		useSelect.mockImplementation( () => ( {
			hasPublishAction: true,
			isBeingScheduled: true,
			isSaving: true,
		} ) );
		const label = PublishButtonLabel();
		expect( label ).toBe( 'Saving…' );
	} );

	it( 'should show publish if not published and saving in progress', () => {
		useSelect.mockImplementation( () => ( {
			hasPublishAction: true,
			isPublished: false,
			isSaving: true,
		} ) );
		const label = PublishButtonLabel();
		expect( label ).toBe( 'Publish' );
	} );

	it( 'should show submit for review for contributor', () => {
		useSelect.mockImplementation( () => ( {
			hasPublishAction: false,
		} ) );
		const label = PublishButtonLabel();
		expect( label ).toBe( 'Submit for Review' );
	} );

	it( 'should show save for already published', () => {
		useSelect.mockImplementation( () => ( {
			hasPublishAction: true,
			isPublished: true,
		} ) );
		const label = PublishButtonLabel();
		expect( label ).toBe( 'Save' );
	} );

	it( 'should show schedule for scheduled', () => {
		useSelect.mockImplementation( () => ( {
			hasPublishAction: true,
			isBeingScheduled: true,
		} ) );
		const label = PublishButtonLabel();
		expect( label ).toBe( 'Schedule' );
	} );

	it( 'should show publish otherwise', () => {
		useSelect.mockImplementation( () => ( {
			hasPublishAction: true,
		} ) );
		const label = PublishButtonLabel();
		expect( label ).toBe( 'Publish' );
	} );
} );
