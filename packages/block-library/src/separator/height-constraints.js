const MIN_PX_HEIGHT = 20;
const MIN_EM_HEIGHT = 1;
const MIN_REM_HEIGHT = 1;
const MAX_PX_HEIGHT = 500;
const MAX_EM_HEIGHT = 30;
const MAX_REM_HEIGHT = 30;

export const getHeightConstraints = ( minimumScale = 1 ) => {
	return {
		px: {
			min: minimumScale * MIN_PX_HEIGHT,
			max: MAX_PX_HEIGHT,
			default: minimumScale * MIN_PX_HEIGHT,
		},
		em: {
			min: minimumScale * MIN_EM_HEIGHT,
			max: MAX_EM_HEIGHT,
			default: 1,
		},
		rem: {
			min: minimumScale * MIN_REM_HEIGHT,
			max: MAX_REM_HEIGHT,
			default: 1,
		},
	};
};
