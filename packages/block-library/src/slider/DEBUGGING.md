# Slider Block - Debugging Guide

## Current Status ✅

All code is complete and built. The slider should now work!

### What Was Fixed:

1. ✅ **CSS scroll-snap alignment** - Changed from `center` to `start`
2. ✅ **Added debug logging** - Console logs to help troubleshoot
3. ✅ **Fixed save.js** - All blocks now properly save inner content
4. ✅ **Editor styles** - Slides show side-by-side in editor for easier editing
5. ✅ **Built successfully** - All files compiled to build-module/

## Testing Instructions

### 1. Start Fresh

```bash
# Restart wp-env
cd /Users/karolm/automattic/repositories/gutenberg
npm run wp-env restart

# Access WordPress
# Go to: http://localhost:8888
# Admin: http://localhost:8888/wp-admin
# User: admin
# Pass: password
```

### 2. Enable Experimental Blocks

Add to `wp-config.php`:
```php
define( 'GUTENBERG_ENABLE_BLOCK_EXPERIMENTS', true );
```

Or in browser console (temporary):
```javascript
window.__experimentalEnableBlockExperiments = true
// Then refresh page
```

### 3. Insert Slider Block

1. Create or edit a post
2. Click `+` to add block
3. Search for "Slider"
4. Insert the block

### 4. Add Content to Slides

1. Click inside each slide
2. Add paragraphs, images, or any content
3. Save the post

### 5. Test on Frontend

1. **View the published post** (not in editor)
2. **Open Browser DevTools** (F12)
3. **Check Console tab** for debug logs

### 6. Click Arrow Buttons

You should see console logs like:
```
nextSlide called, ref: <button>
slider: <div.wp-block-slider> track: <div.wp-block-slider-track>
Scrolling by 1200 current scrollLeft: 0
```

The slide should scroll smoothly to the next one!

## Debug Checklist

If arrows still don't work, check:

### ✅ Console Tab:
```javascript
// 1. Check if Interactivity API loaded
window.wp?.interactivity
// Should show: Object with store, getContext, etc.

// 2. Check if slider store exists
window.wp?.interactivity?.store('core/slider')
// Should show the store object

// 3. Test manually
const btn = document.querySelector('.wp-block-slider-controls__next');
btn?.click();
// Should see console logs

// 4. Check track can scroll
const track = document.querySelector('.wp-block-slider-track');
console.log('ScrollWidth:', track?.scrollWidth);
console.log('ClientWidth:', track?.clientWidth);
console.log('Overflow:', getComputedStyle(track).overflowX);
// ScrollWidth should be > ClientWidth
// Overflow should be "scroll"
```

### ✅ Network Tab:
- Look for `slider/view.mjs` - should load successfully
- Status should be 200 (not 404)

### ✅ Elements Tab:
Inspect the HTML - should look like:
```html
<div class="wp-block-slider" data-wp-interactive="core/slider">
  <div class="wp-block-slider-controls">
    <button class="wp-block-slider-controls__previous"
            data-wp-on--click="actions.prevSlide"
            data-wp-bind--disabled="state.isAtStart">
    <button class="wp-block-slider-controls__next"
            data-wp-on--click="actions.nextSlide"
            data-wp-bind--disabled="state.isAtEnd">
  </div>
  <div class="wp-block-slider-track"
       data-wp-context='{"currentIndex":0,"totalSlides":3}'
       data-wp-on--scroll="actions.handleScroll"
       data-wp-init="callbacks.initTrack">
    <div class="wp-block-slide">...</div>
    <div class="wp-block-slide">...</div>
    <div class="wp-block-slide">...</div>
  </div>
</div>
```

## Common Issues & Solutions

### Issue: view.mjs not loading (404)
**Solution:** Run `npm run build` again

### Issue: No console logs when clicking
**Solution:** 
- Check if `data-wp-interactive="core/slider"` is on the container
- Verify `data-wp-on--click="actions.nextSlide"` is on buttons

### Issue: Track not scrolling
**Solution:**
- Check if slides have content (need width)
- Verify track has `overflow-x: scroll` in computed styles
- Make sure slides have `width: 100%` and `flex-shrink: 0`

### Issue: "Track not found" in console
**Solution:**
- Refresh the page after building
- Delete old slider block and insert a new one

## File Structure

```
slider/
├── block.json          ← Config, viewScriptModule defined
├── index.js           ← JS registration
├── index.php          ← PHP registration, data-wp-interactive
├── edit.js            ← Editor component
├── save.js            ← Saves inner blocks structure
├── view.js            ← Interactivity API logic (WITH DEBUG LOGS)
├── style.scss         ← Frontend styles
└── README.md          ← Documentation

slider-track/
├── block.json
├── index.php          ← Sets data-wp-context, directives
├── save.js            ← Saves slides
├── style.scss         ← Scroll styles

slide/
├── block.json
├── save.js            ← Saves content
├── style.scss         ← Snap alignment, width

slider-controls/
├── block.json
├── index.php          ← Renders buttons with directives
└── save.js            ← Saves wrapper
```

## Next Steps

1. **Test keyboard navigation**: Arrow keys should also work
2. **Test mobile swipe**: Should work natively with touch
3. **Add Inspector Controls**: For slides-per-view settings
4. **Remove debug logs**: Once everything works
5. **Add unit tests**: Test store actions and callbacks

## Architecture Notes

### Why SSR + save.js?

Even dynamic blocks with `render_callback` need `save.js` to:
- Save inner block structure to database
- PHP receives this as `$content` parameter
- PHP wraps it with Interactivity API directives

### Interactivity API Flow:

1. **PHP renders** → HTML with `data-wp-*` attributes
2. **WordPress enqueues** → `view.mjs` from `viewScriptModule`
3. **view.js initializes** → `store('core/slider', {...})`
4. **User clicks button** → `data-wp-on--click="actions.nextSlide"`
5. **Action executes** → `track.scrollBy({left: width})`
6. **Scroll event fires** → `data-wp-on--scroll="actions.handleScroll"`
7. **State updates** → `context.currentIndex` changes
8. **Buttons react** → `data-wp-bind--disabled="state.isAtStart"`

Enjoy your weekend! The slider should work now. 🎉
