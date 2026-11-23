import { describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import {
	privateApis as coreDataPrivateApis,
	type CoreDataPrivateApis,
} from '@wordpress/core-data';
import { unlock } from '../../../lock-unlock';
import { useBlockHighlighting } from '../use-block-highlighting';

const state = vi.hoisted( () => ( {
	users: [] as unknown[],
	resolveSelection: ( selection: { blockPosition: string } ) => ( {
		localClientId: selection.blockPosition,
		richTextOffset: null,
		attributeKey: null,
	} ),
} ) );
vi.mock( import( '@wordpress/core-data' ), async ( importOriginal ) => {
	const original = await importOriginal();
	const { lock, unlock: unlockApis } = await import( '../../../lock-unlock' );
	const privateApis = {};
	lock( privateApis, {
		...unlockApis< CoreDataPrivateApis >( original.privateApis ),
		useActiveCollaborators: () => state.users,
		useResolvedSelection: () => state.resolveSelection,
	} );
	return { ...original, privateApis };
} );

describe( 'collapsed whole-block highlighting', () => {
	it.each( [ 'single', 'set' ] )(
		'highlights the visible ancestor of a hidden %s selection without duplicate avatars',
		( kind ) => {
			const { SelectionType } = unlock( coreDataPrivateApis );
			const whole = {
				type: SelectionType.WholeBlock,
				blockPosition: 'a',
			};
			state.users = [
				{
					isMe: false,
					clientId: 7,
					collaboratorInfo: {
						id: 7,
						name: 'Ada',
						enteredAt: 1,
						avatar_urls: {},
					},
					editorState: {
						selection:
							kind === 'single'
								? whole
								: {
										type: SelectionType.None,
										setSelection: [
											whole,
											{
												type: SelectionType.WholeBlock,
												blockPosition: 'b',
											},
										],
									},
					},
				},
			];
			render(
				<div data-testid="overlay">
					<div data-block="details" data-testid="details">
						<div data-block="a" data-testid="a">
							Hidden A
						</div>
						<div data-block="b" data-testid="b">
							Hidden B
						</div>
					</div>
				</div>
			);
			for ( const id of [ 'overlay', 'details', 'a', 'b' ] ) {
				const visible = id === 'overlay' || id === 'details';
				vi.spyOn(
					screen.getByTestId( id ),
					'getBoundingClientRect'
				).mockReturnValue( {
					left: 10,
					top: 20,
					right: 110,
					bottom: 40,
					width: visible ? 100 : 0,
					height: visible ? 20 : 0,
				} as DOMRect );
			}
			const { result } = renderHook( () =>
				useBlockHighlighting(
					screen.getByTestId( 'overlay' ),
					document,
					1,
					'post',
					0,
					false
				)
			);
			expect( result.current.highlights ).toEqual( [
				{
					blockId: 'details',
					x: 0,
					y: 0,
					collaborators: [
						expect.objectContaining( {
							clientId: 7,
							userName: 'Ada',
						} ),
					],
				},
			] );
			expect( screen.getByTestId( 'details' ) ).toHaveClass(
				'is-collaborator-selected'
			);
			expect( screen.getByTestId( 'a' ) ).not.toHaveClass(
				'is-collaborator-selected'
			);
			expect( screen.getByTestId( 'b' ) ).not.toHaveClass(
				'is-collaborator-selected'
			);
		}
	);
} );
