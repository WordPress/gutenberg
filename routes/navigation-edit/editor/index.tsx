/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { BlockEditorProvider } from '@wordpress/block-editor';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { createBlock } from '@wordpress/blocks';
import { Spinner } from '@wordpress/components';
import { useEditorAssets } from '@wordpress/lazy-editor';

/**
 * Internal dependencies
 */
import './style.scss';
import NavigationMenuContent from './content';

const noop = () => {};

export default function NavigationMenuEditor( { id }: { id: number } ) {
	const { isReady: assetsReady } = useEditorAssets();

	const blocks = useMemo( () => {
		if ( ! assetsReady || ! id ) {
			return [];
		}

		return [ createBlock( 'core/navigation', { ref: id } ) ];
	}, [ assetsReady, id ] );

	if ( ! assetsReady || ! blocks.length ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				} }
			>
				<Spinner />
			</div>
		);
	}

	return (
		<BlockEditorProvider
			settings={ {} }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<NavigationMenuContent rootClientId={ blocks[ 0 ].clientId } />
		</BlockEditorProvider>
	);
}
