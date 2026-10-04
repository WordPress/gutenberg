import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';
import { useRef, useLayoutEffect } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import HtmlRenderer from '../../../utils/html-renderer';

const BATCH_SIZE = 20;

export default function IconGrid( { icons, onChange, value, collections } ) {
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
					{ shownIcons.map( ( icon ) => {
						const isSelected = icon.name === value;

						const collectionLabel = collections?.find(
							( { slug } ) => slug === icon.collection
						)?.label;
						return (
							<Button
								key={ icon.name }
								ref={ isSelected ? selectedIconRef : undefined }
								className={ clsx(
									'wp-block-icon__inserter-grid-icons-list-item',
									{ 'is-selected': isSelected }
								) }
								onClick={ () => onChange( icon.name ) }
								variant={ isSelected ? 'primary' : undefined }
								aria-label={
									collectionLabel
										? sprintf(
												/* translators: 1: Icon label. 2: Icon collection label. */
												__( '%1$s (%2$s)' ),
												icon.label,
												collectionLabel
											)
										: undefined
								}
								__next40pxDefaultSize
							>
								<span className="wp-block-icon__inserter-grid-icons-list-item-icon">
									<HtmlRenderer html={ icon.content } />
								</span>
								<span className="wp-block-icon__inserter-grid-icons-list-item-title">
									{ icon.label }
								</span>
								{ collectionLabel && (
									<span className="wp-block-icon__inserter-grid-icons-list-item-collection">
										{ collectionLabel }
									</span>
								) }
							</Button>
						);
					} ) }
				</div>
			) }
		</div>
	);
}
