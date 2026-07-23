import * as THREE from 'three';
import { SSBUModFiles } from './types';

// WebGL Engine Parameters
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
const container = document.getElementById('canvas-container')!;
const folderInput = document.getElementById('folder-input') as HTMLInputElement;
const fileListUI = document.getElementById('file-list')!;

// Active data stream tracking container
const activeModContext: SSBUModFiles = { textures: [] };

function initEngine(): void {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 5, 15);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(5, 10, 7);
  scene.add(light);

  const visualGrid = new THREE.GridHelper(20, 20, 0x0a84ff, 0x444446);
  scene.add(visualGrid);

  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshStandardMaterial({ color: 0x0a84ff, roughness: 0.4 });
  const meshPlaceholder = new THREE.Mesh(geometry, material);
  meshPlaceholder.position.y = 1;
  meshPlaceholder.name = "placeholder_cube";
  scene.add(meshPlaceholder);

  window.addEventListener('resize', handleResize);
  renderLoop();
}

function renderLoop(): void {
  requestAnimationFrame(renderLoop);
  const targetCube = scene.getObjectByName("placeholder_cube");
  if (targetCube) targetCube.rotation.y += 0.005;
  renderer.render(scene, camera);
}

function handleResize(): void {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Filter streaming file elements by targeted proprietary extensions
 */
function evaluateAndStoreFile(file: File): void {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'numdlb':
      activeModContext.model = file;
      appendFileToUI(file.name);
      break;
    case 'numshb':
      activeModContext.mesh = file;
      appendFileToUI(file.name);
      break;
    case 'nusktb':
      activeModContext.skeleton = file;
      appendFileToUI(file.name);
      break;
    case 'numatb':
      activeModContext.material = file;
      appendFileToUI(file.name);
      break;
    case 'nutexb':
      activeModContext.textures.push(file);
      appendFileToUI(file.name);
      break;
  }
}

function appendFileToUI(fileName: string): void {
  const item = document.createElement('li');
  item.className = 'file-item';
  item.textContent = `📄 ${fileName}`;
  fileListUI.appendChild(item);
}

/**
 * Native input element payload change trigger handler
 */
folderInput.addEventListener('change', () => {
  if (!folderInput.files || folderInput.files.length === 0) return;
  
  // Wipe tracking states clean for fresh import batches
  fileListUI.innerHTML = '';
  activeModContext.model = undefined;
  activeModContext.mesh = undefined;
  activeModContext.skeleton = undefined;
  activeModContext.material = undefined;
  activeModContext.textures = [];

  // Parse total flat file entry array data
  const uploadedFiles = Array.from(folderInput.files);
  for (const file of uploadedFiles) {
    evaluateAndStoreFile(file);
  }
  
  // Verify contents match requirement signatures
  if (!activeModContext.model && !activeModContext.mesh) {
    fileListUI.innerHTML = `<p style="text-align: center; color: #ff453a; font-size: 0.8rem; width: 100%;">No valid SSBU formats detected (.numdlb / .numshb).</p>`;
  } else {
    console.log("Mod folder assets grouped securely in application memory:", activeModContext);
  }
});

// Run engine initialization context
initEngine();

