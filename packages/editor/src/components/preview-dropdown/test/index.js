/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PreviewDropdown from '..';
import { store as editorStore } from '../../../store';

jest.mock( '../../../store', () => ( {
	store: { name: 'editor' },
} ) );

jest.mock( '@wordpress/compose', () => ( {
	useViewportMatch: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	useRegistry: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: { name: 'core' },
} ) );

jest.mock( '@wordpress/preferences', () => ( {
	store: { name: 'preferences' },
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( value ) => value,
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: { name: 'block-editor' },
	privateApis: {
		resolveCurrentViewport: (
			deviceType,
			isLargerThanMobile,
			isLargerThanTablet
		) => {
			const normalized = deviceType?.toLowerCase();
			if ( normalized === 'mobile' || normalized === 'tablet' ) {
				return normalized;
			}
			if ( ! isLargerThanMobile ) {
				return 'mobile';
			}
			if ( ! isLargerThanTablet ) {
				return 'tablet';
			}
			return 'desktop';
		},
	},
} ) );

jest.mock( '@wordpress/components', () => ( {
	DropdownMenu: ( { children } ) => (
		<div>{ children( { onClose: jest.fn() } ) }</div>
	),
	MenuGroup: ( { children } ) => <div>{ children }</div>,
	MenuItem: ( { children } ) => <div>{ children }</div>,
	MenuItemsChoice: ( { onSelect } ) => (
		<button onClick={ () => onSelect( 'Mobile' ) }>switch-to-mobile</button>
	),
	VisuallyHidden: ( { children } ) => <span>{ children }</span>,
	Icon: () => null,
} ) );

jest.mock( '@wordpress/interface', () => ( {
	ActionItem: {
		Slot: () => null,
	},
} ) );

jest.mock( '../../post-preview-button', () => () => null );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( value ) => value,
} ) );

describe( 'PreviewDropdown', () => {
	const editorDispatch = {
		setDeviceType: jest.fn(),
		setRenderingMode: jest.fn(),
		setDefaultRenderingMode: jest.fn(),
	};
	const blockEditorDispatch = {
		clearSelectedBlock: jest.fn(),
		resetZoomLevel: jest.fn(),
	};
	const registry = {
		select: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();

		useViewportMatch.mockImplementation( ( breakpoint, operator ) => {
			if ( breakpoint === 'mobile' && operator === '>=' ) {
				return true;
			}
			if ( breakpoint === 'medium' && operator === '>=' ) {
				return true;
			}
			if ( breakpoint === 'medium' && operator === '<' ) {
				return false;
			}
			return true;
		} );

		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( ( store ) => {
				if ( store === editorStore ) {
					return {
						getDeviceType: () => 'Desktop',
						getCurrentPostType: () => 'post',
						getCurrentTemplateId: () => null,
						getRenderingMode: () => 'template-locked',
						isListViewOpened: () => false,
					};
				}
				return {
					getEntityRecord: () => ( { home: 'https://example.com' } ),
					getPostType: () => ( { viewable: true } ),
					get: () => false,
				};
			} )
		);

		useDispatch.mockImplementation( ( store ) => {
			if ( store === editorStore ) {
				return editorDispatch;
			}
			if ( store === blockEditorStore ) {
				return blockEditorDispatch;
			}
			return {};
		} );

		registry.select.mockImplementation( ( store ) => {
			if ( store === editorStore ) {
				return {
					isListViewOpened: () => false,
				};
			}
			if ( store === blockEditorStore ) {
				return {
					getSelectedBlockClientId: () => 'client-1',
					isBlockHiddenAtViewport: () => true,
					isBlockParentHiddenAtViewport: () => false,
				};
			}
			return {};
		} );
		useRegistry.mockReturnValue( registry );
	} );

	it( 'deselects when list view is closed and selected block is hidden', async () => {
		const user = userEvent.setup();
		render( <PreviewDropdown /> );

		await user.click(
			screen.getByRole( 'button', { name: 'switch-to-mobile' } )
		);

		expect( blockEditorDispatch.clearSelectedBlock ).toHaveBeenCalledTimes(
			1
		);
		expect( editorDispatch.setDeviceType ).toHaveBeenCalledWith( 'Mobile' );
		expect( blockEditorDispatch.resetZoomLevel ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not deselect when list view is open', async () => {
		const user = userEvent.setup();
		registry.select.mockImplementation( ( store ) => {
			if ( store === editorStore ) {
				return {
					isListViewOpened: () => true,
				};
			}
			if ( store === blockEditorStore ) {
				return {
					getSelectedBlockClientId: () => 'client-1',
					isBlockHiddenAtViewport: () => true,
					isBlockParentHiddenAtViewport: () => false,
				};
			}
			return {};
		} );

		render( <PreviewDropdown /> );
		await user.click(
			screen.getByRole( 'button', { name: 'switch-to-mobile' } )
		);

		expect( blockEditorDispatch.clearSelectedBlock ).not.toHaveBeenCalled();
		expect( editorDispatch.setDeviceType ).toHaveBeenCalledWith( 'Mobile' );
		expect( blockEditorDispatch.resetZoomLevel ).toHaveBeenCalledTimes( 1 );
	} );
} );
