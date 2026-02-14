/**
 * WordPress dependencies
 */
import { registerBlockType, store as blocksStore } from '@wordpress/blocks';
import { useDisabled } from '@wordpress/compose';
import { select } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
import { useServerSideRender } from '@wordpress/server-side-render';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import HtmlRenderer from './html-renderer';

/**
 * Registers PHP-only blocks (server-side registered with auto_register flag)
 * with a ServerSideRender-based edit component so they are available in the editor.
 *
 * @param {string[]} blockNames Array of block names to register.
 */
export function registerPHPOnlyBlocks( blockNames ) {
	if ( ! blockNames?.length ) {
		return;
	}

	blockNames.forEach( ( blockName ) => {
		const bootstrappedBlockType = unlock(
			select( blocksStore )
		).getBootstrappedBlockType( blockName );

		registerBlockType( blockName, {
			// Use all metadata from PHP registration,
			// but fall back title to block name if not provided,
			// ensure minimum apiVersion 3 for block wrapper support,
			// and override with a ServerSideRender-based edit function.
			...bootstrappedBlockType,
			title: bootstrappedBlockType?.title || blockName,
			...( ( bootstrappedBlockType?.apiVersion ?? 0 ) < 3 && {
				apiVersion: 3,
			} ),
			// Inspector controls are rendered by the auto-register hook in block-editor
			edit: function Edit( { attributes } ) {
				const disabledRef = useDisabled();
				const blockProps = useBlockProps( { ref: disabledRef } );
				const { content, status, error } = useServerSideRender( {
					block: blockName,
					attributes,
				} );

				if ( status === 'loading' ) {
					return <div { ...blockProps }>{ __( 'Loading…' ) }</div>;
				}

				if ( status === 'error' ) {
					return (
						<div { ...blockProps }>
							{ sprintf(
								/* translators: %s: error message describing the problem */
								__( 'Error loading block: %s' ),
								error
							) }
						</div>
					);
				}

				return (
					<HtmlRenderer
						wrapperProps={ blockProps }
						html={ content }
					/>
				);
			},
			save: () => null,
		} );
	} );
}
