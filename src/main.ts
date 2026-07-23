import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SSBUModFiles } from './types';
import { parseSmashMesh } from './meshParser';

// Global Engine Variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

const container = document.getElementById('canvas-container')!;
const folderInput = document.getElementById('folder-input') as HTMLInputElement;
const fileListUI = document.getElementById('file-list')!;
const activeModContext: SSBUModFiles = { textures: [] };

// Track files inside a local temporary flat array map cache for fast lookup selection
let loadedFileMemoryCache: File[] = [];

// --- 1. RUN THE GRAPHICS ENGINE IMMEDIATELY ---
initEngine();

function initEngine(): void {
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 6, 12);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2, 0);
    controls.minDistance = 2;
    controls.maxDistance = 50;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 10, 7);
    scene.add(light);

    const visualGrid = new THREE.GridHelper(20, 20, 0x0a84ff, 0x444446);
    scene.add(visualGrid);

    // Initial placeholder item configuration
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x0a84ff, roughness: 0.4 });
    const meshPlaceholder = new THREE.Mesh(geometry, material);
    meshPlaceholder.position.y = 1;
    meshPlaceholder.name = "placeholder_cube";
    scene.add(meshPlaceholder);

    window.addEventListener('resize', handleResize);
    renderLoop();
  } catch (err) {
    console.error("Critical failure during WebGL initialization context:", err);
  }
}

function renderLoop(): void {
  requestAnimationFrame(renderLoop);
  if (controls) controls.update();
  
  const targetCube = scene.getObjectByName("placeholder_cube");
  if (targetCube) targetCube.rotation.y += 0.003;

  if (renderer && scene && camera) renderer.render(scene, camera);
}

function handleResize(): void {
  if (!camera || !renderer || !container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- 2. FILE HANDLING SYSTEMS ---

function evaluateAndStoreFile(file: File): void {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  // Track all discovered compatible files inside our runtime access cache list index mapping
  if (['numdlb', 'numshb', 'nusktb', 'numatb', 'nutexb'].includes(fileExtension || '')) {
    loadedFileMemoryCache.push(file);
    const assignedIndex = loadedFileMemoryCache.length - 1;
    appendFileToUI(file.name, assignedIndex);
  }

  switch (fileExtension) {
    case 'numdlb': activeModContext.model = file; break;
    case 'numshb': activeModContext.mesh = file; break;
    case 'nusktb': activeModContext.skeleton = file; break;
    case 'numatb': activeModContext.material = file; break;
    case 'nutexb': activeModContext.textures.push(file); break;
  }
}

function appendFileToUI(fileName: string, cacheIndex: number): void {
  const item = document.createElement('li');
  item.className = 'file-item';
  item.textContent = `📄 ${fileName}`;
  // Store the array cache indicator reference onto the DOM list object element safely
  item.setAttribute('data-cache-index', cacheIndex.toString());
  fileListUI.appendChild(item);
}

function resetModContext(): void {
  fileListUI.innerHTML = '';
  loadedFileMemoryCache = [];
  activeModContext.model = undefined;
  activeModContext.mesh = undefined;
  activeModContext.skeleton = undefined;
  activeModContext.material = undefined;
  activeModContext.textures = [];
}

/**
 * Direct file parsing pipeline processor engine
 */
async function renderTargetMeshFile(meshFile: File): Promise<void> {
  try {
    const fileBuffer = await meshFile.arrayBuffer();
    
    // Unpack data maps
    const unpackedMeshData = parseSmashMesh(fileBuffer);

    // Wipe any existing assets from your tracking view layer explicitly
    const originalCube = scene.getObjectByName("placeholder_cube");
    if (originalCube) scene.remove(originalCube);
    
    const existingCharacter = scene.getObjectByName("active_character_mesh");
    if (existingCharacter) {
      // Dispose geometry and materials out of GPU memory to stop resource leakage leaks
      if ('geometry' in existingCharacter) (existingCharacter.geometry as THREE.BufferGeometry).dispose();
      scene.remove(existingCharacter);
    }

    const meshGeometry = new THREE.BufferGeometry();
    meshGeometry.setAttribute('position', new THREE.BufferAttribute(unpackedMeshData.positions, 3));
    meshGeometry.setIndex(new THREE.BufferAttribute(unpackedMeshData.indices, 1));
    
    // Force WebGL to map tracking normals and limits from data pools
    meshGeometry.computeVertexNormals();
    meshGeometry.computeBoundingBox();
    meshGeometry.computeBoundingSphere();

    const renderMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8e8e93, 
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide,
      wireframe: false // Switch this to true if you ever want to check wireframe polygon flow lines!
    });

    const characterMesh = new THREE.Mesh(meshGeometry, renderMaterial);
    characterMesh.name = "active_character_mesh";
    characterMesh.position.set(0, 0, 0); 
    
    scene.add(characterMesh);

    // Dynamic Camera Autofocus: Centers your Orbit camera target onto the geometry bounds automatically
    if (meshGeometry.boundingSphere) {
      const radius = meshGeometry.boundingSphere.radius;
      controls.maxDistance = radius * 10;
      camera.lookAt(meshGeometry.boundingSphere.center);
    }

    console.log(`Successfully parsed and rendered active asset mesh: ${meshFile.name}`);
  } catch (parseError) {
    console.error("Binary mesh mapping pipeline aborted during component swap:", parseError);
  }
}

