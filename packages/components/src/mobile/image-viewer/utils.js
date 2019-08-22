
export function calculateFullscreenImageSize( image, container ) {
    const screenRatio = container.width / container.height;
    const imageRatio = image.width / image.height;
    let width = container.width;
    let height = container.height;
    const shouldUseContainerHeightForImage = imageRatio < screenRatio
    if (shouldUseContainerHeightForImage) {
        width = container.height * imageRatio;
    } else {
        height = container.width / imageRatio;
    }
    return { width, height };
}