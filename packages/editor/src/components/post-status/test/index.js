import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import PostStatus, { STATUS_OPTIONS } from '../';

const mockEditEntityRecord = jest.fn();

jest.mock( '@wordpress/data/src/components/use-dispatch', () => {
	return {
		useDispatch: () => ( { editEntityRecord: mockEditEntityRecord } ),
		useDispatchWithMap: jest.fn(),
	};
} );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	const mock = jest.fn();
	return mock;
} );

jest.mock( '../../post-schedule', () => ( {
	PrivatePostSchedule: () => <div data-testid="private-post-schedule" />,
} ) );

jest.mock( '../../post-sticky', () => () => <div data-testid="post-sticky" /> );

describe( 'PostStatus', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'exports static STATUS_OPTIONS', () => {
		expect( STATUS_OPTIONS ).toHaveLength( 5 );
		expect( STATUS_OPTIONS.map( ( o ) => o.value ) ).toEqual( [
			'draft',
			'pending',
			'private',
			'future',
			'publish',
		] );
	} );

	it( 'renders default status label when post has draft status', () => {
		useSelect.mockImplementation( () => ( {
			status: 'draft',
			date: null,
			password: '',
			postId: 1,
			postType: 'post',
			canEdit: true,
			postStatuses: [],
		} ) );

		render( <PostStatus /> );

		expect(
			screen.getByRole( 'button', { name: /Change status: Draft/i } )
		).toBeVisible();
	} );

	it( 'renders custom status name on toggle button when post has a custom status', () => {
		useSelect.mockImplementation( () => ( {
			status: 'closed',
			date: null,
			password: '',
			postId: 1,
			postType: 'post',
			canEdit: true,
			postStatuses: [
				{
					name: 'Closed',
					slug: 'closed',
					show_in_admin_status_list: true,
				},
			],
		} ) );

		render( <PostStatus /> );

		expect(
			screen.getByRole( 'button', { name: /Change status: Closed/i } )
		).toBeVisible();
	} );

	it( 'renders custom statuses in the dropdown options when show_in_admin_status_list is true', async () => {
		const user = userEvent.setup();

		useSelect.mockImplementation( () => ( {
			status: 'draft',
			date: null,
			password: '',
			postId: 1,
			postType: 'post',
			canEdit: true,
			postStatuses: [
				{
					name: 'Draft',
					slug: 'draft',
					show_in_admin_status_list: true,
				},
				{
					name: 'Published',
					slug: 'publish',
					show_in_admin_status_list: true,
				},
				{
					name: 'Closed',
					slug: 'closed',
					description: 'Job listing is closed.',
					show_in_admin_status_list: true,
				},
				{
					name: 'Archived',
					slug: 'archived',
					show_in_admin_status_list: false,
					show_in_list: false,
				},
				{
					name: 'Trash',
					slug: 'trash',
					show_in_admin_status_list: true,
				},
			],
		} ) );

		render( <PostStatus /> );

		const toggleButton = screen.getByRole( 'button', {
			name: /Change status: Draft/i,
		} );
		await user.click( toggleButton );

		expect(
			screen.getByRole( 'radio', { name: /Closed/i } )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Job listing is closed.' )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'radio', { name: 'Archived' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'radio', { name: 'Trash' } )
		).not.toBeInTheDocument();
	} );

	it( 'updates post status when a custom status option is selected', async () => {
		const user = userEvent.setup();

		useSelect.mockImplementation( () => ( {
			status: 'draft',
			date: null,
			password: '',
			postId: 42,
			postType: 'post',
			canEdit: true,
			postStatuses: [
				{
					name: 'Closed',
					slug: 'closed',
					show_in_admin_status_list: true,
				},
			],
		} ) );

		render( <PostStatus /> );

		const toggleButton = screen.getByRole( 'button', {
			name: /Change status: Draft/i,
		} );
		await user.click( toggleButton );

		const closedOption = screen.getByRole( 'radio', { name: 'Closed' } );
		await user.click( closedOption );

		expect( mockEditEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'post',
			42,
			{
				status: 'closed',
				date: null,
				password: '',
			}
		);
	} );

	it( 'renders read-only custom status when user cannot edit', () => {
		useSelect.mockImplementation( () => ( {
			status: 'closed',
			date: null,
			password: '',
			postId: 1,
			postType: 'post',
			canEdit: false,
			postStatuses: [
				{
					name: 'Closed',
					slug: 'closed',
					show_in_admin_status_list: true,
				},
			],
		} ) );

		render( <PostStatus /> );

		expect( screen.getByText( 'Closed' ) ).toBeVisible();
	} );
} );
