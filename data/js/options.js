var defaultOrganism = "human";

function loadOptions() {
	var useOrganism = localStorage["useOrganism"];

	var select = document.getElementById("color");
	for (var i = 0; i < select.children.length; i++) {
		var child = select.children[i];
			if (child.value == useOrganism) {
			child.selected = "true";
			break;
		}
	}
}

function saveOptions() {
	var select = document.getElementById("organism");
	var organism = select.children[select.selectedIndex].value;
	console.log(organism)
	localStorage["useOrganism"] = organism;
}