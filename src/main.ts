import * as THREE from 'three';
import { SSBUModFiles } from './types';

// Global Engine Variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
const container = document.getElementById('canvas-container')!;
const importBtn = document.getElementById('import-btn')!;
const fileListUI = document.getElementById('file-list')!;

// Active imported data pointer tracking
const activeModContext: SSBUModFiles = { textures: [] };

/**
 * Initialize core 3D scene elements
 */
function initEngine(): void {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 5, 15);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Setup generic stage lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(5, 10, 7);
  scene.add(keyLight);

  // Reference grid system mapping out world tracking boundaries
  const visualGrid = new THREE.GridHelper(20, 20, 0x0a84ff, 0x444446);
  scene.add(visualGrid);

  // Fallback structural rendering placeholder cube
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
  
  // Rotate fallback cube while waiting for file streams
  const targetCube = scene.getObjectByName("placeholder_cube");
  if (targetCube) {
    targetCube.rotation.y += 0.005;
  }

  renderer.render(scene, camera);
}

function handleResize(): void {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Recursive background process traversing folder entries safely
 */
async function processDirectory(dirHandle: any): Promise<void> {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile() as File;
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
    } else if (entry.kind === 'directory') {
      // Recurse down subfolders looking for deep nested models
      await processDirectory(entry);
    }
  }
}

function appendFileToUI(fileName: string): void {
  const item = document.createElement('li');
  item.className = 'file-item';
  item.textContent = `📄 ${fileName}`;
  fileListUI.appendChild(item);
}

/**
 * Handle native directory selection actions safely
 */
importBtn.addEventListener('click', async () => {
  try {
    // @ts-ignore - showDirectoryPicker is an experimental modern API feature
    const folderHandle = await window.showDirectoryPicker();
    
    // Clear initial layout states
    fileListUI.innerHTML = '';
    activeModContext.textures = [];
    
    await processDirectory(folderHandle);

    if (!activeModContext.model && !activeModContext.mesh) {
      fileListUI.innerHTML = `<p style="text-align: center; color: #ff453a; font-size: 0.8rem;">No SSBU .numdlb/.numshb files found.</p>`;
    } else {
      console.log("Ready to execute custom parser layers: ", activeModContext);
      // Next integration step: passing binary data payloads to array buffers
    }
  } catch (error) {
    console.warn("Folder parsing operation rejected or crashed:", error);
  }
});

// Fire system initialization engine
initEngine();
