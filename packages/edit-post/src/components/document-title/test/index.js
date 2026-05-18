/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DocumentTitle from '../index';

// Mock the stores
const mockCoreStore = createReduxStore( 'core', {
	reducer: () => ( {} ),
	selectors: {
		getEntityRecord: () => ( { title: 'Test Site' } ),
	},
} );

const mockEditorStore = createReduxStore( 'core/editor', {
	reducer: () => ( {} ),
	selectors: {
		getEditedPostAttribute: ( state, attribute ) => {
			const mockData = {
				title: 'Test Post',
				type: 'post',
				status: 'publish',
			};
			return mockData[ attribute ];
		},
		isCleanNewPost: () => false,
	},
} );

register( mockCoreStore );
register( mockEditorStore );

describe( 'DocumentTitle', () => {
	const originalDocumentTitle = document.title;

	beforeEach( () => {
		document.title = 'Original Title';
	} );

	afterEach( () => {
		document.title = originalDocumentTitle;
	} );

	it( 'should render without crashing', () => {
		const { container } = render( <DocumentTitle /> );
		expect( container ).toBeEmptyDOMElement(); // Component renders null
	} );
} );
