/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createSlotFill, Provider as SlotFillProvider } from '../';

describe( 'createSlotFill', () => {
	test( 'should render all slot fills in order of rendering', () => {
		const PostSidebar = createSlotFill( 'PostSidebar' );

		render(
			<SlotFillProvider>
				<PostSidebar.Fill>
					<p>Post Section 1</p>
				</PostSidebar.Fill>
				<PostSidebar.Fill>
					<p>Post Section 2</p>
				</PostSidebar.Fill>
				<div title="Post Sidebar">
					<PostSidebar.Slot />
				</div>
			</SlotFillProvider>
		);

		const postSidebar = screen.getByTitle( 'Post Sidebar' );
		const postSections =
			within( postSidebar ).getAllByText( /Post Section \d/ );

		expect( postSidebar ).toBeVisible();
		expect( postSections ).toHaveLength( 2 );
		postSections.forEach( ( postSection, index ) => {
			expect( postSection ).toBeVisible();
			expect( postSection ).toHaveTextContent(
				`Post Section ${ index + 1 }`
			);
		} );
	} );

	test( 'should support separate multiple slots and fills', () => {
		const PostSidebar = createSlotFill( 'PostSidebar' );
		const PageSidebar = createSlotFill( 'PageSidebar' );

		render(
			<SlotFillProvider>
				<PostSidebar.Fill>
					<p>Post Section</p>
				</PostSidebar.Fill>
				<PageSidebar.Fill>
					<p>Page Section</p>
				</PageSidebar.Fill>
				<div title="Post Sidebar">
					<PostSidebar.Slot />
				</div>
				<div title="Page Sidebar">
					<PageSidebar.Slot />
				</div>
			</SlotFillProvider>
		);

		const postSidebar = screen.getByTitle( 'Post Sidebar' );

		expect( postSidebar ).toBeVisible();
		expect(
			within( postSidebar ).getByText( 'Post Section' )
		).toBeVisible();

		const pageSidebar = screen.getByTitle( 'Page Sidebar' );

		expect( pageSidebar ).toBeVisible();
		expect(
			within( pageSidebar ).getByText( 'Page Section' )
		).toBeVisible();

		expect(
			within( postSidebar ).queryByText( 'Page Section' )
		).not.toBeInTheDocument();
		expect(
			within( pageSidebar ).queryByText( 'Post Section' )
		).not.toBeInTheDocument();
	} );

	test( 'should forward ref to the slot when using bubblesVirtually', () => {
		const TestSlotFill = createSlotFill( 'TestRefSlot' );
		const ref = createRef();

		render(
			<SlotFillProvider>
				<TestSlotFill.Fill>
					<p>Content</p>
				</TestSlotFill.Fill>
				<TestSlotFill.Slot bubblesVirtually ref={ ref } />
			</SlotFillProvider>
		);

		expect( ref.current ).not.toBeNull();
		expect( ref.current.tagName ).toBe( 'DIV' );
	} );

	test( 'should forward ref without bubblesVirtually (ref stays null for fragment-based slot)', () => {
		const TestSlotFill = createSlotFill( 'TestRefSlotBase' );
		const ref = createRef();

		render(
			<SlotFillProvider>
				<TestSlotFill.Fill>
					<p>Content</p>
				</TestSlotFill.Fill>
				<TestSlotFill.Slot ref={ ref } />
			</SlotFillProvider>
		);

		expect( ref.current ).toBeNull();
	} );
} );
