import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useCallback, useState } from '@wordpress/element';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import SpacerEdit from '../edit';

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		useBlockProps: Object.assign(
			vi.fn( ( props ) => props ),
			{
				save: original.useBlockProps.save,
			}
		),
		useBlockEditingMode: () => 'disabled',
	};
} );

vi.mock( import( '../controls' ), () => ( { default: () => <></> } ) );

const ROW = { type: 'flex' };
const STACK = { type: 'flex', orientation: 'vertical' };
const FLOW = { type: 'default' };

type SpacerAttributes = {
	height?: string;
	width?: string;
	style?: {
		spacing?: { margin: { top: string } };
		layout?: {
			selfStretch?: string;
			flexSize?: string;
			columnSpan?: number;
		};
	};
};
type ParentLayout = { type: string; orientation?: string };

describe( 'Spacer layout sizes', () => {
	let registry: ReturnType< typeof createRegistry >;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );
		registry.dispatch( blockEditorStore ).updateSettings( {
			__experimentalFeatures: {
				spacing: {
					spacingSizes: {
						theme: [ { slug: '40', size: '2rem', name: 'Medium' } ],
					},
				},
			},
		} );
	} );

	function renderSpacer(
		initialAttributes: SpacerAttributes,
		initialLayout: ParentLayout = ROW
	) {
		let attributes = initialAttributes;
		const onChange = vi.fn();

		function Fixture( { parentLayout }: { parentLayout: ParentLayout } ) {
			const [ currentAttributes, setCurrentAttributes ] =
				useState< SpacerAttributes >( {
					height: '100px',
					...initialAttributes,
				} );
			attributes = currentAttributes;
			const setAttributes = useCallback(
				( changes: SpacerAttributes ) => {
					onChange( changes );
					setCurrentAttributes( ( current ) => {
						if (
							(
								Object.keys(
									changes
								) as ( keyof SpacerAttributes )[]
							 ).every(
								( key ) => current[ key ] === changes[ key ]
							)
						) {
							return current;
						}
						return { ...current, ...changes };
					} );
				},
				[]
			);

			return (
				<SpacerEdit
					attributes={ currentAttributes }
					setAttributes={ setAttributes }
					isSelected={ false }
					toggleSelection={ vi.fn() }
					className=""
					context={ {} }
					__unstableParentLayout={ parentLayout }
				/>
			);
		}

		const element = ( parentLayout: ParentLayout ) => (
			<RegistryProvider value={ registry }>
				<Fixture parentLayout={ parentLayout } />
			</RegistryProvider>
		);
		const view = render( element( initialLayout ) );
		return {
			getAttributes: () => attributes,
			onChange,
			setLayout: ( layout: ParentLayout ) =>
				view.rerender( element( layout ) ),
		};
	}

	it.each< [ SpacerAttributes, string ] >( [
		[ {}, '100px' ],
		[ { height: '3rem' }, '3rem' ],
		[ { height: 'var:preset|spacing|40' }, '2rem' ],
		[ { height: '3rem', width: '80px' }, '80px' ],
	] )(
		'uses the original size before clearing the row height: %j',
		( attributes, size ) => {
			const view = renderSpacer( attributes );
			expect( view.getAttributes() ).toMatchObject( {
				height: '0px',
				width: '0px',
				style: { layout: { selfStretch: 'fixed', flexSize: size } },
			} );
			expect( view.onChange ).toHaveBeenCalledTimes( 1 );
		}
	);

	it.each( [ 'fixed', 'fixedNoShrink' ] )(
		'clears an existing %s row height without changing its flex size',
		( selfStretch ) => {
			const style = {
				spacing: { margin: { top: '1rem' } },
				layout: { selfStretch, flexSize: '80px', columnSpan: 2 },
			};
			const view = renderSpacer( { style } );
			expect( view.getAttributes() ).toMatchObject( {
				height: '0px',
				style,
			} );
			expect( view.onChange ).toHaveBeenCalledExactlyOnceWith( {
				height: '0px',
			} );
			view.setLayout( { ...ROW } );
			expect( view.onChange ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( 'clears a retained height when a fixed Stack spacer moves to a Row', () => {
		const style = {
			layout: { selfStretch: 'fixedNoShrink', flexSize: '4rem' },
		};
		const view = renderSpacer( { height: '100px', style }, STACK );
		expect( view.onChange ).not.toHaveBeenCalled();
		view.setLayout( ROW );
		expect( view.getAttributes() ).toMatchObject( {
			height: '0px',
			style,
		} );
		view.setLayout( STACK );
		expect( view.getAttributes().style?.layout?.flexSize ).toBe( '4rem' );
		view.setLayout( FLOW );
		expect( view.getAttributes() ).toMatchObject( {
			height: '4rem',
			style: { layout: { selfStretch: undefined, flexSize: undefined } },
		} );
	} );

	it.each( [ 'fill', 'fit' ] )(
		'retains the existing %s attribute handling',
		( selfStretch ) => {
			const view = renderSpacer( {
				width: '80px',
				style: { layout: { selfStretch } },
			} );
			expect( view.getAttributes() ).toMatchObject( {
				height: '100px',
				width: undefined,
				style: { layout: { selfStretch } },
			} );
		}
	);

	it( 'leaves a standalone spacer height unchanged', () => {
		const view = renderSpacer( { height: '3rem' }, FLOW );
		expect( view.getAttributes().height ).toBe( '3rem' );
		expect( view.onChange ).not.toHaveBeenCalled();
	} );
} );
