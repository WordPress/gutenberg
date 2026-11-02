import { describe, expect, it } from 'vitest';
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState } from '@wordpress/element';
import * as Notice from '../index';

function Message( {
	children = 'Your draft has been saved.',
	...props
}: React.ComponentProps< typeof Notice.Root > ) {
	return (
		<Notice.Root { ...props }>
			<Notice.Title>Draft saved</Notice.Title>
			<Notice.Description>{ children }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton>Undo</Notice.ActionButton>
			</Notice.Actions>
			<Notice.CloseIconButton />
		</Notice.Root>
	);
}

describe( 'Notice.List', () => {
	it( 'keeps initial notices silent, including in Strict Mode', async () => {
		render(
			<StrictMode>
				<Notice.List>
					<Message />
				</Notice.List>
			</StrictMode>
		);
		// Flush observed DOM updates before checking silence.
		await act( () => Promise.resolve() );
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
		expect( screen.getByRole( 'alert' ) ).toBeEmptyDOMElement();
	} );

	it( 'announces added notices and descendant message updates without action content', async () => {
		function Description() {
			const [ isUpdated, setIsUpdated ] = useState( false );
			return (
				<>
					<Notice.Description>
						{ isUpdated
							? 'Your changes are now public.'
							: 'Your draft has been saved.' }
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionButton
							onClick={ () => setIsUpdated( true ) }
						>
							Publish
						</Notice.ActionButton>
						<Notice.Description>Action feedback</Notice.Description>
					</Notice.Actions>
				</>
			);
		}
		const { rerender } = render( <Notice.List /> );
		rerender(
			<Notice.List>
				<Notice.Root>
					<Notice.Title>
						Draft <strong>saved</strong>
					</Notice.Title>
					<Description />
					<Notice.CloseIconButton />
				</Notice.Root>
			</Notice.List>
		);
		await waitFor( () =>
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				/^Draft saved\. Your draft has been saved\.$/
			)
		);
		// Dispatch without moving focus so this isolates descendant text updates.
		fireEvent.click( screen.getByRole( 'button', { name: 'Publish' } ) );
		await waitFor( () =>
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				/^Draft saved\. Your changes are now public\.$/
			)
		);
		const announcement = within( screen.getByRole( 'status' ) ).getByText(
			'Draft saved. Your changes are now public.'
		);
		expect( announcement ).toHaveTextContent(
			'Draft saved. Your changes are now public.',
			{ normalizeWhitespace: false }
		);
		expect( announcement ).toHaveProperty( 'childNodes.length', 1 );
	} );

	it( 'supports explicit messages, urgency independent of intent, and opting out', async () => {
		const { rerender } = render( <Notice.List /> );
		rerender(
			<Notice.List>
				<Message intent="error" />
				<Message
					intent="info"
					politeness="assertive"
					spokenMessage="Your session expires soon."
				/>
				<Message politeness="off">Do not announce this notice.</Message>
				<Message spokenMessage="">Skip this announcement too.</Message>
			</Notice.List>
		);
		await waitFor( () => {
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				/^Draft saved\. Your draft has been saved\.$/
			);
			expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
				/^Your session expires soon\.$/
			);
		} );
	} );

	it( 'omits hidden notices and descendants from announcements', async () => {
		const { rerender } = render( <Notice.List /> );
		const renderNotice = ( isHidden: boolean ) => (
			<Notice.List>
				<Notice.Root>
					<Notice.Title>
						Saved<span aria-hidden="true">Decorative title</span>
					</Notice.Title>
					<Notice.Description>
						Public message.
						<span hidden={ isHidden }>
							<strong>Hidden detail.</strong>
						</span>
						<span aria-hidden={ isHidden }>
							<strong>Excluded detail.</strong>
						</span>
					</Notice.Description>
				</Notice.Root>
				<Message
					hidden={ isHidden }
					spokenMessage="Hidden notice override."
				/>
				<div aria-hidden={ isHidden }>
					<Message>Wrapped notice.</Message>
				</div>
			</Notice.List>
		);
		rerender( renderNotice( true ) );
		const status = screen.getByRole( 'status' );
		await waitFor( () =>
			expect( status ).toHaveTextContent( 'Public message.' )
		);
		expect( status ).not.toHaveTextContent(
			/Decorative|Hidden|Excluded|Wrapped/
		);
		rerender( renderNotice( false ) );
		await waitFor( () =>
			expect( status ).toHaveTextContent(
				/Hidden detail\..*Excluded detail\./
			)
		);
		expect( status ).toHaveTextContent( 'Hidden notice override.' );
		expect( status ).toHaveTextContent( 'Wrapped notice.' );
		expect( status ).not.toHaveTextContent( 'Decorative title' );
	} );

	it( 'keeps localized title punctuation unchanged', async () => {
		const { rerender } = render( <Notice.List /> );
		rerender(
			<Notice.List>
				<Notice.Root>
					<Notice.Title>تم الحفظ؟</Notice.Title>
					<Notice.Description>تم حفظ المسودة.</Notice.Description>
				</Notice.Root>
			</Notice.List>
		);
		const status = screen.getByRole( 'status' );
		await waitFor( () =>
			expect( status ).toHaveTextContent(
				/^تم الحفظ؟ تم حفظ المسودة\.$/,
				{
					normalizeWhitespace: false,
				}
			)
		);
	} );

	it( 'announces new messages while another notice has focus', async () => {
		const user = userEvent.setup();
		const renderNotices = ( count: number ) => (
			<>
				<button>Outside</button>
				<Notice.List>
					{ Array.from( { length: count }, ( _, key ) => (
						<Message
							key={ key }
							politeness={ key === 1 ? 'assertive' : 'polite' }
						/>
					) ) }
				</Notice.List>
			</>
		);
		const { rerender } = render( renderNotices( 1 ) );
		await user.click( screen.getByRole( 'button', { name: 'Undo' } ) );
		rerender( renderNotices( 3 ) );
		await waitFor( () => {
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				/^Draft saved\. Your draft has been saved\.$/
			);
			expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
				/^Draft saved\. Your draft has been saved\.$/
			);
		} );
		await user.click( screen.getByRole( 'button', { name: 'Outside' } ) );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			/^Draft saved\. Your draft has been saved\.$/
		);
	} );

	it( 'does not repeat existing notices after a modal hides their ancestor', async () => {
		const renderNotices = ( count: number ) => (
			<div role="group" aria-label="Modal background">
				<Notice.List>
					{ Array.from( { length: count }, ( _, key ) => (
						<Message key={ key } />
					) ) }
				</Notice.List>
			</div>
		);
		const { rerender } = render( renderNotices( 2 ) );
		const ancestor = screen.getByRole( 'group', {
			name: 'Modal background',
		} );
		const status = screen.getByRole( 'status' );
		ancestor.setAttribute( 'aria-hidden', 'true' );
		rerender( renderNotices( 3 ) );
		await act( () => Promise.resolve() );
		ancestor.removeAttribute( 'aria-hidden' );
		rerender( renderNotices( 2 ) );
		await act( () => Promise.resolve() );
		expect( status ).toBeEmptyDOMElement();
	} );

	it( 'removes dismissed announcements without repeating remaining messages', async () => {
		const { rerender } = render( <Notice.List /> );
		rerender(
			<Notice.List>
				<Message key="first" />
				<Message key="second">Another draft was saved.</Message>
			</Notice.List>
		);
		await waitFor( () =>
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'Another draft was saved.'
			)
		);
		const status = screen.getByRole( 'status' );
		const remainingMessage = within( status ).getByText(
			'Draft saved. Another draft was saved.'
		);
		rerender(
			<Notice.List>
				<Message key="second">Another draft was saved.</Message>
			</Notice.List>
		);
		await waitFor( () =>
			expect( status ).toHaveTextContent(
				/^Draft saved\. Another draft was saved\.$/
			)
		);
		expect(
			within( status ).getByText(
				'Draft saved. Another draft was saved.'
			)
		).toBe( remainingMessage );
	} );
} );
