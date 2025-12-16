/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import OverlayTemplatePartSelector from '../overlay-template-part-selector';
import useCreateOverlayTemplatePart from '../use-create-overlay';

// Mock useEntityRecords
jest.mock( '@wordpress/core-data', () => ( {
	useEntityRecords: jest.fn(),
	store: {},
} ) );

// Mock useCreateOverlayTemplatePart hook
jest.mock( '../use-create-overlay', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Mock useDispatch specifically to avoid needing to set up full data store
jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	createSelector: jest.fn( ( fn ) => fn ),
	createRegistrySelector: jest.fn( ( fn ) => fn ),
	createReduxStore: jest.fn( () => ( {} ) ),
	combineReducers: jest.fn( ( reducers ) => ( state = {}, action ) => {
		const newState = {};
		Object.keys( reducers ).forEach( ( key ) => {
			newState[ key ] = reducers[ key ]( state[ key ], action );
		} );
		return newState;
	} ),
	register: jest.fn(),
} ) );

const mockSetAttributes = jest.fn();
const mockOnNavigateToEntityRecord = jest.fn();

const defaultProps = {
	overlay: undefined,
	setAttributes: mockSetAttributes,
	onNavigateToEntityRecord: mockOnNavigateToEntityRecord,
};

const templatePart1 = {
	id: 1,
	theme: 'twentytwentyfive',
	slug: 'my-overlay',
	title: {
		rendered: 'My Overlay',
	},
	area: 'overlay',
};

const templatePart2 = {
	id: 2,
	theme: 'twentytwentyfive',
	slug: 'another-overlay',
	title: {
		rendered: 'Another Overlay',
	},
	area: 'overlay',
};

const templatePartOtherArea = {
	id: 3,
	theme: 'twentytwentyfive',
	slug: 'header-part',
	title: {
		rendered: 'Header Part',
	},
	area: 'header',
};

const allTemplateParts = [
	templatePart1,
	templatePart2,
	templatePartOtherArea,
];

