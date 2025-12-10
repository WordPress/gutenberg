/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import OverlayTemplatePartSelector from '../overlay-template-part-selector';

// Mock useEntityRecords
jest.mock( '@wordpress/core-data', () => {
	const actual = jest.requireActual( '@wordpress/core-data' );
	return {
		...actual,
		useEntityRecords: jest.fn(),
	};
} );

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
	beforeEach( () => {
		jest.clearAllMocks();
		useEntityRecords.mockReturnValue( {
			records: [],
			isResolving: false,
			hasResolved: false,
		} );
	} );

	describe( 'Loading state', () => {
		it( 'should show loading spinner when template parts are resolving', () => {
			useEntityRecords.mockReturnValue( {
				records: null,
				isResolving: true,
				hasResolved: false,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			expect(
				screen.getByText( 'Loading overlays…' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Template part selection', () => {
		it( 'should show selector with "None (default)" option when no template parts are available', () => {
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

		it( 'should filter template parts by overlay area', () => {
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

		it( 'should display template part slug when title is missing', () => {
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

		it( 'should call setAttributes when a template part is selected', async () => {
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

		it( 'should call setAttributes with undefined when "None (default)" is selected', async () => {
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

		it( 'should display selected template part', () => {
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
		it( 'should not render when no template part is selected', () => {
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

		it( 'should not render button when template parts are initially loading', () => {
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

			// Component shows spinner when initially loading, button doesn't render
			expect(
				screen.getByText( 'Loading overlays…' )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /Edit overlay/,
				} )
			).not.toBeInTheDocument();
		} );

		it( 'should be enabled when a valid template part is selected', () => {
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
		} );

		it( 'should be disabled when onNavigateToEntityRecord is not available', () => {
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

		it( 'should call onNavigateToEntityRecord when edit button is clicked', async () => {
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

		it( 'should not call onNavigateToEntityRecord when button is disabled', async () => {
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
		} );
	} );

	describe( 'Accessibility', () => {
		it( 'should have proper ARIA labels on edit button', () => {
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

			expect( editButton ).toHaveAccessibleName();
		} );

		it( 'should show loading spinner instead of select control when initially loading', () => {
			useEntityRecords.mockReturnValue( {
				records: null,
				isResolving: true,
				hasResolved: false,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			// Should show loading spinner, not the select control
			expect(
				screen.getByText( 'Loading overlays…' )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'combobox', {
					name: 'Overlay template',
				} )
			).not.toBeInTheDocument();
		} );
	} );
} );
