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
	overlayTemplatePart: undefined,
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

			expect( screen.getByText( 'Loading overlays…' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Template part selection', () => {
		it( 'should show selector with "None" option when no template parts are available', () => {
			useEntityRecords.mockReturnValue( {
				records: [],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay',
			} );
			expect( select ).toBeInTheDocument();
			expect( select ).toHaveValue( '' );

			// Check for "None" option
			expect( screen.getByRole( 'option', { name: 'None' } ) ).toBeInTheDocument();
		} );

		it( 'should filter template parts by overlay area', () => {
			useEntityRecords.mockReturnValue( {
				records: allTemplateParts,
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			screen.getByRole( 'combobox', {
				name: 'Overlay Template Part',
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
				name: 'Overlay',
			} );

			await user.selectOptions( select, 'twentytwentyfive//my-overlay' );

			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				overlayTemplatePart: 'twentytwentyfive//my-overlay',
			} );
		} );

		it( 'should call setAttributes with undefined when "None" is selected', async () => {
			const user = userEvent.setup();

			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlayTemplatePart="twentytwentyfive//my-overlay"
				/>
			);

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay',
			} );

			await user.selectOptions( select, '' );

			expect( mockSetAttributes ).toHaveBeenCalledWith( {
				overlayTemplatePart: undefined,
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
					overlayTemplatePart="twentytwentyfive//my-overlay"
				/>
			);

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay',
			} );

			expect( select ).toHaveValue( 'twentytwentyfive//my-overlay' );
		} );
	} );

	describe( 'Edit button', () => {
		it( 'should be disabled when no template part is selected', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const editButton = screen.getByRole( 'button', {
				name: 'Edit overlay',
			} );

			expect( editButton ).toBeDisabled();
		} );

		it( 'should be disabled when template parts are loading', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: true,
				hasResolved: false,
			} );

			render(
				<OverlayTemplatePartSelector
					{ ...defaultProps }
					overlayTemplatePart="twentytwentyfive//my-overlay"
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: 'Edit overlay',
			} );

			expect( editButton ).toBeDisabled();
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
					overlayTemplatePart="twentytwentyfive//my-overlay"
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: 'Edit overlay',
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
					overlayTemplatePart="twentytwentyfive//my-overlay"
					onNavigateToEntityRecord={ undefined }
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: 'Edit overlay',
			} );

			expect( editButton ).toBeDisabled();
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
					overlayTemplatePart="twentytwentyfive//my-overlay"
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: 'Edit overlay',
			} );

			await user.click( editButton );

			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
				kind: 'postType',
				name: 'wp_template_part',
				postId: 'twentytwentyfive//my-overlay',
			} );
		} );

		it( 'should not call onNavigateToEntityRecord when button is disabled', async () => {
			const user = userEvent.setup();

			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: false,
				hasResolved: true,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const editButton = screen.getByRole( 'button', {
				name: 'Edit overlay',
			} );

			// Button should be disabled, but try clicking anyway
			expect( editButton ).toBeDisabled();

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
				screen.getByText(
					'No overlays available. Create one in the Site Editor.'
				)
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
					overlayTemplatePart="twentytwentyfive//my-overlay"
				/>
			);

			const editButton = screen.getByRole( 'button', {
				name: /Edit overlay/,
			} );

			expect( editButton ).toHaveAccessibleName();
		} );

		it( 'should disable select control when loading', () => {
			useEntityRecords.mockReturnValue( {
				records: [ templatePart1 ],
				isResolving: true,
				hasResolved: false,
			} );

			render( <OverlayTemplatePartSelector { ...defaultProps } /> );

			const select = screen.getByRole( 'combobox', {
				name: 'Overlay',
			} );

			expect( select ).toBeDisabled();
		} );
	} );
} );

