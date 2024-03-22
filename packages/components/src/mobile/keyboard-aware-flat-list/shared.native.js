/**
 * External dependencies
 */
import { Platform } from 'react-native';

export const OPTIMIZATION_PROPS = {
	// Only enabled for iOS
	removeClippedSubviews: Platform.OS === 'ios',
	windowSize: 11,
};

export const OPTIMIZATION_ITEMS_THRESHOLD = 30;