describe( 'OverlayTemplatePartSelector', () => {
	const mockCreateOverlayTemplatePart = jest.fn();
	const mockCreateErrorNotice = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		useEntityRecords.mockReturnValue( {
			records: [],
			isResolving: false,
			hasResolved: false,
		} );
		useCreateOverlayTemplatePart.mockReturnValue(
			mockCreateOverlayTemplatePart
		);
		// Mock useDispatch to return createErrorNotice for noticesStore
		useDispatch.mockReturnValue( {
			createErrorNotice: mockCreateErrorNotice,
		} );
	} );

	describe( 'Loading state', () => {
		it( 'should disable select control when template parts are resolving', () => {
			useEntityRecords.mockReturnValue( {
				records: null,
				isResolving: true,
				hasResolved: false,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );
			expect( select ).toBeDisabled();
		} );
	} );

	describe( 'Overlay selection', () => {
		it( 'should show selector with "None (default)" option when no overlays are available', () => {
			useEntityRecords.mockReturnValue( {
				records: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );
			expect( select ).toBeInTheDocument();
			expect( select ).toHaveValue( '' );

			// Check for "None (default)" option
			expect(
				screen.getByRole( 'option', { name: 'None (default)' } )
			).toBeInTheDocument();
		} );

		it( 'should only show overlay (template parts) in the selector', () => {
			useEntityRecords.mockReturnValue( {
				records: allTemplateParts,
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );

			// Should have None + 2 overlays (not the header one)
			const options = screen.getAllByRole( 'option' );
			expect( options ).toHaveLength( 3 ); // None + 2 overlay parts

			expect(
				screen.getByRole( 'option', { name: 'My Overlay' } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'option', { name: 'Another Overlay' } )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'option', { name: 'Header Part' } )
			).not.toBeInTheDocument();
		} );

		it( 'should display overlay slug when title is missing', () => {
			const templatePartNoTitle = {
				...templatePart1,
				title: null,
			};

			useEntityRecords.mockReturnValue( {
				records: [ templatePartNoTitle ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			expect(
				screen.getByRole( 'option', { name: 'my-overlay' } )
			).toBeInTheDocument();
		} );

		it( 'should call set the overlay attribute when an overlay is selected', async () => {
			const user = userEvent.setup();

			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );

			await user.selectOptions( select, 'twentytwentyfive//my-overlay' );

			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				overlay: 'twentytwentyfive//my-overlay',
			} );
		} );

		it( 'unsets custom overlay when "None (default)" is selected', async () => {
			const user = userEvent.setup();

			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="twentytwentyfive//my-overlay"
				/>
			);

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );

			await user.selectOptions( select, '' );

			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				overlay: undefined,
			} );
		} );

		it( 'should display selected overlay', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="twentytwentyfive//my-overlay"
				/>
			);

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );

			expect( select ).toHaveValue( 'twentytwentyfive//my-overlay' );
		} );
	} );

	describe( 'Edit button', () => {
		it( 'should not render when no overlay is selected', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const editButton = screen.queryByRole( 'button', {
				name: 'Edit overlay',
			} );

			expect( editButton ).not.toBeInTheDocument();
		} );

		it( 'should disable button when overlays are initially loading', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: true,
				hasResolved: false,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="twentytwentyfive//my-overlay"
				/>
			);

			// Component shows disabled select and disabled button when loading
			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );
			expect( select ).toBeDisabled();

			const editButton = screen.getByRole( 'button', {
				name: /Edit overlay/,
			} );
			expect( editButton ).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should be enabled when a valid overlay is selected', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="twentytwentyfive//my-overlay"
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: ( accessibleName ) =>
					accessibleName.startsWith( 'Edit overlay' ),
			} );

			expect( editButton ).toBeEnabled();
			expect( editButton ).toHaveAccessibleName();
		} );

		it( 'should be disabled when navigation to focused overlay editor is not available', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="twentytwentyfive//my-overlay"
					onNavigateToEntityRecord={ undefined }
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: ( accessibleName ) =>
					accessibleName.startsWith( 'Edit overlay' ),
			} );

			// Button uses accessibleWhenDisabled, so it has aria-disabled instead of disabled
			expect( editButton ).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should navigate to focused overlay editor when edit button is clicked', async () => {
			const user = userEvent.setup();

			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="twentytwentyfive//my-overlay"
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: ( accessibleName ) =>
					accessibleName.startsWith( 'Edit overlay' ),
			} );

			await user.click( editButton );

			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
				postId: 'twentytwentyfive//my-overlay',
				postType: 'wp_template_part',
			} );
		} );

		it( 'should not navigate to focused overlay editor when button is disabled', async () => {
			const user = userEvent.setup();

			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="twentytwentyfive//my-overlay"
					onNavigateToEntityRecord={ undefined }
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: ( accessibleName ) =>
					accessibleName.startsWith( 'Edit overlay' ),
			} );

			// Button uses accessibleWhenDisabled, so it has aria-disabled instead of disabled
			expect( editButton ).toHaveAttribute( 'aria-disabled', 'true' );

			// Even if clicked, the handler checks for onNavigateToEntityRecord and won't call it
			await user.click( editButton );

			expect( mockOnNavigateToEntityRecord ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Help text', () => {
		it( 'should show help text when no overlays are available', () => {
			useEntityRecords.mockReturnValue( {
				records: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			expect(
				screen.getByText( 'No overlays found.' )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', {
					name: 'Create new overlay template',
				} )
			).toBeInTheDocument();
		} );

		it( 'should show default help text when overlays are available', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			expect(
				screen.getByText(
					'Select an overlay to use for the navigation.'
				)
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', {
					name: 'Create new overlay template',
				} )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Create overlay', () => {
		it( 'should call createOverlayTemplatePart when create button is clicked', async () => {
			const user = userEvent.setup();
			const newOverlay = {
				id: 'twentytwentyfive//overlay',
				theme: 'twentytwentyfive',
				slug: 'overlay',
				title: {
					rendered: 'Overlay',
				},
				area: 'overlay',
			};

			mockCreateOverlayTemplatePart.mockResolvedValue( newOverlay );

			useEntityRecords.mockReturnValue( {
				records: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const createButton = screen.getByRole( 'button', {
				name: 'Create new overlay template',
			} );

			await user.click( createButton );

			expect( mockCreateOverlayTemplatePart ).toHaveBeenCalled();
			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				overlay: 'twentytwentyfive//overlay',
			} );
			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
				postId: 'twentytwentyfive//overlay',
				postType: 'wp_template_part',
			} );
		} );

		it( 'should show error notice when creation fails', async () => {
			const user = userEvent.setup();

			const error = new Error( 'Failed to create overlay' );
			error.code = 'create_error';

			mockCreateOverlayTemplatePart.mockRejectedValue( error );

			useEntityRecords.mockReturnValue( {
				records: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const createButton = screen.getByRole( 'button', {
				name: 'Create new overlay template',
			} );

			await user.click( createButton );

			// Wait for async operations
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'Failed to create overlay',
				{ type: 'snackbar' }
			);
			expect( mockSetAttributes ).not.toHaveBeenCalled();
			expect( mockOnNavigateToEntityRecord ).not.toHaveBeenCalled();
		} );

		it( 'should disable create button when overlays are resolving', () => {
			useEntityRecords.mockReturnValue( {
				records: [],
				isResolving: true,
				hasResolved: false,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const createButton = screen.getByRole( 'button', {
				name: 'Create new overlay template',
			} );

			expect( createButton ).toHaveAttribute( 'aria-disabled', 'true' );
		} );
	} );
} );
