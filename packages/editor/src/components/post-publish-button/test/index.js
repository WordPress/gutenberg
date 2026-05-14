/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { PostPublishButton } from '../';

describe( 'PostPublishButton', () => {
	describe( 'aria-disabled', () => {
		it( 'should be true if post is currently saving', () => {
			render( <PostPublishButton isPublishable isSaveable isSaving /> );

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should be true if post is not publishable and not forceIsDirty', () => {
			render(
				<PostPublishButton
					isSaveable
					isPublishable={ false }
					forceIsDirty={ false }
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should be true if post is not saveable', () => {
			render( <PostPublishButton isPublishable isSaveable={ false } /> );

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should be true if post saving is locked', () => {
			render(
				<PostPublishButton
					isPublishable
					isSaveable
					isPostSavingLocked
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should be false if post is saveable but not publishable and forceIsDirty is true', () => {
			render(
				<PostPublishButton
					isSaveable
					isPublishable={ false }
					forceIsDirty
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'false' );
		} );

		it( 'should be false if post is publishave and saveable', () => {
			render( <PostPublishButton isPublishable isSaveable /> );

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'false' );
		} );
	} );

	describe( 'publish status', () => {
		it( 'should be pending for contributor', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction={ false }
					savePostStatus={ savePostStatus }
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'pending' );
		} );

		it( 'should be future for scheduled post', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction
					savePostStatus={ savePostStatus }
					isBeingScheduled
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'future' );
		} );

		it( 'should be private for private visibility', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction
					savePostStatus={ savePostStatus }
					visibility="private"
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'private' );
		} );

		it( 'should be publish otherwise', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction
					savePostStatus={ savePostStatus }
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'publish' );
		} );
	} );

	describe( 'click', () => {
		it( 'should save with status', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction
					savePostStatus={ savePostStatus }
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'publish' );
		} );
	} );

	it( 'should have save modifier class', () => {
		render( <PostPublishButton isSaving isPublished /> );

		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toHaveClass( 'is-busy' );
	} );

	it( 'should show active Distributed Editing save descriptor text', () => {
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				distributedEditingSaveButtonState={ {
					status: 'accepted_but_unconsumed',
					reason: 'fresh_review_accepted_but_unconsumed',
					source: 'fresh_review',
					label: 'Submit reviewed changes',
					statusText:
						'Accepted Distributed Editing proof is ready for guarded retry save.',
					clickAction: 'continue_guarded_retry_save',
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit reviewed changes',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Accepted Distributed Editing proof is ready for guarded retry save.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'accepted_but_unconsumed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-source',
			'fresh_review'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-click-action',
			'continue_guarded_retry_save'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-reason',
			'fresh_review_accepted_but_unconsumed'
		);
	} );

	it( 'should not expose Distributed Editing save descriptor data for the default state', () => {
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				distributedEditingSaveButtonState={ {
					status: 'update_ready',
					source: 'default',
					label: 'Update',
					statusText: 'Ready to update',
					clickAction: 'continue_save',
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit for Review',
		} );
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-status'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-source'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-click-action'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-reason'
		);
	} );

	it( 'should expose Distributed Editing save descriptor data on toggle buttons', () => {
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				isToggle
				distributedEditingSaveButtonState={ {
					status: 'retry_save_confirmed',
					source: 'retry_save',
					label: 'Retry save confirmed',
					statusText: 'Distributed Editing retry save confirmed.',
					disabled: true,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Retry save confirmed',
		} );
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'retry_save_confirmed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-source',
			'retry_save'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-click-action'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-reason'
		);
	} );

	it( 'should expose Distributed Editing in-flight save state without clicking through', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'fresh_review_validating',
					label: 'Validating review',
					statusText:
						'Fresh-review validation is in progress before guarded save.',
					disabled: true,
					busy: true,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Validating review',
		} );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( button ).toHaveClass( 'is-busy' );

		await user.click( button );

		expect( savePostStatus ).not.toHaveBeenCalled();
	} );
} );
