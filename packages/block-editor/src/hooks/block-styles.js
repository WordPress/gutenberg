/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import BlockStyles from '../components/block-styles';
import DefaultStylePicker from '../components/default-style-picker';

export const withInspectorControls = createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const { name, clientId, isSelected } = props;

		const hasBlockStyles = useSelect(
			( select ) => select( blocksStore ).getBlockStyles( name ),
			[ name ]
		);

		if ( ! isSelected ) {
			return <WrappedComponent { ...props } />;
		}

		if ( ! hasBlockStyles?.length ) {
			return <WrappedComponent { ...props } />;
		}

		return (
			<Fragment>
				<InspectorControls>
					<div>
						<PanelBody title={ __( 'Styles' ) }>
							<BlockStyles clientId={ clientId } />
							{ hasBlockSupport(
								name,
								'defaultStylePicker',
								true
							) && <DefaultStylePicker blockName={ name } /> }
						</PanelBody>
					</div>
				</InspectorControls>

				<WrappedComponent { ...props } />
			</Fragment>
		);
	},
	'withInspectorControls'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/block-styles/with-inspector-controls',
	withInspectorControls,
	20
);
