import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useAsyncList, useInstanceId } from '@wordpress/compose';
import {
	forwardRef,
	memo,
	useRef,
	useLayoutEffect,
	useMemo,
} from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import HtmlRenderer from '../../../utils/html-renderer';
import { groupIconsByCollection } from './utils';

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

export default function IconGrid( { icons, onChange, value, collections } ) {
	const instanceId = useInstanceId(
		IconGrid,
		'wp-block-icon__inserter-grid'
	);

	const { groups, orderedIcons } = useMemo( () => {
		if ( ! icons?.length || ! collections ) {
			return { groups: null, orderedIcons: icons };
		}
		const iconGroups = groupIconsByCollection( icons, collections );
		return {
			groups: iconGroups,
			orderedIcons: iconGroups.flatMap( ( group ) => group.icons ),
		};
	}, [ icons, collections ] );

	const shownIcons = useAsyncList( orderedIcons, {
		step: BATCH_SIZE,
	} );

	// Scroll the selected icon into view, but wait until enough icons render
	// below it so it can be centered rather than stuck at the bottom. Skip it
	// if the user has already scrolled the list.
	const selectedIconRef = useRef();
	const selectedIndex =
		orderedIcons?.findIndex( ( icon ) => icon.name === value ) ?? -1;
	const isReadyToScroll =
		selectedIndex >= 0 &&
		( shownIcons.length >= selectedIndex + BATCH_SIZE ||
			shownIcons.length === orderedIcons.length );

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

	const renderIcons = ( iconsToRender ) => (
		<div className="wp-block-icon__inserter-grid-icons-list">
			{ iconsToRender.map( ( icon ) => (
				<IconGridItem
					key={ icon.name }
					ref={ icon.name === value ? selectedIconRef : undefined }
					icon={ icon }
					isSelected={ icon.name === value }
					onChange={ onChange }
				/>
			) ) }
		</div>
	);

	const renderGroups = () => {
		let offset = 0;
		return groups.map( ( group ) => {
			const start = offset;
			offset += group.icons.length;
			// Show this group's icons, as many as have loaded so far.
			const shownGroupIcons = group.icons.slice(
				0,
				Math.max( 0, shownIcons.length - start )
			);
			if ( ! shownGroupIcons.length ) {
				return null;
			}
			const headingId = `${ instanceId }-${ group.slug }`;
			return (
				<div
					key={ group.slug }
					role="group"
					aria-labelledby={ headingId }
				>
					<h2
						id={ headingId }
						className="wp-block-icon__inserter-grid-group-title"
					>
						{ group.label }
					</h2>
					{ renderIcons( shownGroupIcons ) }
				</div>
			);
		} );
	};

	if ( ! icons?.length ) {
		return (
			<div className="wp-block-icon__inserter-grid">
				<div className="wp-block-icon__inserter-grid-no-results">
					<p>{ __( 'No results found.' ) }</p>
				</div>
			</div>
		);
	}

	return (
		<div className="wp-block-icon__inserter-grid">
			{ groups ? renderGroups() : renderIcons( shownIcons ) }
		</div>
	);
}
