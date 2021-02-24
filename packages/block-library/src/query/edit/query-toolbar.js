/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	Dropdown,
	ToolbarButton,
	BaseControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import {
	BlockAlignmentToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useInstanceId } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { settings, list, grid } from '@wordpress/icons';

export default function QueryToolbar( {
	clientId,
	attributes: { query, layout },
	setQuery,
	setLayout,
} ) {
	const maxPageInputId = useInstanceId(
		QueryToolbar,
		'blocks-query-pagination-max-page-input'
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { queryLoops } = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const blocks = getBlocks( clientId );
			const _queryLoops = blocks?.filter(
				( { name } ) => name === 'core/query-loop'
			);
			return {
				queryLoops: _queryLoops,
			};
		},
		[ clientId ]
	);

	const layoutControls = [
		{
			icon: list,
			title: __( 'List view' ),
			onClick: () => setLayout( { type: 'list' } ),
			isActive: layout?.type === 'list',
		},
		{
			icon: grid,
			title: __( 'Grid view' ),
			onClick: () =>
				setLayout( { type: 'flex', columns: layout?.columns || 3 } ),
			isActive: layout?.type === 'flex',
		},
	];
	// Updates the `align` property in `QueryLoop` InnerBlocks all at once.
	// This is usually just one instance though, as it doesn't make sense to
	// have more than one `QueryLoop` in each `Query` block.
	const updateAlignment = ( newValue ) => {
		queryLoops.forEach( ( queryLoop ) => {
			updateBlockAttributes( queryLoop.clientId, { align: newValue } );
		} );
	};
	return (
		<>
			{ ! query.inherit && (
				<ToolbarGroup>
					<Dropdown
						contentClassName="block-library-query-toolbar__popover"
						renderToggle={ ( { onToggle } ) => (
							<ToolbarButton
								icon={ settings }
								label={ __( 'Display settings' ) }
								onClick={ onToggle }
							/>
						) }
						renderContent={ () => (
							<>
								<BaseControl>
									<NumberControl
										__unstableInputWidth="60px"
										label={ __( 'Items per Page' ) }
										labelPosition="edge"
										min={ 1 }
										max={ 100 }
										onChange={ ( value ) =>
											setQuery( {
												perPage: +value ?? -1,
											} )
										}
										step="1"
										value={ query.perPage }
										isDragEnabled={ false }
									/>
								</BaseControl>
								<BaseControl>
									<NumberControl
										__unstableInputWidth="60px"
										label={ __( 'Offset' ) }
										labelPosition="edge"
										min={ 0 }
										max={ 100 }
										onChange={ ( value ) =>
											setQuery( { offset: +value } )
										}
										step="1"
										value={ query.offset }
										isDragEnabled={ false }
									/>
								</BaseControl>
								<BaseControl
									id={ maxPageInputId }
									help={ __(
										'Limit the pages you want to show, even if the query has more results. To show all pages use 0 (zero).'
									) }
								>
									<NumberControl
										id={ maxPageInputId }
										__unstableInputWidth="60px"
										label={ __( 'Max page to show' ) }
										labelPosition="edge"
										min={ 0 }
										onChange={ ( value ) =>
											setQuery( { pages: +value } )
										}
										step="1"
										value={ query.pages }
										isDragEnabled={ false }
									/>
								</BaseControl>
							</>
						) }
					/>
				</ToolbarGroup>
			) }
			{ !! queryLoops?.length && (
				<BlockAlignmentToolbar
					value={ queryLoops[ 0 ].attributes.align }
					onChange={ updateAlignment }
					controls={ [ 'wide', 'full' ] }
				/>
			) }
			<ToolbarGroup controls={ layoutControls } />
		</>
	);
}
