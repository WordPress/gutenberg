/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import useSiteEditorSettings from '../use-site-editor-settings';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

const noop = () => {};

export default function ContentBlockEditorProvider( { children } ) {
	const defaultSettings = useSiteEditorSettings();
	const settings = useMemo( () => {
		return {
			...defaultSettings,
		};
	}, [ defaultSettings ] );

	const blocks = useMemo( () => {
		return [
			createBlock(
				'core/group',
				{
					layout: { type: 'constrained' },
					style: {
						spacing: {
							margin: {
								top: '4em',
							},
						},
					},
				},
				[
					createBlock( 'core/post-title' ),
					createBlock( 'core/post-content' ),
				]
			),
		];
	}, [] );

	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ noop }
			onChange={ noop }
			useSubRegistry={ false }
		>
			{ children }
		</ExperimentalBlockEditorProvider>
	);
}