// --- 3. UNIVERSAL INTERACTION LISTENERS ---

const importBtn = document.getElementById('import-btn')!;

// File List Sidebar Item Selection Handler Listener Click Action Event Routing
fileListUI.addEventListener('click', async (e) => {
  const targetElement = e.target as HTMLElement;
  const itemElement = targetElement.closest('.file-item');
  if (!itemElement) return;

  const rawIndex = itemElement.getAttribute('data-cache-index');
  if (rawIndex === null) return;

  const cachedFileIndex = parseInt(rawIndex, 10);
  const selectedTargetFile = loadedFileMemoryCache[cachedFileIndex];

  console.log(`User clicked sidebar entry list row asset element file: ${selectedTargetFile.name}`);

  // Highlight selection states visually inside the browser UI view frame
  document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active-selection'));
  itemElement.classList.add('active-selection');

  // Trigger geometry display routines if the user specifically picks a valid alternate target .numshb mesh wrapper
  if (selectedTargetFile.name.toLowerCase().endsWith('.numshb')) {
    await renderTargetMeshFile(selectedTargetFile);
  } else {
    console.log(`Selected layout data file type tracking structure info log attributes: ${selectedTargetFile.name}`);
    // Additional conditional branches like texture lookups go here
  }
});

async function runTauriDesktopImport() {
  try {
    const tauriApiDialog = '@tauri-apps/plugin-dialog';
    const tauriApiFs = '@tauri-apps/plugin-fs';
    
    // @ts-ignore
    const dialog = await import(/* @vite-ignore */ tauriApiDialog);
    // @ts-ignore
    const fs = await import(/* @vite-ignore */ tauriApiFs);
    
    const selectedDir = await dialog.open({ directory: true, multiple: false });
    if (!selectedDir || typeof selectedDir !== 'string') return;
    
    resetModContext();
    
    const entries = await fs.readDir(selectedDir, { recursive: true });
    for (const entry of entries) {
      if (entry.name) {
        const fileData = await fs.readBinaryFile(entry.path);
        const mockFile = new File([fileData], entry.name);
        evaluateAndStoreFile(mockFile);
      }
    }
    await verifyImportResults();
  } catch (err) {
    console.error("Desktop native filesystem error:", err);
  }
}

importBtn.addEventListener('click', (e) => {
  if ('__TAURI_METADATA__' in window) {
    e.preventDefault();
    runTauriDesktopImport();
  } else {
    folderInput.click();
  }
});

folderInput.addEventListener('change', async () => {
  if (!folderInput.files || folderInput.files.length === 0) return;
  resetModContext();
  const uploadedFiles = Array.from(folderInput.files);
  for (const file of uploadedFiles) {
    evaluateAndStoreFile(file);
  }
  await verifyImportResults();
});
function verifyImportResults() {
  throw new Error('Function not implemented.');
}



