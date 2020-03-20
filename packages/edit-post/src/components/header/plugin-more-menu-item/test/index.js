/**
 * External dependencies
 */
import { noop } from 'lodash';
import ReactTestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { more } from '@wordpress/icons';
import { RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import PluginMoreMenuItem from '../';
import PluginsMoreMenuGroup from '../../plugins-more-menu-group';

describe( 'PluginMoreMenuItem', () => {
	const fillProps = {
		onClose: noop,
	};

	const mockStores = {
		'core/editor': {
			getCurrentPostType: jest.fn(),
		},
	};
	const registry = {
		select: jest
			.fn()
			.mockImplementation( ( storeName ) => mockStores[ storeName ] ),
		dispatch: jest
			.fn()
			.mockImplementation( ( storeName ) => mockStores[ storeName ] ),
		subscribe: jest.fn(),
	};

	const setMockReturnValue = ( store, functionName, value ) => {
		mockStores[ store ][ functionName ] = jest
			.fn()
			.mockReturnValue( value );
	};

	test( 'renders menu item as button properly', () => {
		setMockReturnValue( 'core/editor', 'getCurrentPostType', '' );
		const component = ReactTestRenderer.create(
			<RegistryProvider value={ registry }>
				<SlotFillProvider>
					<PluginMoreMenuItem icon={ more }>
						My plugin button menu item
					</PluginMoreMenuItem>
					<PluginsMoreMenuGroup.Slot fillProps={ fillProps } />
				</SlotFillProvider>
			</RegistryProvider>
		);

		expect( component.toJSON() ).toMatchSnapshot();
	} );

	test( 'Handles editorContext props', () => {
		setMockReturnValue( 'core/editor', 'getCurrentPostType', 'post' );
		const component = ReactTestRenderer.create(
			<RegistryProvider value={ registry }>
				<SlotFillProvider>
					<PluginMoreMenuItem icon={ more }>
						{ ( props ) => {
							return (
								<>{ `Post Type: ${ props.currentPostType }` }</>
							);
						} }
					</PluginMoreMenuItem>
					<PluginsMoreMenuGroup.Slot fillProps={ fillProps } />
				</SlotFillProvider>
			</RegistryProvider>
		);

		expect( component.toJSON() ).toMatchSnapshot();
	} );

	test( 'renders menu item as link properly', () => {
		setMockReturnValue( 'core/editor', 'getCurrentPostType', '' );
		const url = 'https://make.wordpress.org';
		const component = ReactTestRenderer.create(
			<RegistryProvider value={ registry }>
				<SlotFillProvider>
					<PluginMoreMenuItem icon={ more } href={ url }>
						My plugin link menu item
					</PluginMoreMenuItem>
					<PluginsMoreMenuGroup.Slot fillProps={ fillProps } />
				</SlotFillProvider>
			</RegistryProvider>
		);

		expect( component.root.findByType( 'a' ).props.href ).toBe( url );
	} );
} );
