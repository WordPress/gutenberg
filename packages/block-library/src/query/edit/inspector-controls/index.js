/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useEffect, useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FILTERS_CONTROLS } from './filter-controls';
import { Columns } from './columns';
import { Order } from './order-control';
import { InheritFromTemplate } from './inherit-from-template';
import { PostType } from './post-type';
import { Sticky } from './sticky-control';

const INSPECTOR_CONTROLS = {
	InheritFromTemplate,
	PostType,
	Columns,
	Order,
	Sticky,
};

export default function QueryInspectorControls( props ) {
	const {
		attributes: { query, disabledInspectorControls },
		setQuery,
	} = props;

	const { inherit } = query;
	const [ querySearch, setQuerySearch ] = useState( query.search );
	const onChangeDebounced = useCallback(
		debounce( () => {
			if ( query.search !== querySearch ) {
				setQuery( { search: querySearch } );
			}
		}, 250 ),
		[ querySearch, query.search ]
	);
	useEffect( () => {
		onChangeDebounced();
		return onChangeDebounced.cancel;
	}, [ querySearch, onChangeDebounced ] );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					{ Object.entries( INSPECTOR_CONTROLS ).map(
						( [ key, Control ] ) =>
							disabledInspectorControls?.includes?.(
								key
							) ? null : (
								<Control { ...props } />
							)
					) }
				</PanelBody>
			</InspectorControls>
			{ ! inherit && (
				<InspectorControls>
					<ToolsPanel
						className="block-library-query-toolspanel__filters"
						label={ __( 'Filters' ) }
						resetAll={ () => {
							setQuery( {
								author: '',
								parents: [],
								search: '',
								taxQuery: null,
							} );
							setQuerySearch( '' );
						} }
					>
						{ Object.entries( FILTERS_CONTROLS ).map(
							( [ key, Control ] ) =>
								disabledInspectorControls?.includes?.(
									key
								) ? null : (
									<Control { ...props } />
								)
						) }
					</ToolsPanel>
				</InspectorControls>
			) }
		</>
	);
}
