/**
 * External dependencies
 */
import { keyframes } from '@emotion/core';

export const appear = keyframes`
    from {
        transform: translateY(-2em) scaleY(0) scaleX(0);
    }
    to {
        transform: translateY(0%) scaleY(1) scaleX(1);
    }
`;

export const slideIn = keyframes`
    100% {
        transform: translateX(0%);
    }
`;

export const loading = keyframes`
    0% {
        opacity: 0.5;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0.5;
    }
`;
