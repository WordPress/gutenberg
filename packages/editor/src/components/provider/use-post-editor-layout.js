/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSettings } from '@wordpress/block-editor';

export function usePostEditorLayout( templatePostContentBlock ) {
	const [ globalStylesLayout ] = useSettings( 'layout' );
	const { layout: templateLayoutDefinition } =
		templatePostContentBlock?.attributes ?? {};
	const layout = useMemo( () => {
		if ( ! templateLayoutDefinition ) {
			return globalStylesLayout;
		}
		return templateLayoutDefinition &&
			( templateLayoutDefinition?.type === 'constrained' ||
				templateLayoutDefinition?.inherit ||
				templateLayoutDefinition?.contentSize ||
				templateLayoutDefinition?.wideSize )
			? {
					...globalStylesLayout,
					...templateLayoutDefinition,
					type: 'constrained',
			  }
			: { ...globalStylesLayout, ...layout, type: 'default' };
	}, [ templateLayoutDefinition, globalStylesLayout ] );

	return layout;
}
