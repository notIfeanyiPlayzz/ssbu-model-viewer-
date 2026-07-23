import * as THREE from 'three';
import { SSBUModFiles } from './types';

// Engine Architecture Variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
const container = document.getElementById('canvas-container')!;
const importBtn = document.getElementById('import-btn')!;
const fallbackInput = document.getElementById('fallback-input') as HTMLInputElement;
const fileListUI = document.getElementById('file-list')!;

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
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(5, 10, 7);
  scene.add(keyLight);

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
 * Validates file extensions and adds matching types to the active bundle
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

function resetModContext(): void {
  fileListUI.innerHTML = '';
  activeModContext.model = undefined;
  activeModContext.mesh = undefined;
  activeModContext.skeleton = undefined;
  activeModContext.material = undefined;
  activeModContext.textures = [];
}

function verifyImportResults(): void {
  if (!activeModContext.model && !activeModContext.mesh) {
    fileListUI.innerHTML = `<p style="text-align: center; color: #ff453a; font-size: 0.8rem; width: 100%;">No valid SSBU files found (.numdlb/.numshb).</p>`;
  } else {
    console.log("Assets verified and structured successfully:", activeModContext);
  }
}

/**
 * Chromium Path: Recursive Directory Scanner
 */
async function processDirectory(dirHandle: any): Promise<void> {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile() as File;
      evaluateAndStoreFile(file);
    } else if (entry.kind === 'directory') {
      await processDirectory(entry);
    }
  }
}

/**
 * Dynamic Click Event Routing Engine
 */
importBtn.addEventListener('click', async () => {
  // Check if browser natively supports the experimental direct picker API (Chrome/Edge)
  if ('showDirectoryPicker' in window) {
    try {
      // @ts-ignore
      const folderHandle = await window.showDirectoryPicker();
      resetModContext();
      await processDirectory(folderHandle);
      verifyImportResults();
    } catch (error) {
      console.warn("Directory picking was terminated or failed:", error);
    }
  } else {
    // Fallback Path: Trigger the hidden directory input element (Firefox/Safari)
    fallbackInput.click();
  }
});

/**
 * Fallback Path: Listens for file selection updates via traditional input data stream
 */
fallbackInput.addEventListener('change', () => {
  if (!fallbackInput.files || fallbackInput.files.length === 0) return;
  
  resetModContext();
  
  // Convert FileList collection into a standard array loop
  const discoveredFiles = Array.from(fallbackInput.files);
  for (const file of discoveredFiles) {
    evaluateAndStoreFile(file);
  }
  
  verifyImportResults();
});

// Run graphics application
initEngine();
