/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import InspectorControlsQueryFilters from './edit/inspector-controls/filters-slot';

const CreateNewPostLink = ( {
	attributes: { query: { postType } = {} } = {},
} ) => {
	if ( ! postType ) return null;
	const newPostUrl = addQueryArgs( 'post-new.php', {
		post_type: postType,
	} );
	return (
		<div className="wp-block-query__create-new-link">
			{ createInterpolateElement(
				__( '<a>Create a new post</a> for this feed.' ),
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				{ a: <a href={ newPostUrl } /> }
			) }
		</div>
	);
};

/**
 * Override the default edit UI to include layout controls
 *
 * @param {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
const queryTopInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const {
			name,
			isSelected,
			attributes: { namespace },
		} = props;
		if ( name !== 'core/query' || ! isSelected ) {
			return <BlockEdit key="edit" { ...props } />;
		}

		// TODO: Remove all :).
		const addExtraControls = namespace === 'wp/query/products';
		return (
			<>
				<InspectorControls>
					<CreateNewPostLink { ...props } />
				</InspectorControls>
				{ addExtraControls && (
					<>
						<InspectorControlsQueryFilters>
							<TestControl { ...props } />
						</InspectorControlsQueryFilters>
					</>
				) }
				<BlockEdit key="edit" { ...props } />
			</>
		);
	},
	'withInspectorControls'
);

function TestControl( { clientId } ) {
	return (
		<ToolsPanelItem
			panelId={ clientId }
			label={ __( 'Demo control' ) }
			hasValue={ () => false }
			onDeselect={ () => {} }
			resetAllFilter={ ( props ) => console.log( props ) }
		>
			<ToggleControl
				label={ __( 'Get products on sale' ) }
				checked={ false }
				onChange={ () => {} }
			/>
		</ToolsPanelItem>
	);
}

export default queryTopInspectorControls;
