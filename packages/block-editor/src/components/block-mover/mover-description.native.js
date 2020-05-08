/**
 * External dependencies
 */
import { I18nManager } from 'react-native';
/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { arrowUp, arrowDown, arrowLeft, arrowRight } from '@wordpress/icons';

const horizontalMover = {
	backwardButtonIcon: arrowLeft,
	forwardButtonIcon: arrowRight,
	backwardButtonHint: __( 'Double tap to move the block to the left' ),
	forwardButtonHint: __( 'Double tap to move the block to the right' ),
	firstBlockTitle: __( 'Move Block Left' ),
	lastBlockTitle: __( 'Move Block Right' ),
	/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	backwardButtonTitle: __(
		'Move block left from position %1$s to position %2$s'
	),
	/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	forwardButtonTitle: __(
		'Move block right from position %1$s to position %2$s'
	),
};

const verticalMover = {
	backwardButtonIcon: arrowUp,
	forwardButtonIcon: arrowDown,
	backwardButtonHint: __( 'Double tap to move the block up' ),
	forwardButtonHint: __( 'Double tap to move the block down' ),
	firstBlockTitle: __( 'Move Block Up' ),
	lastBlockTitle: __( 'Move Block Down' ),
	/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	backwardButtonTitle: __( 'Move block up from row %1$s to row %2$s' ),
	/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	forwardButtonTitle: __( 'Move block down from row %1$s to row %2$s' ),
};

const AVAILABLE_KEYS = [ 'description', 'icon', 'title', 'actionTitle' ];
const DEFAULT_KEYS = [ 'description', 'icon', 'title' ];

export function getMoversSetup(
	isStackedHorizontally,
	firstIndex,
	keys = DEFAULT_KEYS
) {
	return keys.reduce( ( setup, key ) => {
		if ( AVAILABLE_KEYS.includes( key ) ) {
			Object.assign( setup, {
				[ key ]: getKeySetup( key, isStackedHorizontally, firstIndex ),
			} );
		}
		return setup;
	}, {} );
}

function getKeySetup( key, isStackedHorizontally, firstIndex ) {
	switch ( key ) {
		case 'description':
			return getMoverDescription( isStackedHorizontally );

		case 'icon':
			return {
				prev: getArrowIcon( true, isStackedHorizontally ),
				next: getArrowIcon( false, isStackedHorizontally ),
			};

		case 'title':
			return parseInt( firstIndex ) >= 0
				? {
						prev: getMoverButtonTitle(
							true,
							firstIndex,
							isStackedHorizontally
						),
						next: getMoverButtonTitle(
							false,
							firstIndex,
							isStackedHorizontally
						),
				  }
				: {};

		case 'actionTitle':
			return {
				prev: getMoverActionTitle( true, isStackedHorizontally ),
				next: getMoverActionTitle( false, isStackedHorizontally ),
			};

		default:
			return {};
	}
}

function switchButtonPropIfRTL(
	isBackwardButton,
	forwardButtonProp,
	backwardButtonProp,
	isStackedHorizontally
) {
	if ( I18nManager.isRTL && isStackedHorizontally ) {
		// for RTL and horizontal direction switch prop between forward and backward button
		if ( isBackwardButton ) {
			return forwardButtonProp; // set forwardButtonProp for backward button
		}
		return backwardButtonProp; // set backwardButtonProp for forward button
	}

	return isBackwardButton ? backwardButtonProp : forwardButtonProp;
}

function getMoverDescription( isStackedHorizontally ) {
	return isStackedHorizontally ? horizontalMover : verticalMover;
}

function getArrowIcon( isBackwardButton, isStackedHorizontally ) {
	const { forwardButtonIcon, backwardButtonIcon } = getMoverDescription(
		isStackedHorizontally
	);

	const arrowIcon = switchButtonPropIfRTL(
		isBackwardButton,
		forwardButtonIcon,
		backwardButtonIcon,
		isStackedHorizontally
	);

	return arrowIcon;
}

function getMoverActionTitle( isBackwardButton, isStackedHorizontally ) {
	const { firstBlockTitle, lastBlockTitle } = getMoverDescription(
		isStackedHorizontally
	);

	const actionTitle = switchButtonPropIfRTL(
		isBackwardButton,
		lastBlockTitle,
		firstBlockTitle,
		isStackedHorizontally
	);

	return sprintf( actionTitle, firstBlockTitle );
}

function getMoverButtonTitle(
	isBackwardButton,
	firstIndex,
	isStackedHorizontally
) {
	const fromIndex = firstIndex + 1; // current position based on index
	// for backwardButton decrease index (move left/up) for forwardButton increase index (move right/down)
	const direction = isBackwardButton ? -1 : 1;
	const toIndex = fromIndex + direction; // position after move

	const { backwardButtonTitle, forwardButtonTitle } = getMoverDescription(
		isStackedHorizontally
	);

	const buttonTitle = switchButtonPropIfRTL(
		isBackwardButton,
		forwardButtonTitle,
		backwardButtonTitle,
		isStackedHorizontally
	);

	return sprintf( buttonTitle, fromIndex, toIndex );
}
