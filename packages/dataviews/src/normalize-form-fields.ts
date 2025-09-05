/**
 * Internal dependencies
 */
import type {
	Form,
	Layout,
	NormalizedLayout,
	NormalizedRegularLayout,
	NormalizedPanelLayout,
	NormalizedCardLayout,
} from './types';

interface NormalizedFormField {
	id: string;
	layout: Layout;
}

export const DEFAULT_LAYOUT: NormalizedLayout = {
	type: 'regular',
	labelPosition: 'top',
};

/**
 * Normalizes a layout configuration based on its type.
 *
 * @param layout The layout object to normalize.
 * @return The normalized layout object.
 */
export function normalizeLayout( layout?: Layout ): NormalizedLayout {
	let normalizedLayout = DEFAULT_LAYOUT;

	if ( layout?.type === 'regular' ) {
		normalizedLayout = {
			type: 'regular',
			labelPosition: layout?.labelPosition ?? 'top',
		} satisfies NormalizedRegularLayout;
	} else if ( layout?.type === 'panel' ) {
		normalizedLayout = {
			type: 'panel',
			labelPosition: layout?.labelPosition ?? 'side',
			openAs: layout?.openAs ?? 'dropdown',
		} satisfies NormalizedPanelLayout;
	} else if ( layout?.type === 'card' ) {
		if ( layout.withHeader === false ) {
			// Don't let isOpened be false if withHeader is false.
			// Otherwise, the card will not be visible.
			normalizedLayout = {
				type: 'card',
				withHeader: false,
				isOpened: true,
			} satisfies NormalizedCardLayout;
		} else {
			normalizedLayout = {
				type: 'card',
				withHeader: true,
				isOpened:
					typeof layout.isOpened === 'boolean'
						? layout.isOpened
						: true,
			} satisfies NormalizedCardLayout;
		}
	}

	return normalizedLayout;
}

export default function normalizeFormFields(
	form: Form
): NormalizedFormField[] {
	const formLayout = normalizeLayout( form?.layout );

	return ( form.fields ?? [] ).map( ( field ) => {
		if ( typeof field === 'string' ) {
			return {
				id: field,
				layout: formLayout,
			};
		}

		const fieldLayout = field.layout
			? normalizeLayout( field.layout )
			: formLayout;
		return {
			...field,
			layout: fieldLayout,
		};
	} );
}
