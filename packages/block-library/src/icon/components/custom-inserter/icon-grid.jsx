import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';
import { forwardRef, memo, useRef, useLayoutEffect } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import HtmlRenderer from '../../../utils/html-renderer';

const BATCH_SIZE = 20;

// Memoized so each async batch renders only the newly added icons.
const IconGridItem = memo(
	forwardRef( function IconGridItemContent(
		{ icon, isSelected, onChange },
		ref
	) {
		return (
			<Button
				ref={ ref }
				className="wp-block-icon__inserter-grid-icons-list-item"
				onClick={ () => onChange( icon.name ) }
				variant={ isSelected ? 'primary' : undefined }
				__next40pxDefaultSize
			>
				<span className="wp-block-icon__inserter-grid-icons-list-item-icon">
					<HtmlRenderer html={ icon.content } />
				</span>
				<span className="wp-block-icon__inserter-grid-icons-list-item-title">
					{ icon.label }
				</span>
			</Button>
		);
	} )
);

export default function IconGrid( { icons, onChange, value } ) {
	const shownIcons = useAsyncList( icons, {
		step: BATCH_SIZE,
	} );

	// Scroll the selected icon into view, but wait until enough icons render
	// below it so it can be centered rather than stuck at the bottom. Skip it
	// if the user has already scrolled the list.
	const selectedIconRef = useRef();
	const selectedIndex =
		icons?.findIndex( ( icon ) => icon.name === value ) ?? -1;
	const isReadyToScroll =
		selectedIndex >= 0 &&
		( shownIcons.length >= selectedIndex + BATCH_SIZE ||
			shownIcons.length === icons.length );

	useLayoutEffect( () => {
		const node = selectedIconRef.current;
		if ( ! isReadyToScroll || ! node ) {
			return;
		}
		if ( getScrollContainer( node )?.scrollTop ) {
			return;
		}
		node.scrollIntoView( { block: 'center' } );
	}, [ isReadyToScroll ] );

	return (
		<div className="wp-block-icon__inserter-grid">
			{ ! icons?.length ? (
				<div className="wp-block-icon__inserter-grid-no-results">
					<p>{ __( 'No results found.' ) }</p>
				</div>
			) : (
				<div
					className="wp-block-icon__inserter-grid-icons-list"
					aria-label={ __( 'Icon library' ) }
				>
					{ shownIcons.map( ( icon ) => (
						<IconGridItem
							key={ icon.name }
							ref={
								icon.name === value
									? selectedIconRef
									: undefined
							}
							icon={ icon }
							isSelected={ icon.name === value }
							onChange={ onChange }
						/>
					) ) }
				</div>
			) }
		</div>
	);
}
