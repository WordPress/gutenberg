/**
 * WordPress dependencies
 */
import { useEffect, useLayoutEffect } from '@wordpress/element';

export default typeof window !== 'undefined' ? useLayoutEffect : useEffect;
