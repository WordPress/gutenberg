/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import slugFromLabel from './slug-from-label';

function StaticLabel( { label, index } ) {
	if ( label ) {
		return (
			<span>
				<RawHTML>{ decodeEntities( label ) }</RawHTML>
			</span>
		);
	}
	return (
		<span>
			{ sprintf(
				/* translators: %d is the tab index + 1 */
				__( 'Tab %d' ),
				index + 1
			) }
		</span>
	);
}

export default function TabsList( {
	siblingTabs,
	currentClientId,
	currentBlockIndex,
	currentLabel,
	tabItemColorProps,
	onSelectTab,
	onLabelChange,
	labelRef,
	focusRef,
	labelElementRef,
} ) {
	return (
		<div role="tablist" className="tabs__list">
			{ siblingTabs.map( ( tab, index ) => {
				const isCurrentTab = tab.clientId === currentClientId;
				const isSiblingTabActive = index === currentBlockIndex;
				const tabAttributes = tab.attributes || {};
				const siblingLabel = tabAttributes.label || '';
				const siblingAnchor =
					tabAttributes.anchor ||
					slugFromLabel( siblingLabel, index );
				const siblingTabPanelId = siblingAnchor;
				const siblingTabLabelId = `${ siblingTabPanelId }--tab`;

				return (
					<button
						key={ tab.clientId }
						aria-controls={ siblingTabPanelId }
						aria-selected={ isSiblingTabActive }
						id={ siblingTabLabelId }
						role="tab"
						className={ clsx(
							'tabs__tab-label',
							tabItemColorProps.className
						) }
						style={ {
							...tabItemColorProps.style,
						} }
						tabIndex={ isSiblingTabActive ? 0 : -1 }
						onClick={ ( event ) => {
							event.preventDefault();
							onSelectTab( tab.clientId );
						} }
						onKeyDown={ ( event ) => {
							// If shift is also pressed, do not select the block.
							if ( event.key === 'Enter' && ! event.shiftKey ) {
								event.preventDefault();
								onSelectTab( tab.clientId );
								if ( isCurrentTab ) {
									const { requestAnimationFrame } = window;
									focusRef.current = requestAnimationFrame(
										() => {
											labelElementRef.current?.focus();
										}
									);
								}
							}
						} }
					>
						{ isCurrentTab ? (
							<RichText
								ref={ labelRef }
								tagName="span"
								withoutInteractiveFormatting
								placeholder={ sprintf(
									/* translators: %d is the tab index + 1 */
									__( 'Tab %d…' ),
									currentBlockIndex + 1
								) }
								value={ decodeEntities( currentLabel ) }
								onChange={ onLabelChange }
							/>
						) : (
							<StaticLabel
								label={ siblingLabel }
								index={ index }
							/>
						) }
					</button>
				);
			} ) }
		</div>
	);
}
