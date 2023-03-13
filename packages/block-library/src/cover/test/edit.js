/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { createRegistry, dispatch } from '@wordpress/data';
import { SlotFillProvider } from '@wordpress/components';
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';
import {
	store as blockEditorStore,
	BlockTools,
	WritingFlow,
	ObserveTyping,
	BlockEditorKeyboardShortcuts,
	BlockControls,
} from '@wordpress/block-editor';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import * as selectors from '../../../../block-editor/src/store/selectors';
import reducer from '../../../../block-editor/src/store/reducer';
import * as actions from '../../../../block-editor/src/store/actions';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: () => ( {} ),
} ) );

/**
 * Internal dependencies
 */
import { CoverEdit } from '../edit';
import settings from '../index';
import metadata from '../block.json';

function setup( jsx ) {
	return {
		user: userEvent.setup(),
		...render( jsx ),
	};
}
const setAttributes = jest.fn();
const setOverlayColor = jest.fn();
const toggleSelection = jest.fn();

const defaultAttributes = {
	alt: '',
	backgroundType: 'image',
	dimRatio: 100,
	hasParallax: false,
	isDark: false,
	isRepeated: false,
	useFeaturedImage: false,
};
const defaultProps = {
	attributes: defaultAttributes,
	coverRef: undefined,
	overlayColor: { color: undefined, class: undefined },
	isSelected: true,
	setAttributes,
	setOverlayColor,
	toggleSelection,
	context: {},
};

const Wrapper = ( { children } ) => (
	<ShortcutProvider>
		<SlotFillProvider>
			<BlockTools>
				<BlockEditorKeyboardShortcuts.Register />
				<WritingFlow>
					<ObserveTyping>{ children }</ObserveTyping>
				</WritingFlow>
				<BlockControls.Slot />
			</BlockTools>
		</SlotFillProvider>
	</ShortcutProvider>
);

let block;
beforeEach( () => {
	createRegistry().registerStore( blockEditorStore, {
		actions,
		selectors,
		reducer,
	} );
	registerBlockType( 'core/cover', { ...metadata, ...settings } );
	block = createBlock( 'core/cover', {} );
	dispatch( blockEditorStore ).resetBlocks( [ block ] );
	dispatch( blockEditorStore ).selectBlock( block.clientId );
	setAttributes.mockClear();
} );

afterEach( () => {
	unregisterBlockType( 'core/cover' );
	dispatch( blockEditorStore ).removeBlock( block.clientId );
} );

describe( 'Cover edit', () => {
	describe( 'Placeholder', () => {
		test( 'shows placeholder if background image and color not set', () => {
			setup(
				<Wrapper>
					<CoverEdit
						{ ...defaultProps }
						clientId={ block.clientId }
					/>
				</Wrapper>
			);
			expect(
				screen.getByRole( 'group', {
					name: 'To edit this block, you need permission to upload media.',
				} )
			).toBeInTheDocument();
		} );

		test( 'does not show placeholder if color is set', () => {
			setup(
				<Wrapper>
					<CoverEdit
						{ ...defaultProps }
						clientId={ block.clientId }
						overlayColor={ { color: '#ffffff' } }
					/>
				</Wrapper>
			);
			expect(
				screen.queryByRole( 'group', {
					name: 'To edit this block, you need permission to upload media.',
				} )
			).not.toBeInTheDocument();
		} );

		test( 'sets overlay color when a color button is clicked', async () => {
			const { user } = setup(
				<Wrapper>
					<CoverEdit
						{ ...defaultProps }
						clientId={ block.clientId }
					/>
				</Wrapper>
			);
			await user.click(
				screen.getByRole( 'button', {
					name: 'Color: Black',
				} )
			);

			expect( setOverlayColor ).toHaveBeenCalledWith( '#000000', 0 );
		} );
	} );
} );
