import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch } from '@wordpress/data';
import OverlayTemplatePartSelector from '../overlay-template-part-selector';
import useCreateOverlayTemplatePart from '../use-create-overlay';
import useOverlayPatterns from '../use-overlay-patterns';

// Mock core-data store
jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Mock patterns store
jest.mock( '@wordpress/patterns', () => ( {
	store: {},
} ) );

// Mock lock-unlock: editing a registered overlay creates its copy.
const mockCustomizePattern = jest.fn();
jest.mock( '../../../lock-unlock', () => ( {
	unlock: () => ( {
		customizePattern: mockCustomizePattern,
	} ),
} ) );

// Mock the overlays: the patterns of the overlay area.
jest.mock( '../use-overlay-patterns', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Mock useCreateOverlayTemplatePart hook
jest.mock( '../use-create-overlay', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Mock useDispatch and useSelect specifically to avoid needing to set up full data store
jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
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
	keyedReducer: jest.fn( () => ( reducer ) => reducer ),
} ) );

const mockSetAttributes = jest.fn();
const mockOnNavigateToEntityRecord = jest.fn();

const defaultProps = {
	overlay: undefined,
	setAttributes: mockSetAttributes,
	onNavigateToEntityRecord: mockOnNavigateToEntityRecord,
};

const templatePart1 = {
	pattern: {
		name: 'twentytwentyfive/part/my-overlay',
		title: 'My Overlay',
		area: 'navigation-overlay',
	},
	name: 'twentytwentyfive/part/my-overlay',
	slug: 'my-overlay',
	title: {
		rendered: 'My Overlay',
	},
};

const templatePart2 = {
	pattern: {
		name: 'twentytwentyfive/part/another-overlay',
		title: 'Another Overlay',
		area: 'navigation-overlay',
	},
	name: 'twentytwentyfive/part/another-overlay',
	slug: 'another-overlay',
	title: {
		rendered: 'Another Overlay',
	},
};

