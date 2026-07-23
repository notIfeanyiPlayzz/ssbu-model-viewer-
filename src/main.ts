import * as THREE from 'three';

// 1. Initialize 3D Engine Variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
const container = document.getElementById('canvas-container')!;

function init3D() {
  // Create Scene and background color
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  // Configure Camera (Field of View, Aspect Ratio, Near plane, Far plane)
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 10, 25);

  // Setup Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Add Basic Ambient and Directional Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  // Add a simple ground grid system for reference alignment
  const gridHelper = new THREE.GridHelper(30, 30, 0x007acc, 0x444444);
  scene.add(gridHelper);

  // Add a placeholder cube so you know the viewport works immediately
  const geo = new THREE.BoxGeometry(2, 2, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x007acc });
  const cube = new THREE.Mesh(geo, mat);
  cube.position.y = 1; // Sit on top of the grid
  scene.add(cube);

  // Handle Window Resizing
  window.addEventListener('resize', onWindowResize);

  // Start the Animation Render Loop
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// 2. Folder Import Execution Engine
const importBtn = document.getElementById('import-btn')!;
const fileListUI = document.getElementById('file-list')!;

importBtn.addEventListener('click', async () => {
  try {
    // Open native folder dialog selection window
    // @ts-ignore (Avoid typescript syntax complaining about experimental API features)
    const dirHandle = await window.showDirectoryPicker();
    fileListUI.innerHTML = ''; // Clear prior entries

    // Recursively list target folder elements
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const li = document.createElement('li');
        li.textContent = `📄 ${file.name}`;
        fileListUI.appendChild(li);
        
        // TODO: Pass specific targeted extensions (.numdlb, .numshb) 
        // to your custom model parser modules here
      }
    }
  } catch (err) {
    console.error('Directory read operation cancelled or failed:', err);
  }
});

// Run application engine
init3D();
