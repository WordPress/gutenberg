/**
 * WordPress dependencies
 */
import { applyFormat } from '@wordpress/rich-text';
import { addFilter } from '@wordpress/hooks';
import { withSelect } from '@wordpress/data';

const name = 'core/invisible';

export const invisible = {
	name,
	title: 'invisible',
	tagName: 'mark',
	className: 'invisible',
	// Possible to remove?
	prepareEditableTree: true,
};

function withPrepareEditableTree( OriginalComponent ) {
	return withSelect( ( select ) => ( {
		isEnabled: select( 'core/edit-post' ).getActiveGeneralSidebarName() === 'edit-post/block',
	} ) )( ( props ) => (
		<OriginalComponent
			{ ...props }
			propsToCheck={ [
				...( props.propsToCheck || [] ),
				'isEnabled',
			] }
			prepareEditableTree={ [
				...( props.prepareEditableTree || [] ),
				( formats, text ) => {
					if ( ! props.isEnabled ) {
						return formats;
					}

					const search = 'Gutenberg';
					const index = text.indexOf( search );

					if ( index === -1 ) {
						return formats;
					}

					const start = index;
					const end = index + search.length;

					const newValue = applyFormat( { text, formats }, { type: name }, start, end );

					return newValue.formats;
				},
			] }
		/>
	) );
}

addFilter( 'RichText', 'my-plugin/with-rich-text-hoc', withPrepareEditableTree );