describe( 'OverlayTemplatePartSelector', () => {
	const mockCreateOverlayTemplatePart = jest.fn();
	const mockCreateErrorNotice = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		useOverlayPatterns.mockReturnValue( {
			overlays: [],
			isResolving: false,
			hasResolved: false,
		} );
		mockCustomizePattern.mockResolvedValue( { id: 123 } );
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
			useOverlayPatterns.mockReturnValue( {
				overlays: [],
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
		it( 'should show Create Overlay button when no overlays exist', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const createButton = screen.getByRole( 'button', {
				name: 'Create overlay',
			} );
			expect( createButton ).toBeInTheDocument();
			expect(
				screen.getByText(
					'An overlay template allows you to customize the appearance of the dialog that opens when the menu button is pressed.'
				)
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'combobox', { name: 'Overlay template' } )
			).not.toBeInTheDocument();
		} );

		it( 'should show dropdown selector when theme overlays exist', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			expect(
				screen.getByRole( 'combobox', { name: 'Overlay template' } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', {
					name: 'Create new overlay template',
				} )
			).toBeInTheDocument();
		} );

		it( 'should show dropdown selector when any overlays exist', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1, templatePart2 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );
			expect( select ).toBeInTheDocument();

			// Should have Default + 2 overlays
			const options = screen.getAllByRole( 'option' );
			expect( options ).toHaveLength( 3 );

			expect(
				screen.getByRole( 'option', { name: 'My Overlay' } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'option', { name: 'Another Overlay' } )
			).toBeInTheDocument();
			// Should show "Default" option (not "None (default)")
			expect(
				screen.getByRole( 'option', { name: 'Default' } )
			).toBeInTheDocument();
		} );

		it( 'should display overlay slug when title is missing', () => {
			const templatePartNoTitle = {
				...templatePart1,
				title: null,
			};

			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePartNoTitle ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			expect(
				screen.getByRole( 'option', { name: 'my-overlay' } )
			).toBeInTheDocument();
		} );

		it( 'should store slug only when an overlay is selected', async () => {
			const user = userEvent.setup();

			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );

			await user.selectOptions( select, 'my-overlay' );

			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				overlay: 'my-overlay',
			} );
		} );

		it( 'unsets overlay when "Default" is selected', async () => {
			const user = userEvent.setup();

			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="my-overlay"
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

		it( 'should display selected overlay by slug', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="my-overlay"
				/>
			);

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );

			expect( select ).toHaveValue( 'my-overlay' );
		} );
	} );

	describe( 'Edit button', () => {
		it( 'should not render when no overlay is selected', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const editButton = screen.queryByRole( 'button', {
				name: 'Edit overlay',
			} );

			expect( editButton ).not.toBeInTheDocument();
		} );

		it( 'should not display edit button while overlays templates are loading', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: true,
				hasResolved: false,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="my-overlay"
				/>
			);

			// Component shows disabled select and disabled button when loading
			const select = screen.getByRole( 'combobox', {
				name: 'Overlay template',
			} );
			expect( select ).toBeDisabled();

			// Expect Edit button to not be in the document
			expect(
				screen.queryByRole( 'button', {
					name: ( accessibleName ) =>
						accessibleName.startsWith( 'Edit overlay' ),
				} )
			).not.toBeInTheDocument();
		} );

		it( 'should be enabled when a valid overlay is selected', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="my-overlay"
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
			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="my-overlay"
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

		it( 'should open the overlay copy in the focused editor when edit button is clicked', async () => {
			const user = userEvent.setup();

			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="my-overlay"
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: ( accessibleName ) =>
					accessibleName.startsWith( 'Edit overlay' ),
			} );

			await user.click( editButton );

			// Should create (or reuse) the copy of the overlay pattern and
			// open it.
			expect( mockCustomizePattern ).toHaveBeenCalledWith(
				templatePart1.pattern
			);
			await waitFor( () =>
				expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
					postId: 123,
					postType: 'wp_block',
				} )
			);
		} );

		it( 'should open a user pattern overlay directly when edit button is clicked', async () => {
			const user = userEvent.setup();

			useOverlayPatterns.mockReturnValue( {
				overlays: [
					{
						id: 77,
						slug: 'custom-overlay',
						title: { rendered: 'Custom Overlay' },
						isUser: true,
					},
				],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="custom-overlay"
				/>
			);

			await user.click(
				screen.getByRole( 'button', {
					name: ( accessibleName ) =>
						accessibleName.startsWith( 'Edit overlay' ),
				} )
			);

			await waitFor( () =>
				expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
					postId: 77,
					postType: 'wp_block',
				} )
			);
			expect( mockCustomizePattern ).not.toHaveBeenCalled();
		} );

		it( 'should not navigate to focused overlay editor when button is disabled', async () => {
			const user = userEvent.setup();

			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlay="my-overlay"
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
		it( 'should show prominent create button with help text when no overlays exist', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			// Should show prominent create button
			expect(
				screen.getByRole( 'button', {
					name: 'Create overlay',
				} )
			).toBeInTheDocument();

			// Should show help text explaining overlays
			expect(
				screen.getByText(
					'An overlay template allows you to customize the appearance of the dialog that opens when the menu button is pressed.'
				)
			).toBeInTheDocument();
		} );

		it( 'should show dropdown with help text when overlays are available', () => {
			useOverlayPatterns.mockReturnValue( {
				overlays: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			// Should show dropdown selector
			expect(
				screen.getByRole( 'combobox', { name: 'Overlay template' } )
			).toBeInTheDocument();

			// Should show default help text
			expect(
				screen.getByText( 'Select an overlay for navigation.' )
			).toBeInTheDocument();

			// Should also show small create button
			expect(
				screen.getByRole( 'button', {
					name: 'Create new overlay template',
				} )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Create overlay', () => {
		it( 'should store slug only and open the copy when creating overlay via prominent button', async () => {
			const user = userEvent.setup();
			const newOverlay = {
				id: 45,
				slug: 'overlay',
				title: {
					rendered: 'Overlay',
				},
				isUser: true,
			};

			mockCreateOverlayTemplatePart.mockResolvedValue( newOverlay );

			useOverlayPatterns.mockReturnValue( {
				overlays: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			// Click prominent create button (shown when no custom overlays)
			const createButton = screen.getByRole( 'button', {
				name: 'Create overlay',
			} );

			await user.click( createButton );

			expect( mockCreateOverlayTemplatePart ).toHaveBeenCalled();
			// Should store slug only
			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				overlay: 'overlay',
			} );
			// Should open the created copy
			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
				postId: 45,
				postType: 'wp_block',
			} );
		} );

		it( 'should show error notice when creation fails', async () => {
			const user = userEvent.setup();

			const error = new Error( 'Failed to create overlay' );
			error.code = 'create_error';

			mockCreateOverlayTemplatePart.mockRejectedValue( error );

			useOverlayPatterns.mockReturnValue( {
				overlays: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const createButton = screen.getByRole( 'button', {
				name: 'Create overlay',
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
			useOverlayPatterns.mockReturnValue( {
				overlays: [],
				isResolving: true,
				hasResolved: false,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			// When resolving, show dropdown interface with small create button
			const createButton = screen.getByRole( 'button', {
				name: 'Create new overlay template',
			} );

			expect( createButton ).toHaveAttribute( 'aria-disabled', 'true' );
		} );
	} );
} );
