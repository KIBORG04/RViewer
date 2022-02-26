'use strict';

const load_demo = require('./lib/loader.js');
const read_icon = require('./lib/icon_reader.js');
const DemoPlayer = require('./lib/player.js');

document.addEventListener("DOMContentLoaded", async function () {
	let running = false;
	let main = document.createElement("div");
	main.className = "main"
	let fileSelect = document.createElement("input");
	fileSelect.className = "dropzone__input"
	let button_open_demo = document.createElement("div");
	let dropzone = document.createElement("div");
	dropzone.className = "dropzone";
	dropzone.innerHTML = "<div class='dropzone__thumb'><div>Drop here</div><div>demo file</div></div>"

	fileSelect.addEventListener("input", () => {
		button_open_demo.classList.add("open_demo__open");

		if (fileSelect.files.length) {
			updateFileName(dropzone, fileSelect.files[0]);
		}
	});

	let error = document.createElement("div");
	error.className = "error";
	error.textContent = "ERROR";
	fileSelect.type = "file";
	button_open_demo.className = "open_demo";
	button_open_demo.textContent = "Open demo from file";
	button_open_demo.addEventListener("click", () => {
		if (!fileSelect.files[0]) {
			error_open(error, "No file selected");
			return;
		}
		if (running) {
			return;
		}
		let status_holder = document.createElement("h1");
		status_holder.className = "text-center";
		status_holder.textContent = "Loading...";

		document.body.appendChild(status_holder);
		let reader = new FileReader();
		reader.onload = () => {
			if (running) {
				return;
			}
			let buf = reader.result;
			running = true;
			status_holder = document.createElement("h1");
			status_holder.className = "text-center";
			document.body.innerHTML = "";
			document.body.appendChild(status_holder);
			run_demo(buf, status_holder);
		};
		reader.readAsArrayBuffer(fileSelect.files[0]);
	});
	document.body.appendChild(main);
	dropzone.appendChild(fileSelect);
	main.appendChild(dropzone);
	main.appendChild(button_open_demo);
	document.body.appendChild(error)

	document.querySelectorAll(".dropzone__input").forEach((inputElement) => {
		const dropZoneElement = inputElement.closest(".dropzone");

		dropZoneElement.addEventListener("click", (e) => {
			inputElement.click();
		});

		inputElement.addEventListener("change", (e) => {
			if (inputElement.files.length) {
				updateFileName(dropZoneElement, inputElement.files[0]);
			}
		});

		dropZoneElement.addEventListener("dragover", (e) => {
			e.preventDefault();
			dropZoneElement.classList.add("dropzone__over");
		});

		["dragleave", "dragend"].forEach((type) => {
			dropZoneElement.addEventListener(type, (e) => {
				dropZoneElement.classList.remove("dropzone__over");
			});
		});

		dropZoneElement.addEventListener("drop", (e) => {
			e.preventDefault();
			button_open_demo.classList.add("open_demo__open");

			if (e.dataTransfer.files.length) {
				inputElement.files = e.dataTransfer.files;
				updateFileName(dropZoneElement, e.dataTransfer.files[0]);
			}

			dropZoneElement.classList.remove("dropzone__over");
		});
	});
});

function error_open(e, text = "ERROR") {
	e.classList.add("error__open");
	e.textContent = text
	setTimeout(function () { e.classList.remove("error__open"); }, 3800)
}

function updateFileName(dropZoneElement, file) {
	let thumbnailElement = dropZoneElement.querySelector(".dropzone__thumb");

	// First time - there is no thumbnail element, so lets create it
	if (thumbnailElement) {
		thumbnailElement.classList.add("dropzone__thumblabel")
		thumbnailElement.dataset.label = file.name;
	}
}


async function run_demo(buf, status_holder) {
	status_holder.textContent = "Parsing demo file...";
	let demo = await load_demo(buf);
	console.log(demo);

	status_holder.textContent = "Downloading icons...";
	let icons = new Map();
	let icon_promises = [];
	let completed = 0;

	for (let icon of demo.icons_used) {
		icon_promises.push((async () => {
			let url = "https://cdn.jsdelivr.net/gh/" + window.repository + "@" + demo.commit + "/" + icon;
			console.log(url);
			try {
				let icon_obj = await read_icon(url);
				icons.set(icon, icon_obj);
			} catch (e) {
				console.error(e);
			} finally {
				completed++;
				status_holder.textContent = "Downloading icons..." + (completed * 100 / demo.icons_used.length).toFixed(1) + "%";
			}
		})());
	}

	console.log(icons);
	window.demo_player = new DemoPlayer(demo, icons);
}
