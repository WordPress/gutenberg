import Panzoom from '@panzoom/panzoom';

(function () {

	document.addEventListener('DOMContentLoaded', function (e) {

		document.querySelectorAll('.wp-block-occ-rather-simple-panzoom .panzoom-element').forEach(function (item) {
			var panzoom = Panzoom(item, {
				minScale: 1.1,
				maxScale: 5,
				startScale: 1.1,
				animate: true,
				duration: 1000,
				origin: '50% 0'
			});

			var zoomInButton = item.parentElement.querySelector('.zoomin-button');
			var zoomOutButton = item.parentElement.querySelector('.zoomout-button');

			zoomInButton.addEventListener('click', panzoom.zoomIn);
			zoomOutButton.addEventListener('click', panzoom.zoomOut);

			item.parentElement.addEventListener('wheel', function (e) {
				if (!e.ctrlKey) return
				panzoom.zoomWithWheel(e)
			});
	});

});

}) ();